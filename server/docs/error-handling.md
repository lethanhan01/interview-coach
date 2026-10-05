# Error Handling & Resiliency Developer Guide

> **InterviewCoach Backend (`@server`)** — Tài liệu hướng dẫn toàn diện về kiến trúc xử lý lỗi, chuẩn hóa phản hồi, bọc ranh giới Worker BullMQ, phân luồng SSE Realtime và truy vết Observability phân tán.

---

## 1. Tổng quan Kiến trúc (Architecture Overview)

Hệ thống xử lý ngoại lệ của InterviewCoach áp dụng mô hình phân lớp thống nhất, đảm bảo tính nhất quán trên 3 môi trường thực thi: **HTTP API**, **Background Worker (BullMQ)**, và **Realtime SSE / Redis**:

```mermaid
graph TD
    subgraph HTTP [HTTP Request Pipeline]
        Req[Client Request] --> MW[RequestIdMiddleware<br/>Binds RequestContext]
        MW --> Val[ValidationPipe<br/>validationErrorFactory]
        Val --> Ctrl[Controller]
        Ctrl --> UseCase[Use Case Service]
        UseCase --> ExFilter[InterviewAIExceptionFilter]
        ExFilter --> Resp[Unified Error Envelope<br/>{ success: false, error, meta }]
    end

    subgraph Worker [Worker / BullMQ Pipeline]
        Job[BullMQ Job] --> BQHandler[BullMqJobErrorHandler<br/>Restores RequestContext]
        BQHandler --> Proc[Processor.process()]
        Proc -->|Fatal 4xx / Schema| Unrec[UnrecoverableError<br/>Halt retry immediately]
        Proc -->|Transient 5xx / Timeout| Retry[Exponential Backoff Retry]
    end

    subgraph Realtime [Realtime SSE Channel]
        SSEProc[Processor / Service] -->|emitError| SseSvc[SseService.emitError()]
        SseSvc --> ClientSSE[Frontend EventSource<br/>event: error]
    end
```

---

## 2. Chuẩn hóa Định dạng Response (Unified Error Envelope)

Mọi phản hồi lỗi trả về từ API đều có cấu trúc cố định:

```typescript
export interface UnifiedErrorEnvelope {
  success: false;
  error: {
    code: string;              // Mã lỗi định danh từ ErrorCode enum
    message: string;           // Thông báo lỗi thân thiện cho lập trình viên/người dùng
    details?: Record<string, unknown> | Record<string, string[]>; // Chi tiết validation lỗi theo field
  };
  meta: {
    requestId: string;         // ID duy nhất cho request (VD: req-1728100000-xxxx)
    correlationId: string;     // ID xuyên suốt chuỗi nghiệp vụ (từ header X-Correlation-ID hoặc sinh mới)
    timestamp: string;         // Thời điểm phát sinh lỗi ISO 8601
    path: string;              // Endpoint HTTP phát sinh lỗi
  };
}
```

### Ví dụ lỗi Validation (HTTP 400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["email must be an email"],
      "password": ["password must be longer than or equal to 12 characters"]
    }
  },
  "meta": {
    "requestId": "req-1728100123-abcd",
    "correlationId": "corr-uuid-5678",
    "timestamp": "2026-10-05T10:15:30.000Z",
    "path": "/api/v1/auth/register"
  }
}
```

### Bảo mật trên Môi trường Production:
- Với lỗi hệ thống `HTTP 500` (`INTERNAL_SERVER_ERROR`), toàn bộ stack trace và chi tiết nội bộ được ẩn hoàn toàn:
  ```json
  {
    "success": false,
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "Internal server error"
    },
    "meta": {
      "requestId": "req-...",
      "correlationId": "corr-...",
      "timestamp": "...",
      "path": "..."
    }
  }
  ```
- Chi tiết kỹ thuật và stack trace đầy đủ chỉ hiển thị khi `NODE_ENV !== 'production'`.

---

## 3. Cách Sử dụng `InterviewAIException`

### Cú pháp Chuẩn:
```typescript
import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

