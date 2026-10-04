# ERROR HANDLING SYSTEM — AUDIT, REDESIGN & MIGRATION MASTER PLAN

> **Tài liệu**: Master Plan Kiểm toán, Tái thiết kế Kiến trúc & Lộ trình Chuyển đổi Toàn diện Hệ thống Quản trị Lỗi (Error Handling Architecture)  
> **Dự án**: InterviewCoach Monorepo (`server` & `client`)  
> **Tác giả / Vai trò**: Senior Backend Engineer / Software Architect  
> **Trạng thái**: Đã phê duyệt qua Grill-Me — Sẵn sàng triển khai  
> **Phiên bản**: 2.0 (Enterprise Specification)

---

## MỤC LỤC CHI TIẾT (22 PHASES)

1. [Phần 0 — Mục tiêu & Tuyên ngôn Kiến trúc (Core Principles & Mission)](#phần-0--mục-tiêu--tuyên-ngôn-kiến-trúc)
2. [Phase 1 — Phân tích Hệ thống & Kiến trúc Đa tiến trình (System Discovery)](#phase-1--phân-tích-hệ-thống--kiến-trúc-đa-tiến-trình)
3. [Phase 2 — Kiểm kê Toàn bộ Hiện trạng Lỗi trong Codebase (Complete Error Inventory)](#phase-2--kiểm-kê-toàn-bộ-hiện-trạng-lỗi-trong-codebase)
4. [Phase 3 — Báo cáo Kiểm toán Xử lý Lỗi (Error Handling Audit Report)](#phase-3--báo-cáo-kiểm-toán-xử-lý-lỗi)
5. [Phase 4 — Thiết kế Cây Phân loại Ngoại lệ Chuẩn (Canonical Error Taxonomy)](#phase-4--thiết-kế-cây-phân-loại-ngoại-lệ-chuẩn)
6. [Phase 5 — Mô hình Dữ liệu Lỗi Chuẩn: `InterviewAIException` v2 (Error Model)](#phase-5--mô-hình-dữ-liệu-lỗi-chuẩn)
7. [Phase 6 — Bộ Quy chuẩn Xử lý Lỗi Bắt buộc (7 Cardinal Error Conventions)](#phase-6--bộ-quy-chuẩn-xử-lý-lỗi-bắt-buộc)
8. [Phase 7 — Chuẩn hóa Hợp đồng API Error Response (Client & Server Contract)](#phase-7--chuẩn-hóa-hợp-đồng-api-error-response)
9. [Phase 8 — Bộ lọc Lỗi Toàn cục (Global Exception Filter Pipeline)](#phase-8--bộ-lọc-lỗi-toàn-cục)
10. [Phase 9 — Bộ Chuyển đổi Lỗi Tầng Hạ tầng (Infrastructure Error Mappers)](#phase-9--bộ-chuyển-đổi-lỗi-tầng-hạ-tầng)
11. [Phase 10 — Hệ thống Request ID & Correlation ID Tracing (`AsyncLocalStorage`)](#phase-10--hệ-thống-request-id--correlation-id-tracing)
12. [Phase 11 — Chiến lược Ghi Log Có Cấu trúc & Bảo mật (`AppLogger`)](#phase-11--chiến-lược-ghi-log-có-cấu-trúc--bảo-mật)
13. [Phase 12 — Chính sách Thử lại Toàn diện (Retry Policy & Exponential Backoff)](#phase-12--chính-sách-thử-lại-toàn-diện)
14. [Phase 13 — Chính sách Giới hạn Thời gian Chờ (Timeout Policy)](#phase-13--chính-sách-giới-hạn-thời-gian-chờ)
15. [Phase 14 — Chiến lược Dự phòng & Phục hồi AI (Model Fallback & Circuit Breaker)](#phase-14--chiến-lược-dự-phòng--phục-hồi-ai)
16. [Phase 15 — Bảo đảm Tính Toàn vẹn Dữ liệu & Idempotency (Transaction Audit)](#phase-15--bảo-đảm-tính-toàn-vẹn-dữ-liệu--idempotency)
17. [Phase 16 — Lộ trình Triển khai 5 Milestone Chi tiết (Implementation Roadmap)](#phase-16--lộ-trình-triển-khai-5-milestone-chi-tiết)
18. [Phase 17 — Nguyên tắc Chuyển đổi An toàn & Không Gián đoạn (Migration Rules)](#phase-17--nguyên-tắc-chuyển-đổi-an-toàn)
19. [Phase 18 — Chiến lược Kiểm thử Tự động Toàn diện (Testing Strategy & QA)](#phase-18--chiến-lược-kiểm-thử-tự-động-toàn-diện)
20. [Phase 19 — Xác minh Khả năng Quan sát Thực tế (Observability Validation)](#phase-19--xác-minh-khả-năng-quan-sát-thực-tế)
21. [Phase 20 — Tài liệu hóa Hướng dẫn Developer (Developer Guide & Conventions)](#phase-20--tài-liệu-hóa-hướng-dẫn-developer)
22. [Phase 21 — Danh mục Tự Đánh giá & Rà soát (Code Review Checklist)](#phase-21--danh-mục-tự-đánh-giá--rà-soát)
23. [Phase 22 — Báo cáo Nghiệm thu & Quản trị Nợ Kỹ thuật (Final Audit Deliverables)](#phase-22--báo-cáo-nghiệm-thu--quản-trị-nợ-kỹ-thuật)

---

## PHẦN 0 — MỤC TIÊU & TUYÊN NGÔN KIẾN TRÚC

Hệ thống **InterviewCoach** là một nền tảng phỏng vấn mô phỏng ứng dụng AI (Mock Interview Engine) với các yêu cầu khắt khe về tính ổn định, độ trễ và khả năng chống chịu lỗi (Resilience). Hệ thống phải xử lý đồng thời nhiều loại luồng dữ liệu:
- HTTP REST API cho chuẩn bị câu hỏi, xác thực, quản lý người dùng, tra cứu taxonomy SFIA/O*NET.
- WebSocket Realtime cho phiên phỏng vấn tương tác âm thanh trực tiếp (`interview-live`).
- Background Workers (`BullMQ`) cho các tác vụ tính toán nặng: Speech-to-Text (Whisper), Multi-turn AI Assessment, sinh báo cáo toàn diện.

Mục tiêu của kế hoạch này là thiết kế và triển khai một **Hệ thống Quản trị Lỗi (Error Handling Architecture) cấp độ Enterprise**:
1. **Correctness (Độ chính xác)**: Không có ngoại lệ nào bị nuốt âm thầm (swallowed) gây hiểu nhầm thành công, không để lỗi hạ tầng tự phát thành HTTP 500 không rõ nguyên nhân.
2. **Consistency (Tính nhất quán)**: Một chuẩn API Contract duy nhất cho toàn bộ HTTP API; một cơ chế Error Envelope thống nhất cho WebSocket; một chiến lược phân loại Retry/Fatal rõ ràng cho BullMQ Workers.
3. **Observability (Khả năng quan sát)**: Mỗi lỗi phát sinh đều có thể truy vết thông qua `correlationId` xuyên suốt từ HTTP Middleware ➔ Use Case Service ➔ External AI Client ➔ BullMQ Worker.
4. **Security (Bảo mật)**: Tuyệt đối không leak SQL schema, câu lệnh raw query, file path hệ thống, stack trace, hoặc access key của bên thứ ba ra ngoài client trên môi trường Production.
5. **Maintainability & Minimal Overhead**: Tối ưu trên nền tảng sẵn có của dự án (`InterviewAIException`, NestJS Filters, Prisma, BullMQ), không đẻ thêm các lớp abstraction trừu tượng quá mức (over-engineering).

---

## PHASE 1 — PHÂN TÍCH HỆ THỐNG & KIẾN TRÚC ĐA TIẾN TRÌNH

### 1.1. Cấu trúc 3-Layer Clean Architecture & Bounded Contexts
Backend được cấu trúc thành 3 tầng nghiêm ngặt được giám sát tự động bằng test kiến trúc (`architecture.spec.ts`):
- **Tầng 1 — Core (`server/src/core/`)**: Nền tảng kỹ thuật dùng chung (`common`, `config`, `runtime`). Không chứa logic nghiệp vụ và không phụ thuộc ngược vào Business Modules.
- **Tầng 2 — Infrastructure (`server/src/infrastructure/`)**: Tích hợp công nghệ bên ngoài:
  - `database/prisma`: PostgreSQL ORM.
  - `ai`: OpenAI API, Whisper Client, Gemini, Zod validation pipelines.
  - `storage`: Quản lý lưu trữ file âm thanh (`local-disk` hoặc `supabase`).
  - `workflow`: Quản lý hàng đợi tác vụ nền BullMQ và Transactional Outbox.
  - `realtime`: WebSocket Gateways và Redis pub/sub.
- **Tầng 3 — Business Modules (`server/src/modules/`)**: Các Bounded Contexts độc lập:
  - `auth`, `user`, `candidate-profile`.
  - `interview-prep`: Ngân hàng câu hỏi, JD parsing, sinh câu hỏi mục tiêu.
  - `interview-live`: Quản lý phiên phỏng vấn, thu nạp câu trả lời voice/text.
  - `interview-assessment`: Chấm điểm rubric, tính toán radar chart, sinh báo cáo tổng hợp.
  - `media`: Xử lý streaming audio, bóc băng giọng nói, phân tích voice metrics.
  - `sfia`, `onet`: Khung năng lực tiêu chuẩn quốc tế.

### 1.2. Mô hình Tiến trình Đa vai trò (Multi-Role Runtime)
Hệ thống vận hành theo file `server/src/core/runtime/runtime-role.ts`:
- **Role `api`**: Chạy HTTP REST và WebSocket. Không khởi chạy BullMQ queue processors để tránh chiếm dụng CPU.
- **Role `worker`**: Chuyên khởi chạy BullMQ workers tiêu thụ jobs ngốn tài nguyên (LLM assessment, Whisper transcription).
- **Role `all`**: Chạy chung cả API và Worker (môi trường dev local).

> [!CRITICAL]
> **Hệ quả kiến trúc**: Global HTTP Exception Filter **chỉ bảo vệ được tiến trình `api`**. Khi chạy ở role `worker`, ngoại lệ rơi vào BullMQ Processors không đi qua NestJS HTTP Filters mà phải được kiểm soát bằng cơ chế riêng của BullMQ (`FailedJobListener`, Job Retry Backoff, Alerting).

### 1.3. Khách hàng tiêu thụ API (Frontend Client)
Client nằm cùng monorepo (`client/`), viết bằng Next.js (TypeScript) kết hợp TailwindCSS. Tầng giao tiếp mạng sử dụng `client/lib/api-client.ts`, đóng gói hàm `fetch` có tính năng tự động Refresh Token ngầm (Silent Refresh) và mapping mã lỗi thông qua từ điển `API_ERROR_MESSAGES`.

---

## PHASE 2 — KIỂM KÊ TOÀN BỘ HIỆN TRẠNG LỖI TRONG CODEBASE

Kết quả quét tự động trên toàn bộ mã nguồn `server/src/`:

```text
Tổng số file trong server/src: ~180 files
- Số file đang import InterviewAIException: 53 files (chiếm ~30% codebase)
- Số vị trí ném InterviewAIException: 120+ vị trí
- Số file có throw new Error(...) thuần: 8 files (UnifiedReportGenerator, AuthService, WorkflowDispatcher, PrismaService, DbTimezone, RuntimeRole)
- Số vị trí try/catch bắt Prisma thủ công (ví dụ P2002): 3 vị trí (tiêu biểu tại AuthService.register)
- Số vị trí Promise.catch nuốt lỗi (catch(() => undefined)): 4 vị trí (tiêu biểu gửi email verification async)
- Tình trạng xử lý lỗi Controller: 100% Controllers tuân thủ Clean Architecture, không có try/catch tùy tiện, ném ngoại lệ lên Global Filter.
```

---

## PHASE 3 — BÁO CÁO KIỂM TOÁN XỬ LÝ LỖI (AUDIT REPORT)

| Vị trí (Location) | Tầng (Layer) | Hành vi Hiện tại | Phân loại Lỗi | Vấn đề Thực tế (Problem) | Mức độ Nghiêm trọng | Biện pháp Khắc phục Đề xuất |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `InterviewAIExceptionFilter.ts` | Presentation / Core | Trả về payload phẳng: `{ success, errorCode, message, path, requestId, timestamp }` | Contract Design | Chưa khớp với chuẩn REST Enterprise phân cấp (`error: { code, message, details }`). Chi tiết validation array bị gộp thành 1 chuỗi đơn. | **HIGH** | Nâng cấp Response Contract chuẩn hóa có `details` và cập nhật đồng bộ `api-client.ts`. |
| `InterviewAIExceptionFilter.ts` | Presentation / Core | Bắt mọi lỗi không thuộc `HttpException` và trả về `500 INTERNAL_ERROR` | Infrastructure | Lỗi runtime của Prisma (`P2002`, `P2025`) nếu không được service bắt thủ công sẽ biến thành HTTP 500, gây hiểu lầm server crash. | **CRITICAL** | Tích hợp `PrismaErrorMapper` vào filter để tự động map `P2002` thành 409 Conflict, `P2025` thành 404 Not Found. |
| `unified-report-generator.service.ts:137, 501` | Application / Assessment | `throw new Error('Session not found')`, `throw new Error('AI Gateway is not available')` | Domain / External AI | Ném Error thuần của JS, làm mất ErrorCode chuẩn và bị filter map thành HTTP 500 vô lý. | **HIGH** | Thay bằng `InterviewAIException(ErrorCode.SESSION_NOT_FOUND)` và `ErrorCode.AI_SERVICE_ERROR`. |
| `auth.service.ts:100, 110` | Application / Auth | `throw new Error('Invalid token')`, `throw new Error('Invalid account or session expired')` | Auth Domain | Ném Error thuần thay vì domain exception chuẩn. | **HIGH** | Thay bằng `InterviewAIException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED)`. |
| `auth.service.ts:161-169` | Application / Auth | Bắt lỗi thủ công: `if ((error as any).code === 'P2002')` | Data Persistence | Logic bắt lỗi Prisma đặc thù nằm rải rác trong tầng nghiệp vụ, vi phạm Separation of Concerns. | **MEDIUM** | Chuyển giao việc xử lý mã Prisma cho `PrismaErrorMapper` tập trung. |
| `auth.service.ts:158` | Application / Auth | `this.requestEmailVerification(user.id).catch(() => undefined);` | Notification / Async | Lỗi gửi email OTP ngầm bị nuốt hoàn toàn, không có log cảnh báo nếu SMTP provider hỏng. | **MEDIUM** | Thay bằng `.catch(err => this.logger.warn('Failed to send verification email', err))`. |
| `BullMQ Processors` | Background Worker | Chưa có bộ lọc exception tập trung, chỉ dựa vào BullMQ default failed job log | Background Processing | Khi job fail, thiếu `correlationId` liên kết với request ban đầu của người dùng; không phân loại Fatal vs Transient. | **HIGH** | Xây dựng `BullMqJobErrorHandler` bọc trong Base Processor. |
| `InterviewLiveGateway.ts` | Realtime Presentation | Có `try/catch` cục bộ trong `handleConnection`, emit lỗi đơn giản | Realtime WebSocket | Thiếu `WsExceptionFilter` toàn cục; các lỗi phát sinh giữa phiên streaming voice chưa có envelope chuẩn. | **MEDIUM** | Triển khai `InterviewAiWsExceptionFilter` cho WebSocket Gateways. |

---

## PHASE 4 — THIẾT KẾ CÂY PHÂN LOẠI NGOẠI LỆ CHUẨN (CANONICAL ERROR TAXONOMY)

```text
Canonical System Error
│
├── 1. Client / Input Validation Error (HTTP 400 / 422)
│   ├── DTO Schema Validation Failed (class-validator)
│   ├── Malformed JSON Request
│   └── Invalid Query Parameters / Pagination Limits
│
├── 2. Authentication & Authorization Error (HTTP 401 / 403)
│   ├── Missing / Expired JWT Token
│   ├── Invalid Refresh Token / Revoked Session
│   ├── Insufficient Role Permissions (RBAC: Candidate vs Admin)
│   └── Resource Ownership Violation (Accessing other's session)
│
├── 3. Resource / Domain Error (HTTP 404)
│   ├── Session Not Found
│   ├── Question Bank / Rubric Not Found
│   ├── Answer Turn Not Found
│   └── O*NET / SFIA Skill Mapping Not Found
│
├── 4. Business Rule & State Conflict Error (HTTP 409)
│   ├── Email / Account Already Exists
│   ├── Session Status Transition Invalid (e.g. COMPLETED -> IN_PROGRESS)
│   ├── Turn Already Answered / Submitted
│   ├── Concurrent Modification Violation (OCC Optimistic Lock)
│   └── Session Creation Limit Exceeded (Rate / Quota Rule)
│
├── 5. Infrastructure Error (HTTP 502 / 503 / 504)
│   ├── Database Connection Pool Exhausted / Timeout (P1001, P1002)
│   ├── Redis Cache / Distributed Lock Unavailable
│   ├── Media Storage Failure (Local Disk / Supabase S3)
│   └── Queue Dispatch Failure (Redis Connection Drop)
│
├── 6. External AI / Provider Error (HTTP 502 / 504)
│   ├── OpenAI Rate Limit Exceeded (429)
│   ├── LLM Quota / Credit Exhausted
│   ├── AI Gateway Execution Timeout (> 30s)
│   ├── Whisper STT Transcription Failed
│   └── AI Structured Output JSON Schema Parsing Failure
│
└── 7. Unexpected / Internal Error (HTTP 500)
    ├── Unhandled Null Reference / TypeError
    ├── Unhandled Promise Rejection
    └── Fatal Process Crash
```

### Ma trận Quản trị Thuộc tính Ngoại lệ:

| Nhóm Ngoại lệ | Phân loại Tính chất | Khả năng Thử lại (Retry) | Mức Log (Log Level) | Cảnh báo (Alert) | Expose Message ra Client |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Validation Error** | Expected | Không retry | `DEBUG` / `INFO` | Không | Toàn bộ field messages |
| **Auth / Ownership** | Expected | Không retry | `WARN` | Khi brute-force | Message chuẩn hóa |
| **Domain Not Found** | Expected | Không retry | `INFO` | Không | Message nghiệp vụ |
| **Business Conflict**| Expected | Retry khi OCC conflict | `WARN` | Không | Message nghiệp vụ |
| **Infra DB Timeout** | Unexpected | Có retry (Transient) | `ERROR` | Có nếu liên tục | Sanitize: "Service Unavailable" |
| **AI Rate Limit 429**| Expected (Spike) | Có retry (Backoff + Jitter)| `WARN` | Có khi vượt ngưỡng| "AI is busy, please wait" |
| **AI Timeout >30s**  | Expected (Tải) | Chuyển Secondary Model | `ERROR` | Có | "AI took too long, fallback used" |
| **Internal 500**     | Unexpected | Không retry tức thời | `ERROR` + Stack | BẮT BUỘC | "Internal server error" (Ẩn tuyệt đối stack) |

---

## PHASE 5 — MÔ HÌNH DỮ LIỆU LỖI CHUẨN (`InterviewAIException` v2)

Giữ nguyên tên class `InterviewAIException` (được bảo vệ trong `CONVENTIONS.md` và kiểm thử kiến trúc `architecture.spec.ts`), nâng cấp toàn diện các thuộc tính:

```typescript
// server/src/core/common/exceptions/interview-ai.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

export interface InterviewAIExceptionOptions {
  details?: Record<string, string[]> | unknown;
  cause?: unknown;
  metadata?: Record<string, unknown>;
  isOperational?: boolean;
}

export class InterviewAIException extends HttpException {
  public readonly details?: Record<string, string[]> | unknown;
  public readonly cause?: unknown;
  public readonly metadata?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    public readonly errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
    options?: InterviewAIExceptionOptions,
  ) {
    super(
      {
        success: false,
        errorCode,
        message: message ?? errorCode,
        details: options?.details ?? null,
      },
      statusCode,
    );

    this.details = options?.details;
    this.cause = options?.cause;
    this.metadata = options?.metadata;
    this.isOperational = options?.isOperational ?? true;

    // Giữ nguyên prototype chain cho instanceof checking
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

### Danh mục Mã lỗi Thống nhất (`ErrorCode` Registry):
Bổ sung đầy đủ các mã lỗi còn thiếu mà audit đã phát hiện:
```typescript
// server/src/core/common/exceptions/error-code.enum.ts
export enum ErrorCode {
  // Auth & Permissions
  UNAUTHORIZED = 'UNAUTHORIZED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  FORBIDDEN_RESOURCE = 'FORBIDDEN_RESOURCE',

  // User Domain
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Session Domain
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_LIMIT_EXCEEDED = 'SESSION_LIMIT_EXCEEDED',
  SESSION_NOT_ACTIVE = 'SESSION_NOT_ACTIVE',
  INVALID_SESSION_TRANSITION = 'INVALID_SESSION_TRANSITION',
  SESSION_INCOMPLETE = 'SESSION_INCOMPLETE',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',

  // Question & Prep Domain
  QUESTION_BANK_EMPTY = 'QUESTION_BANK_EMPTY',
  RUBRIC_NOT_FOUND = 'RUBRIC_NOT_FOUND',

  // Answer & Media Domain
  ANSWER_NOT_FOUND = 'ANSWER_NOT_FOUND',
  AUDIO_TOO_LARGE = 'AUDIO_TOO_LARGE',
  INVALID_AUDIO_URL = 'INVALID_AUDIO_URL',
  AUDIO_DOWNLOAD_FAILED = 'AUDIO_DOWNLOAD_FAILED',
  INVALID_ANSWER_TYPE = 'INVALID_ANSWER_TYPE',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',

  // Report & Assessment
  REPORT_NOT_READY = 'REPORT_NOT_READY',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',

  // AI Resilience
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_RATE_LIMIT = 'AI_RATE_LIMIT',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_EMPTY_RESPONSE = 'AI_EMPTY_RESPONSE',
  AI_INVALID_JSON = 'AI_INVALID_JSON',
  SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
  INVALID_SESSION_TYPE = 'INVALID_SESSION_TYPE',

  // O*NET & SFIA Mapping
  ONET_OCCUPATION_NOT_FOUND = 'ONET_OCCUPATION_NOT_FOUND',
  ONET_SFIA_MAPPING_NOT_FOUND = 'ONET_SFIA_MAPPING_NOT_FOUND',
  ONET_SFIA_MAPPING_ALREADY_EXISTS = 'ONET_SFIA_MAPPING_ALREADY_EXISTS',
  SFIA_SKILL_NOT_FOUND = 'SFIA_SKILL_NOT_FOUND',
  SFIA_SKILL_INVALID_LEVEL = 'SFIA_SKILL_INVALID_LEVEL',

  // General & Infra
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS',
}
```

---

## PHASE 6 — BỘ QUY CHUẨN XỬ LÝ LỖI BẮT BUỘC (7 CARDINAL CONVENTIONS)

1. **Rule 1 — Cấm trả HTTP trực tiếp từ Service/Domain**: Tuyệt đối không import `Response`, `res.status()`, hoặc ném `HttpException` thuần túy trong Use Case Services. Chỉ ném `InterviewAIException`.
2. **Rule 2 — Dịch chuyển ngoại lệ hạ tầng qua Mapper**: Prisma, Redis, OpenAI, Whisper errors không bao giờ được propagate nguyên bản tới Client. Bắt buộc đi qua `PrismaErrorMapper` hoặc Gateway Adapters.
3. **Rule 3 — Controller mỏng, không try/catch lặp lại**: Controller chỉ đón nhận DTO, gọi Use Case và trả về DTO. Mọi lỗi được để tự do nổi lên Global Exception Filter.
4. **Rule 4 — Cấm so sánh chuỗi Error Message**: Tuyệt đối không viết `if (err.message === "User not found")`. Bắt buộc kiểm tra `err.errorCode === ErrorCode.USER_NOT_FOUND`.
5. **Rule 5 — Bảo toàn nguyên nhân gốc (Preserve Error Cause)**: Khi bọc một lỗi bên ngoài, bắt buộc truyền error gốc vào option `{ cause: originalError }` để giữ stack trace khi debug.
6. **Rule 6 — Cấm nuốt lỗi âm thầm (No Error Swallowing)**: Bất kỳ khối `catch` nào bỏ qua lỗi phải có code comment giải thích rõ lý do nghiệp vụ và phải ghi log cấp `WARN`/`DEBUG`.
7. **Rule 7 — Bảo vệ thông tin nhạy cảm tuyệt đối**: Không bao giờ serialize SQL statement, database connection strings, API keys, password hashes hay file paths nội bộ ra JSON response trên Production.

---

## PHASE 7 — CHUẨN HÓA HỢP ĐỒNG API ERROR RESPONSE (CLIENT & SERVER CONTRACT)

### 7.1. Cấu trúc JSON Chuẩn hóa Mới
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for incoming payload",
    "details": {
      "targetRole": ["Target role is required"],
      "sessionType": ["Invalid session type"]
    }
  },
  "meta": {
    "requestId": "9c12b4f8-5a21-4c12-9c12-ef389d41bc29",
    "timestamp": "2026-10-05T02:45:00.000Z",
    "path": "/api/v1/interview-sessions"
  }
}
```

### 7.2. Đồng bộ hóa Phía Frontend (`client/lib/api-client.ts`)
Cập nhật `ServerErrorPayload` và `ApiClientError`:
```typescript
// client/lib/api-client.ts
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode?: string,
    public readonly details?: Record<string, string[]> | null,
    public readonly requestId?: string,
    public readonly rawData?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface ServerErrorPayload {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]> | null;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
    path?: string;
  };
  // Fallback tương thích ngược
  errorCode?: string;
  message?: string;
}
```
Tại hàm `request<T>()`, logic trích xuất thông điệp lỗi:
```typescript
const err = body;
const code = err.error?.code ?? err.errorCode;
const details = err.error?.details ?? null;
const requestId = err.meta?.requestId;

const message =
  (code ? API_ERROR_MESSAGES[code] : undefined) ??
  err.error?.message ??
  err.message ??
  code ??
  `Yêu cầu thất bại (${response.status})`;

throw new ApiClientError(message, response.status, code, details, requestId, body);
```

---

## PHASE 8 — BỘ LỌC LỖI TOÀN CỤC (GLOBAL EXCEPTION FILTER PIPELINE)

Quy trình chuẩn hóa ngoại lệ trong `InterviewAIExceptionFilter`:

```mermaid
flowchart TD
    E[Exception Nổi lên] --> C1{Là InterviewAIException?}
    C1 -- Đúng --> P1[Trích xuất errorCode, status, details, message]
    C1 -- Sai --> C2{Là PrismaClientKnownRequestError?}
    
    C2 -- Đúng --> P2[Chạy PrismaErrorMapper<br/>Map sang InterviewAIException]
    C2 -- Sai --> C3{Là NestJS HttpException / BadRequest?}
    
    C3 -- Đúng --> P3[Trích xuất HTTP Status<br/>Parse Validation Errors thành details]
    C3 -- Sai --> P4[Coi là Unknown Error<br/>Status: 500 INTERNAL_ERROR<br/>Ghi Log ERROR kèm Stack Trace]
    
    P1 --> BuildEnvelope[Tạo Chuẩn JSON Envelope<br/>success: false, error: {...}, meta: {...}]
    P2 --> BuildEnvelope
    P3 --> BuildEnvelope
    P4 --> Sanitize[Sanitize Message<br/>'Internal server error' trên Production] --> BuildEnvelope
    
    BuildEnvelope --> Send[Gửi HTTP Response cho Client]
```

### Triển khai Bộ lọc (`interview-ai-exception.filter.ts`):
- Trích xuất `requestId` từ `req.headers['x-request-id']` hoặc `RequestContext.getCorrelationId()`.
- Phân biệt môi trường Development (cho phép hiện stack trace trong log) vs Production (che dấu hoàn toàn thông tin nhạy cảm).

---

## PHASE 9 — BỘ CHUYỂN ĐỔI LỖI TẦNG HẠ TẦNG (INFRASTRUCTURE ERROR MAPPERS)

### 9.1. Prisma Error Mapper (`prisma-error.mapper.ts`)
Tập trung hóa việc xử lý lỗi cơ sở dữ liệu:
```typescript
// server/src/core/common/exceptions/mappers/prisma-error.mapper.ts
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../error-code.enum';
import { InterviewAIException } from '../interview-ai.exception';

export class PrismaErrorMapper {
  static map(error: Prisma.PrismaClientKnownRequestError): InterviewAIException {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        return new InterviewAIException(
          ErrorCode.CONFLICT,
          HttpStatus.CONFLICT,
          `Unique constraint failed on: ${target}`,
          { cause: error, metadata: { prismaCode: error.code } },
        );
      }
      case 'P2025':
        return new InterviewAIException(
          ErrorCode.NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Requested record was not found or has been deleted',
          { cause: error, metadata: { prismaCode: error.code } },
        );
      case 'P2003':
        return new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          'Foreign key constraint failed',
          { cause: error, metadata: { prismaCode: error.code } },
        );
      case 'P1001':
      case 'P1002':
        return new InterviewAIException(
          ErrorCode.SERVICE_UNAVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Database server is temporarily unreachable',
          { cause: error, metadata: { prismaCode: error.code }, isOperational: false },
        );
      default:
        return new InterviewAIException(
          ErrorCode.INTERNAL_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Database operation failed',
          { cause: error, metadata: { prismaCode: error.code } },
        );
    }
  }
}
```

### 9.2. AI Gateway Error Mapper
Bọc các lời gọi OpenAI, Gemini, Whisper tại `@infra/ai`:
- Lỗi HTTP `429 Too Many Requests` từ OpenAI ➔ ném `InterviewAIException(ErrorCode.AI_RATE_LIMIT, HttpStatus.TOO_MANY_REQUESTS)`.
- Lỗi Quota Exceeded (Hết tiền/credit) ➔ ném `InterviewAIException(ErrorCode.AI_QUOTA_EXCEEDED, HttpStatus.SERVICE_UNAVAILABLE)`.
- Lỗi `AbortError` do Timeout quá 30s ➔ ném `InterviewAIException(ErrorCode.AI_TIMEOUT, HttpStatus.GATEWAY_TIMEOUT)`.
- Lỗi parse JSON Zod Schema thất bại ➔ ném `InterviewAIException(ErrorCode.AI_INVALID_JSON, HttpStatus.BAD_GATEWAY)`.

---

## PHASE 10 — HỆ THỐNG REQUEST ID & CORRELATION ID TRACING (`AsyncLocalStorage`)

### 10.1. Request Context Store (`request-context.ts`)
```typescript
// server/src/core/common/context/request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestStore {
  requestId: string;
  correlationId: string;
  userId?: string;
  startTime: number;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestStore>();

  static run<R>(store: RequestStore, callback: () => R): R {
    return this.storage.run(store, callback);
  }

  static get(): RequestStore | undefined {
    return this.storage.getStore();
  }

  static getCorrelationId(): string {
    return this.storage.getStore()?.correlationId ?? 'unknown-ctx';
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
```

### 10.2. Nạp Context trong Middleware & BullMQ Worker
1. **HTTP Requests**: `RequestIdMiddleware` đón nhận hoặc sinh `X-Correlation-ID` (hoặc `X-Request-ID`), dùng `RequestContext.run()` bọc qua `next()`.
2. **BullMQ Jobs**: Khi Dispatcher tạo job, đính kèm `correlationId` vào payload:
   ```typescript
   await queue.add('generate-report', { sessionId, correlationId: RequestContext.getCorrelationId() });
   ```
   Khi Worker nhận job, bọc hàm xử lý trong `RequestContext.run()` khôi phục ID gốc.

---

## PHASE 11 — CHIẾN LƯỢC GHI LOG CÓ CẤU TRÚC & BẢO MẬT (`AppLogger`)

### 11.1. Cấu trúc JSON Structured Log
```json
{
  "timestamp": "2026-10-05T02:45:00.123Z",
  "level": "ERROR",
  "context": "ComprehensiveReportProcessor",
  "correlationId": "9c12b4f8-5a21-4c12-9c12-ef389d41bc29",
  "userId": "usr_789456",
  "errorCode": "AI_TIMEOUT",
  "message": "AI Gateway call timed out after 30000ms",
  "durationMs": 30042,
  "stack": "Error: Timeout at OpenAiGateway.execute..."
}
```

### 11.2. Cơ chế Tự động Che chắn Dữ liệu Nhạy cảm (PII Sanitization)
`AppLogger` tự động đệ quy duyệt qua các object tham số và thay thế bằng `[REDACTED]` đối với các key:
`password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `apiKey`, `authorization`, `creditCard`, `secret`.

### 11.3. Nguyên tắc Ghi Log Đơn Chủ sở hữu (Single-Owner Logging)
- Tầng Domain Service / Repository: **Không tự ý ghi log ERROR** khi ném ngoại lệ (để tránh spam trùng lặp).
- **Chủ sở hữu ghi log duy nhất**:
  - Đối với HTTP: `InterviewAIExceptionFilter`.
  - Đối với WebSocket: `WsExceptionFilter`.
  - Đối với BullMQ Worker: `BullMqJobErrorHandler`.

---

## PHASE 12 — CHÍNH SÁCH THỬ LẠI TOÀN DIỆN (RETRY POLICY & EXPONENTIAL BACKOFF)

### 12.1. Phân loại Khả năng Retry
- **Non-retryable (Cấm retry)**:
  - Tất cả các lỗi Client Input / Validation (`400`, `422`).
  - Lỗi Auth / Permissions (`401`, `403`).
  - Lỗi Không tìm thấy tài nguyên (`404`).
  - Lỗi Vi phạm logic nghiệp vụ cố định (`409 SESSION_INCOMPLETE`, `ACCOUNT_INACTIVE`).
- **Retryable (Cho phép retry)**:
  - Lỗi mạng tạm thời (`ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`).
  - Lỗi Rate Limit từ AI Gateway (`429`).
  - Lỗi Dịch vụ tạm thời không khả dụng (`503`).
  - Lỗi Xung đột phiên bản lạc quan (OCC Optimistic Concurrency Conflict).

### 12.2. Công thức Exponential Backoff với Full Jitter
Khoảng thời gian chờ giữa các lần thử lại:
$$T_{\text{wait}} = 2^{\text{attempt}} \times 1000\,\text{ms} + \text{random}(0, 500\,\text{ms})$$
- Attempt 1: ~1,000ms - 1,500ms
- Attempt 2: ~2,000ms - 2,500ms
- Attempt 3: ~4,000ms - 4,500ms
- Số lần thử tối đa: **3 lần** (Sau 3 lần thất bại ➔ Chuyển Fallback Model hoặc ghi nhận Job FAILED).

### 12.3. Cấu hình BullMQ Queue Retry
```typescript
export const DEFAULT_BULLMQ_RETRY_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 100, // Giữ lại 100 jobs thành công gần nhất
  removeOnFail: 500,     // Giữ lại 500 jobs thất bại để phục vụ điều tra
};
```

---

## PHASE 13 — CHÍNH SÁCH GIỚI HẠN THỜI GIAN CHỜ (TIMEOUT POLICY)

Tuyệt đối không để bất kỳ cuộc gọi IO hoặc tác vụ mạng nào treo vô tận gây cạn kiệt connection pool:

| Loại Tác vụ | Ngưỡng Timeout Cứng | Cơ chế Thực thi | Hành động Khi Timeout |
| :--- | :--- | :--- | :--- |
| **LLM Single-turn Chat / Scoring** | `30,000ms` (30 giây) | `AbortController.signal` | Ngắt kết nối, chuyển Fallback Model |
| **Whisper Audio Transcription (STT)**| `60,000ms` (60 giây) | `AbortController.signal` | Đánh dấu âm thanh lỗi, thử lại lần 2 |
| **Deep Assessment Multi-turn Report** | `90,000ms` (90 giây) | Worker Job Timeout | Chuyển trạng thái session sang `FAILED` |
| **Database Prisma Query** | `10,000ms` (10 giây) | Prisma connection pool config | Ném `SERVICE_UNAVAILABLE` |
| **Redis Cache / Distributed Lock** | `3,000ms` (3 giây) | ioredis command timeout | Fallback đọc DB trực tiếp |

---

## PHASE 14 — CHIẾN LƯỢC DỰ PHÒNG & PHỤC HỒI AI (MODEL FALLBACK & CIRCUIT BREAKER)

### 14.1. Sơ đồ Chuyển giao Dự phòng Tự động (Model Fallback)

```mermaid
sequenceDiagram
    participant S as Use Case Service
    participant GW as AI Gateway
    participant P as Primary Model (GPT-4o)
    participant B as Secondary Model (Gemini 1.5 Flash)
    
    S->>GW: Yêu cầu chấm điểm (evaluateAnswer)
    GW->>P: Gửi Prompt (Timeout 30s)
    alt Thành công
        P-->>GW: Trả kết quả JSON
        GW-->>S: Trả Domain Result
    else Gặp lỗi 429 / Quota / Timeout
        P--xGW: Lỗi hoặc Hết thời gian chờ
        GW->>GW: Log WARN & Ghi nhận Circuit Fail Count
        GW->>B: Kích hoạt Secondary Fallback (Gemini Flash)
        B-->>GW: Trả kết quả JSON thành công
        GW-->>S: Trả Domain Result (Kèm cờ fallback: true)
    end
```

### 14.2. Circuit Breaker Policy
- Khi Primary Model gặp lỗi liên tiếp 5 lần trong vòng 60 giây: Trạng thái Circuit chuyển sang **OPEN**.
- Toàn bộ các request tiếp theo trong vòng 120 giây sẽ chuyển thẳng sang Secondary Model mà không cần thử Primary Model (tiết kiệm thời gian chờ 30s của người dùng).
- Sau 120 giây: Trạng thái chuyển sang **HALF-OPEN**, gửi thử 1 request kiểm tra tới Primary Model. Nếu thành công ➔ Đóng Circuit (**CLOSED**).

---

## PHASE 15 — BẢO ĐẢM TÍNH TOÀN VẸN GIAO DỊCH & IDEMPOTENCY (TRANSACTION AUDIT)

### 15.1. Ranh giới Giao dịch Cơ sở dữ liệu (`prisma.$transaction`)
- Áp dụng Interactive Transaction khi có hành động ghi đồng thời từ 2 bảng trở lên thuộc cùng Bounded Context (ví dụ: tạo `InterviewSession` + nạp `SessionQuestions`).
- **Ranh giới cô lập**: Tuyệt đối không truyền Prisma Transaction Client `tx` xuyên qua Facade sang Bounded Context khác. Áp dụng Eventual Consistency qua BullMQ Event Dispatching.

### 15.2. Khóa Chống Trùng lặp (Idempotency Key)
- Các endpoint tốn chi phí (Tạo session, nộp câu trả lời, trừ credit): Hỗ trợ header `Idempotency-Key` (UUIDv4).
- Kiểm tra Redis:
  - Đang xử lý: Ném `InterviewAIException(ErrorCode.REQUEST_IN_PROGRESS, HttpStatus.CONFLICT)`.
  - Đã có kết quả: Trả về response cache (TTL 24h).
  - Chưa có: Khóa key với TTL 60s, cho request thực thi.

---

## PHASE 16 — LỘ TRÌNH TRIỂN KHAI 5 MILESTONE CHI TIẾT (IMPLEMENTATION ROADMAP)

```text
Milestone 1: Core Foundation & Contract Redesign (Server & Client sync)
      ↓
Milestone 2: Observability & Context Propagation (AsyncLocalStorage & Structured Logger)
      ↓
Milestone 3: Worker & WebSocket Boundaries (BullMQ Resilience & WsExceptionFilter)
      ↓
Milestone 4: Codebase Audit & Sanitization (Eliminate ad-hoc throw new Error)
      ↓
Milestone 5: Verification, Integration Testing & Documentation
```

### Chi tiết Các Tác vụ theo từng Milestone:

#### Milestone 1: Core Foundation & Contract Redesign
- [ ] Cập nhật `InterviewAIException`: Thêm `details`, `cause`, `metadata`, `isOperational`.
- [ ] Bổ sung mã enum trong `ErrorCode`: `FORBIDDEN_RESOURCE`, `TRANSCRIPTION_FAILED`, `ASSESSMENT_FAILED`, `REQUEST_IN_PROGRESS`, `BAD_REQUEST`.
- [ ] Tạo mới `PrismaErrorMapper`: Map `P2002`, `P2025`, `P2003`, `P1001` sang `InterviewAIException`.
- [ ] Tạo mới `ValidationErrorFactory`: Định dạng lỗi `class-validator` thành `details: Record<string, string[]>`.
- [ ] Cập nhật `InterviewAIExceptionFilter`: Định dạng lại response JSON lồng nhau `{ success: false, error: {...}, meta: {...} }` và tích hợp `PrismaErrorMapper`.
- [ ] Cấu hình `ValidationPipe` trong `main.ts` sử dụng `validation-error.factory`.
- [ ] Cập nhật [client/lib/api-client.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/lib/api-client.ts): Hỗ trợ cấu trúc response mới, tương thích ngược an toàn.
- [ ] Cập nhật [client/e2e/interview.spec.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/e2e/interview.spec.ts) tương thích với payload mới.
- [ ] Cập nhật `interview-ai-exception.filter.spec.ts` và `interview-ai.exception.spec.ts`.

#### Milestone 2: Observability & Context Propagation
- [ ] Tạo mới `RequestContext` (`AsyncLocalStorage`) tại `server/src/core/common/context/request-context.ts`.
- [ ] Cập nhật `RequestIdMiddleware` để bọc mọi HTTP request trong `RequestContext.run()`.
- [ ] Tạo mới `AppLogger` tại `server/src/core/common/services/app-logger.service.ts`: Ghi log JSON có `correlationId`, tự động che dấu PII.
- [ ] Đăng ký `AppLogger` vào `CommonModule` làm Global Logger.

#### Milestone 3: Worker & WebSocket Boundaries
- [ ] Tạo mới `InterviewAiWsExceptionFilter` tại `server/src/core/common/exceptions/ws-exception.filter.ts`.
- [ ] Gắn filter vào `InterviewLiveGateway` và chuẩn hóa WebSocket error event envelope.
- [ ] Tạo mới `BullMqJobErrorHandler` tại `server/src/infrastructure/workflow/bullmq-error-handler.ts`:
  - Khôi phục `RequestContext` từ `job.data.correlationId`.
  - Phân loại lỗi Fatal vs Transient.
  - Ghi log thất bại có đủ context điều tra.
- [ ] Tích hợp handler vào `ComprehensiveReportProcessor` và `QuestionGenerationProcessor`.

#### Milestone 4: Codebase Audit & Sanitization
- [ ] Sửa `unified-report-generator.service.ts`: Thay thế `throw new Error(...)` bằng `InterviewAIException`.
- [ ] Sửa `auth.service.ts`: Thay thế `throw new Error(...)` bằng `InterviewAIException`; gỡ bỏ try/catch Prisma P2002 thủ công để dùng mapper.
- [ ] Sửa `workflow-dispatcher.service.ts`: Thay thế `throw new Error(...)` bằng domain exception chuẩn.
- [ ] Rà soát toàn bộ các điểm nuốt lỗi (`.catch(() => undefined)`), bổ sung log `logger.warn`.

#### Milestone 5: Verification, Integration Testing & Documentation
- [ ] Chạy kiểm thử ranh giới kiến trúc: `npm run test:arch`.
- [ ] Chạy toàn bộ test suites server: `npm test`.
- [ ] Kiểm tra tính toàn vẹn biên dịch server: `npm run build`.
- [ ] Kiểm tra type check client: `cd ../client && npm run build` (hoặc `npx tsc --noEmit`).
- [ ] Cập nhật `server/CONVENTIONS.md`.
- [ ] Tạo mới tài liệu hướng dẫn kỹ thuật chi tiết: `server/docs/error-handling.md`.

---

## PHASE 17 — NGUYÊN TẮC CHUYỂN ĐỔI AN TOÀN (MIGRATION RULES)

1. **Zero Downtime & Backward Compatibility**:
   - Trong quá trình chuyển đổi, `api-client.ts` của client được viết theo cơ chế fallback (đọc `err.error?.code ?? err.errorCode`), đảm bảo nếu có endpoint nào chưa kịp chuyển đổi thì client vẫn không bị crash.
2. **Không tạo song song 2 hệ thống lỗi**:
   - Tiếp tục hoàn thiện trên class duy nhất `InterviewAIException`. Tuyệt đối không tạo thêm `AppError` hay `CustomError` chạy song song gây phân mảnh codebase.
3. **Commit theo từng Milestone độc lập**:
   - Mỗi Milestone sau khi hoàn thành bắt buộc phải pass 100% `npm run test:arch`, `npm test` và `npm run build` trước khi chuyển sang Milestone tiếp theo.

---

## PHASE 18 — CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN (TESTING STRATEGY & QA)

### 18.1. Unit Tests (`*.spec.ts`)
- Kiểm thử `InterviewAIException`: Kiểm tra constructor, khởi tạo với options (`cause`, `details`, `metadata`).
- Kiểm thử `PrismaErrorMapper`: Mock các instance `PrismaClientKnownRequestError` (`P2002`, `P2025`, `P2003`, `P1001`) và xác nhận map đúng `ErrorCode` cùng HTTP Status.
- Kiểm thử `ValidationErrorFactory`: Kiểm tra định dạng dictionary gom nhóm lỗi theo field.
- Kiểm thử `InterviewAIExceptionFilter`: Kiểm tra cấu trúc envelope JSON mới `{ success: false, error: {...}, meta: {...} }` cho cả 4 kịch bản: `InterviewAIException`, `HttpException`, `PrismaError`, và `UnknownError`.

### 18.2. Integration & Boundary Tests
- Khởi tạo Nest Test Application với Supertest:
  - Gửi POST sai body validation ➔ Xác nhận mã 400 và `error.details` có field tương ứng.
  - Gửi request gây duplicate record ➔ Xác nhận mã 409 `CONFLICT`.
  - Gửi request gây unhandled error ➔ Xác nhận mã 500 `INTERNAL_ERROR`, message "Internal server error", không lộ stack trace.

### 18.3. Security & Anti-Leak Tests
- Viết test case giả lập lỗi database chứa connection string và password:
  - Kiểm tra body trả về của client hoàn toàn sạch thông tin nhạy cảm.

---

## PHASE 19 — XÁC MINH KHẢ NĂNG QUAN SÁT THỰC TẾ (OBSERVABILITY VALIDATION)

Kịch bản xác minh Traceability từ đầu đến cuối (End-to-End Trace Verification):

```text
[Client] Gửi request: POST /api/v1/interview-sessions (Header: X-Correlation-ID: test-trace-999)
   │
[Middleware] RequestIdMiddleware nhận diện correlationId = test-trace-999
   │         Nạp vào RequestContext (AsyncLocalStorage)
   │
[Service] Use Case kích hoạt AI Gateway & nạp background job sang BullMQ
   │      Logger ghi nhận: correlationId=test-trace-999 | Action=CreatingSession
   │
[BullMQ] Job 'generate-report' được nạp kèm payload: { correlationId: "test-trace-999" }
   │
[Worker] ComprehensiveReportProcessor đón nhận Job
   │     Khôi phục RequestContext với correlationId = test-trace-999
   │     Nếu AI timeout ➔ Logger ghi: correlationId=test-trace-999 | Error=AI_TIMEOUT
   │
[Audit] Tìm kiếm trên log hệ thống theo từ khóa: 'test-trace-999'
   └── Kết quả: Ra đầy đủ chuỗi sự kiện từ lúc Client bấm nút tới lúc Worker xử lý lỗi!
```

---

## PHASE 20 — TÀI LIỆU HÓA HƯỚNG DẪN DEVELOPER (DEVELOPER GUIDE)

Nội dung tài liệu sẽ được lưu tại `server/docs/error-handling.md`:

### 1. Hướng dẫn ném ngoại lệ trong Use Case Service
```typescript
// ✅ Chuẩn mực: Ném lỗi nghiệp vụ có thông điệp rõ ràng
throw new InterviewAIException(
  ErrorCode.SESSION_NOT_FOUND,
  HttpStatus.NOT_FOUND,
  `Interview session ${sessionId} does not exist or has been deleted`,
);

// ✅ Chuẩn mực: Bọc lỗi kỹ thuật giữ nguyên root cause
try {
  await this.externalService.call();
} catch (error) {
  throw new InterviewAIException(
    ErrorCode.AI_SERVICE_ERROR,
    HttpStatus.BAD_GATEWAY,
    'Failed to communicate with AI provider',
    { cause: error },
  );
}
```

### 2. Các điều CẤM (Anti-patterns Checklist)
- ❌ **CẤM**: `throw new Error('user not found')`
- ❌ **CẤM**: `catch (e) { return null; }` (nuốt lỗi)
- ❌ **CẤM**: `res.status(500).json(error)` trong Controller/Service
- ❌ **CẤM**: So sánh `if (err.message === '...')`
- ❌ **CẤM**: Trả trực tiếp raw Prisma exception về client

---

## PHASE 21 — DANH MỤC TỰ ĐÁNH GIÁ & RÀ SOÁT (CODE REVIEW CHECKLIST)

Trước khi merge bất kỳ thay đổi nào thuộc Error Handling System, PR phải đạt 100% checklist sau:

- [ ] **1. Architecture**: Sử dụng duy nhất `InterviewAIException`, không tự ý tạo class exception riêng rẽ.
- [ ] **2. Architecture**: Controller hoàn toàn mỏng, không chứa try/catch format lỗi.
- [ ] **3. Architecture**: Module này sang module khác chỉ gọi qua `contracts/` Facade, không leak ngoại lệ nội bộ.
- [ ] **4. Contract**: Mọi API HTTP Error Response đều tuân thủ `{ success: false, error: { code, message, details }, meta: {...} }`.
- [ ] **5. Contract**: Frontend `api-client.ts` xử lý trơn tru cả lỗi validation lẫn lỗi nghiệp vụ.
- [ ] **6. Security**: Response 500 trên Production không chứa stack trace hay database error internals.
- [ ] **7. Security**: Dữ liệu log được lọc sạch PII (password, tokens, secrets).
- [ ] **8. Observability**: Mọi dòng log lỗi đều có `correlationId` lấy từ `RequestContext`.
- [ ] **9. Observability**: BullMQ failed jobs ghi nhận đủ thông tin trace và attempts.
- [ ] **10. Reliability**: Mọi lời gọi AI (OpenAI, Whisper) đều có hard timeout bằng `AbortController`.
- [ ] **11. Reliability**: Retry chỉ áp dụng cho lỗi Transient, không retry lỗi Validation hay 404.
- [ ] **12. Realtime**: WebSocket Gateway sử dụng `WsExceptionFilter` có format event envelope chuẩn.
- [ ] **13. Quality**: `npm run test:arch` PASS 100%.
- [ ] **14. Quality**: `npm test` PASS 100%.
- [ ] **15. Quality**: `npm run build` (cả server và client) PASS 0 error.

---

## PHASE 22 — BÁO CÁO NGHIỆM THU & QUẢN TRỊ NỢ KỸ THUẬT (FINAL DELIVERABLES)

Khi hoàn tất toàn bộ 5 Milestone, deliverables bàn giao sẽ bao gồm:
1. `server/CONVENTIONS.md` được cập nhật đồng bộ các quy chuẩn mới.
2. `server/docs/error-handling.md` hướng dẫn toàn diện cho đội ngũ kỹ sư.
3. Bộ test suites tự động bao phủ toàn bộ các kịch bản ngoại lệ của hệ thống.
4. Báo cáo đánh giá nợ kỹ thuật (Technical Debt Log): Liệt kê các thành phần chưa cần thiết phải triển khai ngay trong giai đoạn này (như Distributed Saga Orchestrator cho distributed payments) để đảm bảo triết lý YAGNI/KISS.
