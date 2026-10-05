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

## 8. Bảng Quy tắc Do's & Don'ts (Anti-Patterns Checklist)

| Hành động | Do (Nên làm) ✅ | Don't (Không được làm) ❌ | Lý do & Biện pháp Khắc phục |
| :--- | :--- | :--- | :--- |
| **Ném ngoại lệ** | `throw new InterviewAIException(ErrorCode.XYZ, HttpStatus.XYZ, '...')` | `throw new Error('Something failed')` hoặc `throw new BadRequestException('...')` | Đảm bảo tính nhất quán 100% qua một class ngoại lệ duy nhất; giữ trọn vẹn `ErrorCode` enum và HTTP status. |
| **Validation DTO** | Khai báo DTO decorator (`@IsString`, `@IsEmail`), dùng `validationErrorFactory` | Tự `if (!email) throw new Error(...)` rải rác trong Controller/Service | Tự động hóa kiểm tra kiểu, gom nhóm dictionary theo field và trả về HTTP 400 chuẩn. |
| **Prisma Query** | Để `PrismaErrorMapper` tự động chuyển đổi mã `P2002`, `P2025`, `P1001` | `try { ... } catch (e) { throw new Error(e.message) }` | Loại bỏ boilerplate; ngăn ngừa leak tên bảng, column nội bộ hoặc database connection URL. |
| **Background Job** | Bọc bằng `BullMqJobErrorHandler.handleJobExecution` trong Worker | Thực thi trực tiếp trong `process()` không có error boundary | Phân loại chính xác Fatal (4xx -> dừng retry) vs Transient (5xx -> retry); lan truyền `correlationId`. |
| **Logging** | Dùng `AppLogger` với structured context, tự động lọc PII | Dùng `console.log` / `console.error` hoặc log plaintext chứa password/token | Đảm bảo log JSON có `correlationId`, `userId`, `durationMs` và che chắn PII (`***REDACTED***`). |
| **Kiểm tra lỗi Client** | Dựa trên `error.code` (`ErrorCode.XYZ`) hoặc `ApiClientError` | So sánh chuỗi ký tự `if (err.message === '...')` | Message có thể thay đổi hoặc địa phương hóa (i18n), trong khi `code` là bất biến. |
| **Phản hồi Controller** | Return DTO / Model, để Filter tự động format envelope | Thủ công `res.status(500).json(error)` trong Controller | Giữ Presentation layer mỏng, tách biệt hoàn toàn format response lỗi về Global Filter. |

---

## 9. Đồng bộ Hợp đồng Lỗi Phía Client (`@client/lib/api-client.ts`)

Lớp `ApiClientError` tại Client tự động giải nén cấu trúc Unified Error Envelope và bảo toàn `correlationId`:

```typescript
export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, string[]>;
  readonly correlationId?: string;
  readonly originalError?: unknown;
}
```

Bảng mã lỗi chuẩn hóa tại Client (`API_ERROR_MESSAGES`):

| ErrorCode Server | Ý nghĩa Nghiệp vụ | Client Thông báo Thân thiện |
| :--- | :--- | :--- |
| `INVALID_CREDENTIALS` | Sai email hoặc mật khẩu | "Email hoặc mật khẩu không chính xác." |
| `EMAIL_ALREADY_EXISTS` | Email đã được đăng ký | "Email này đã được sử dụng. Vui lòng chọn email khác." |
| `EMAIL_NOT_VERIFIED` | Tài khoản chưa kích hoạt | "Email chưa được xác thực. Vui lòng kiểm tra hộp thư." |
| `SERVICE_UNAVAILABLE` | Database/Hạ tầng tạm thời gián đoạn | "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau." |
| `AI_TIMEOUT` | Lời gọi AI vượt quá thời gian cho phép | "Hệ thống AI phản hồi chậm. Vui lòng thử lại sau ít phút." |
| `AI_QUOTA_EXCEEDED` | Hết hạn mức AI | "Hệ thống đang quá tải hạn mức AI. Vui lòng thử lại sau." |
| `REQUEST_IN_PROGRESS` | Thao tác cùng khóa idempotency đang xử lý | "Thao tác đang được xử lý, vui lòng không gửi yêu cầu liên tục." |

### 9.1. Khóa Chống Trùng lặp (HTTP REST Idempotency)
Client có thể truyền header `Idempotency-Key: <uuid-v4>` (hoặc tùy chọn `idempotencyKey` trong `RequestOptions` của `apiClient`) khi thực hiện các yêu cầu mutation (`POST`, `PUT`, `PATCH`, `DELETE`):
- **Request đang xử lý (`IN_PROGRESS`)**: Server ném HTTP 409 `REQUEST_IN_PROGRESS`. Client hiển thị thông báo cảnh báo thân thiện và tránh spam request.
- **Request đã hoàn thành (`COMPLETED`)**: Server trả về kết quả nguyên vẹn từ Redis cache kèm headers `Idempotent-Replay: true` và `X-Cache-Lookup: HIT`, không kích hoạt lại use case.
- **Phát hiện Payload Mismatch (SHA-256)**: Nếu gửi cùng key nhưng thay đổi request body, server ném HTTP 409 `CONFLICT` để bảo vệ tính toàn vẹn dữ liệu.
- **Khả năng phục hồi (Fail-Open)**: Khi Redis mất kết nối, hệ thống ghi log cảnh báo và cho phép request tiếp tục chạy, không làm gián đoạn buổi phỏng vấn.

---

## 10. Bộ Lệnh Kiểm thử & Xác minh Tự động (Testing & Verification)

Trước khi commit mã nguồn hoặc tạo Pull Request, kỹ sư bắt buộc chạy các lệnh kiểm thử sau:

```bash
# 1. Kiểm tra ranh giới kiến trúc (Architecture Boundaries)
npm run test:arch

# 2. Kiểm thử 5 nhóm kịch bản Error Boundary & Anti-Leak (Supertest)
npm test -- error-boundary.spec.ts

# 3. Kiểm thử Lan truyền Trace & Correlation-ID (HTTP -> Context -> BullMQ -> Worker)
npm test -- observability-trace.spec.ts

# 4. Chạy script terminal xác minh Traceability & Observability trực quan
npm run check:observability

# 5. Kiểm tra tuân thủ bộ quy ước kỹ thuật backend (Conventions Checker)
npm run check:conventions

# 6. Chạy toàn bộ Unit Test Suites
npm test

# 7. Kiểm tra tính toàn vẹn biên dịch TypeScript (Nest Build & Prisma)
npm run build
```