throw new InterviewAIException(
  ErrorCode.SESSION_NOT_FOUND,
  HttpStatus.NOT_FOUND,
  `Phiên phỏng vấn ${sessionId} không tồn tại hoặc đã bị xóa.`,
  {
    details: { sessionId },
    metadata: { userId, trigger: 'user_action' },
    isOperational: true,
  },
);
```

### Phân loại Lỗi Operational vs Non-Operational:
- **`isOperational: true` (Mặc định)**: Lỗi nghiệp vụ dự liệu trước được (Sai mật khẩu, Session hết hạn, Tham số không hợp lệ). Lọc và log ở mức độ `WARN` hoặc `INFO`.
- **`isOperational: false`**: Lỗi sập hệ thống không mong muốn (Lỗi logic code, ngoại lệ thư viện thứ 3 chưa bắt). Lọc và log ở mức `ERROR` kèm đầy đủ stack trace.

---

## 4. Prisma & Database Safety Net (`PrismaErrorMapper`)

Bộ lọc `InterviewAIExceptionFilter` tích hợp `PrismaErrorMapper` tự động chuyển đổi mã lỗi Prisma thành HTTP Exception mà không cần viết `try/catch` boilerplate ở mỗi repository/service:

| Prisma Code | Ý nghĩa | Mã lỗi Hệ thống | HTTP Status |
| :--- | :--- | :--- | :--- |
| `P2002` | Unique constraint failed (trùng khóa duy nhất) | `RESOURCE_ALREADY_EXISTS` | `409 CONFLICT` |
| `P2025` | Record to update/delete not found | `RESOURCE_NOT_FOUND` | `404 NOT_FOUND` |
| `P2003` | Foreign key constraint failed | `BAD_REQUEST` | `400 BAD_REQUEST` |
| `P1001`, `P1002` | Database connection timeout / unreachable | `SERVICE_UNAVAILABLE` | `503 SERVICE_UNAVAILABLE` |
| Các mã khác | Lỗi cơ sở dữ liệu nội bộ | `DATABASE_ERROR` | `500 INTERNAL_SERVER_ERROR` |

---

## 5. Worker & Background Job Boundaries (`BullMqJobErrorHandler`)

Khi chạy dưới vai trò Worker (`RUNTIME_ROLE=worker`), không có HTTP Filter bảo vệ. Tất cả 4 BullMQ Processors bắt buộc phải bọc xử lý thông qua `BullMqJobErrorHandler`:

```typescript
@Processor(REPORT_QUEUE)
export class ComprehensiveReportProcessor extends WorkerHost {
  constructor(private readonly generateReport: GenerateComprehensiveReport) {
    super();
  }

  process(job: Job<ComprehensiveReportJobDto>): Promise<void> {
    return BullMqJobErrorHandler.handleJobExecution(
      ComprehensiveReportProcessor.name,
      job,
      () => this.generateReport.execute(job.data),
    );
  }
}
```

### Cơ chế Hoạt động:
1. **Context Propagation**: Khôi phục `correlationId` từ payload của Job hoặc parent job ID vào `RequestContext`.
2. **Phân loại Lỗi Fatal vs Transient**:
   - **Fatal Errors** (4xx, Not Found, Schema, Bad Request, Unauthorized): Ném `UnrecoverableError` của BullMQ ➔ Dừng retry ngay lập tức, chuyển job sang trạng thái `failed`.
   - **Transient Errors** (5xx, AI Gateway Timeout, ECONNRESET): Ném lỗi gốc ➔ BullMQ tự động kích hoạt retry theo chính sách exponential backoff đã cấu hình.

---

## 6. Phân luồng Realtime SSE (`SseService.emitError`)

Khi truyền thông tin lỗi tiến trình về Frontend qua Server-Sent Events:

```typescript
await this.sseService.emitError(
  `sse:session:${sessionId}`,
  ErrorCode.AI_TIMEOUT,
  'Hệ thống AI đang phản hồi chậm. Đang kích hoạt cơ chế dự phòng.',
);
```

Client nhận sự kiện với định dạng chuẩn:
```json
{
  "event": "error",
  "data": {
    "error": {
      "code": "AI_TIMEOUT",
      "message": "Hệ thống AI đang phản hồi chậm. Đang kích hoạt cơ chế dự phòng."
    },
    "timestamp": "2026-10-05T10:15:30.000Z"
  }
}
```

---

## 7. Khách hàng Frontend (`@client/lib/api-client.ts`)

Lớp `ApiClientError` tại Client tự động giải nén cấu trúc Unified Error Envelope:

```typescript
try {
  await apiClient.post('/sessions', data);
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error('Mã lỗi:', error.code);          // VD: VALIDATION_ERROR
    console.error('Thông báo:', error.message);       // Message từ server
    console.error('Chi tiết:', error.details);       // { email: [...] }
    console.error('Trace ID:', error.correlationId); // corr-uuid-1234
  }
}
```

---

## 8. Bảng Quy tắc Do's & Don'ts

| Hành động | Do (Nên làm) ✅ | Don't (Không được làm) ❌ |
| :--- | :--- | :--- |
| **Ném ngoại lệ** | `throw new InterviewAIException(ErrorCode.XYZ, HttpStatus.XYZ, '...')` | `throw new Error('Something failed')` hoặc `throw new BadRequestException('...')` |
| **Validation** | Khai báo DTO decorator (`@IsString`, `@IsEmail`), dùng `validationErrorFactory` | Tự `if (!email) throw new Error(...)` rải rác |
| **Prisma Query** | Để `PrismaErrorMapper` tự động chuyển đổi mã `P2002`, `P2025` | `try { ... } catch (e) { throw new Error(e.message) }` |
| **Background Job** | Bọc bằng `BullMqJobErrorHandler.handleJobExecution` | Thực thi trực tiếp trong `process()` không có error boundary |
| **Logging** | Dùng `AppLogger` với structured context, tự động lọc PII | Dùng `console.log` hoặc log plaintext chứa password/token |
