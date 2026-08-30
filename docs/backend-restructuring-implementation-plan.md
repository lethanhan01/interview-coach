# KẾ HOẠCH CHI TIẾT TÁI CẤU TRÚC BACKEND THEO 3 TẦNG CLEAN ARCHITECTURE & BOUNDED CONTEXTS

> **Tài liệu**: Kế hoạch triển khai tái cấu trúc thư mục và kiến trúc Backend (`server/src`)  
> **Hệ thống**: Nền tảng AI Mock Interview Coach  
> **Trạng thái**: Đã hoàn thành Phần 1 đến Phần 7 (7/12 phần - 58.3%). Sẵn sàng triển khai Phần 8 (Identity & Admin Modules).  
> **Mục tiêu**: Tái tổ chức toàn bộ `server/src` từ cấu trúc 22 thư mục phẳng hiện tại thành **3 tầng rõ ràng (Core - Infrastructure - Modules)**, gom nhóm nghiệp vụ phỏng vấn thành **3 Bounded Contexts theo vòng đời chuẩn (Prep - Live - Assessment)**, tách riêng hạ tầng Media STT (`media`), và cung cấp bản đồ kiến trúc trực quan giúp developer mới nắm bắt hệ thống trong vòng 15 phút.

---

## 1. ĐÁNH GIÁ THỰC TRẠNG & PHÂN TÍCH ĐIỂM NGHẼN (CURRENT STATE ANALYSIS)

### 1.1. Thực trạng 22 thư mục phẳng (Flat Root Structure)
```text
server/src/
├── admin/                  ├── infrastructure/        ├── session/
├── ai/                     ├── interview/             ├── test-utils/
├── architecture/           ├── question/              ├── turn/
├── assessment/             ├── question-bank/         ├── types/
├── auth/                   ├── question-criteria/     ├── user/
├── common/                 ├── report/                ├── workflow/
├── config/                 ├── runtime/
├── health/                 ├── saved-job-description/
├── app.module.ts           └── main.ts
```

### 1.2. Các điểm nghẽn nhận thức đối với Developer mới

| Vấn đề | Chi tiết thực tế | Tác động tới Dev mới |
| :--- | :--- | :--- |
| **1. Đặt tên sai lệch ngữ nghĩa (Misleading Domain Naming)** | Thư mục `src/interview/` thực chất **chỉ chứa logic xử lý file âm thanh và bóc băng Whisper STT** (`speech-to-text.service.ts`, `supabase-media-storage.adapter.ts`, `transcription.processor.ts`). Toàn bộ nghiệp vụ phỏng vấn cốt lõi lại nằm rải rác ở `session/`, `turn/`, `assessment/`, `report/`. | Dev mới bấm ngay vào `interview/` và bối rối vì không thấy luồng phỏng vấn đâu, chỉ thấy code upload audio. |
| **2. Phân mảnh miền dữ liệu (Domain Fragmentation)** | Miền chuẩn bị câu hỏi bị phân thành 4 thư mục riêng biệt ở root: `question/`, `question-bank/`, `question-criteria/`, `saved-job-description/`. | Khó hình dung bức tranh tổng thể về khâu chuẩn bị phỏng vấn (Preparation phase) vs khâu làm bài (Execution phase). |
| **3. Trộn lẫn các tầng trách nhiệm (Mixed Architectural Layers)** | 22 thư mục phẳng đặt ngang hàng nhau, không phân biệt đâu là **Hạ tầng (Infrastructure)**, đâu là **Lõi kỹ thuật (Core/Shared)**, và đâu là **Nghiệp vụ ứng dụng (Business Modules)**. | Không biết bắt đầu đọc từ đâu; không phân biệt được đâu là code framework tái sử dụng và đâu là domain logic. |
| **4. Thiếu tách bạch vòng đời phỏng vấn 3 giai đoạn** | Nghiệp vụ phỏng vấn chia cắt giữa `session/`, `turn/`, `assessment/`, `report/` mà không phân định ranh giới giữa: (1) Chuẩn bị, (2) Tiến trình trực tiếp, và (3) Đánh giá - Phản hồi - Báo cáo sau phiên. | Khó theo dõi và mở rộng từng giai đoạn độc lập (ví dụ nâng cấp thuật toán Rubric / Radar Report mà không ảnh hưởng luồng WebSocket/Turn). |

---

## 2. BẢN ĐỒ KIẾN TRÚC MỤC TIÊU (PROPOSED 3-LAYER ARCHITECTURE)

```text
server/src/
│
├── core/                                      ──► [TẦNG 1: NỀN TẢNG CHUNG - ZERO BUSINESS LOGIC]
│   ├── common/                                (Filters, Interceptors, Guards, Middleware, Constants, Swagger)
│   ├── config/                                (Environment Validation, Global Config)
│   ├── runtime/                               (HTTP Server vs Background Worker Roles)
│   ├── types/                                 (Global Domain Types & Enums)
│   └── test-utils/                            (Shared Test Fixtures & Mocks)
│
├── infrastructure/                            ──► [TẦNG 2: HẠ TẦNG KỸ THUẬT - PORTS & ADAPTERS]
│   ├── database/prisma/                       (Prisma ORM, Connection Resilience, Base Repositories)
│   ├── ai/                                    (OpenAI Gateway, Prompt Builders, Zod Schema Validators)
│   ├── storage/                               (IPrivateMediaStorageAdapter, SupabaseMediaAdapter)
│   ├── workflow/                              (Transactional Outbox Engine, BullMQ Dispatcher)
│   └── realtime/                              (WebSocket / SSE Gateway)
│
├── modules/                                   ──► [TẦNG 3: NGHIỆP VỤ ỨNG DỤNG - BOUNDED CONTEXTS]
│   ├── auth/                                  (Authentication, JWT, Password Hashing, Guards)
│   ├── user/                                  (User Profiles, Account Management)
│   ├── admin/                                 (System Ops, Metrics, Operational Dashboards)
│   ├── health/                                (Liveness & Readiness Probes)
│   │
│   ├── media/                                 ──► [Context: Xử lý Âm thanh & Bóc băng STT]
│   │   ├── speech-to-text.service.ts
│   │   ├── voice-metrics.service.ts
│   │   ├── transcribe-answer.service.ts
│   │   ├── transcription.processor.ts
│   │   └── media.module.ts
│   │
│   ├── interview-prep/                        ──► [Context 1: Chuẩn bị & Tài nguyên Phỏng vấn (Trước)]
│   │   ├── interview-prep.module.ts           (Aggregator Module)
│   │   ├── question-generation/               (AI Dynamic Question Generator & BullMQ Processor)
│   │   ├── question-bank/                     (Curated Question Bank & Catalog)
│   │   ├── question-criteria/                 (Assessment Rubric Criteria & Evaluation Benchmarks)
│   │   └── job-description/                   (Saved JD CRUD & Resume Context Parsing)
│   │
│   ├── interview-live/                        ──► [Context 2: Tiến trình Phỏng vấn Trực tiếp (Trong)]
│   │   ├── interview-live.module.ts           (Aggregator Module)
│   │   ├── session/                           (Session Lifecycle, Mode Strategies: HR / Technical, Timers)
│   │   └── turn/                              (Turn Management, Intake Handlers: Text / Voice, Audio Linkage)
│   │
│   └── interview-assessment/                  ──► [Context 3: Đánh giá, Phản hồi & Báo cáo (Sau)]
│       ├── interview-assessment.module.ts     (Aggregator Module)
│       ├── evaluation/                        (Turn Evaluation, Rubric Scoring, Feedback Sanitizer, Worker)
│       └── report/                            (Comprehensive Session Report, Radar Scoring Matrix, Action Plan)
│
├── architecture/                              ──► [KIỂM SOÁT RANH GIỚI TỰ ĐỘNG]
│   └── feature-boundaries.spec.ts             (Automated Boundary Enforcer)
│
├── app.module.ts                              ──► [ROOT MODULE KẾT NỐI RÚT GỌN]
└── main.ts
```

---

## 3. SƠ ĐỒ LUỒNG DỮ LIỆU VÒNG ĐỜI 3 GIAI ĐOẠN (DATA FLOW & SEQUENCE DIAGRAM)

```mermaid
sequenceDiagram
    autonumber
    actor User as Ứng viên (Client)
    participant Prep as modules/interview-prep
    participant Live as modules/interview-live
    participant Media as modules/media
    participant Assess as modules/interview-assessment
    participant Outbox as infrastructure/workflow

    %% GIAI ĐOẠN 1: CHUẨN BỊ (PREPARATION)
    Note over User,Prep: GIAI ĐOẠN 1: CHUẨN BỊ & THIẾT LẬP (PREPARATION)
    User->>Prep: 1. Chọn JD / Bộ câu hỏi ngân hàng / Tiêu chí Rubric
    Prep-->>User: 2. Trả về cấu hình & câu hỏi được chuẩn bị

    %% GIAI ĐOẠN 2: TIẾN TRÌNH TRỰC TIẾP (LIVE INTERVIEW)
    Note over User,Live: GIAI ĐOẠN 2: PHỎNG VẤN TRỰC TIẾP (LIVE EXECUTION)
    User->>Live: 3. Khởi tạo phiên phỏng vấn (Create Session)
    
    loop Từng lượt phỏng vấn (Turn 1..N)
        User->>Live: 4. Nộp câu trả lời (Text hoặc Audio)
        alt Trả lời bằng Âm thanh (Audio Voice)
            Live->>Media: Lưu Private Audio & Bóc băng Whisper STT
            Media-->>Live: Trả về Text bóc băng + Voice Metrics
        end
        Live->>Outbox: 5. Ghi Outbox Task: Đánh giá câu trả lời (Evaluate Turn)
        Outbox->>Assess: 6. [Evaluation] Chấm điểm theo Rubric + Bắt lỗi chi tiết
        Assess-->>User: 7. Bắn SSE: Surgical Feedback & Điểm số lượt hỏi
    end

    User->>Live: 8. Hoàn tất phỏng vấn (Complete Session)
    Live->>Outbox: 9. Ghi Outbox Task: Tổng hợp báo cáo toàn phiên

    %% GIAI ĐOẠN 3: ĐÁNH GIÁ & BÁO CÁO (POST-INTERVIEW ASSESSMENT)
    Note over Live,Assess: GIAI ĐOẠN 3: ĐÁNH GIÁ & BÁO CÁO TỔNG THỂ (ASSESSMENT & REPORT)
    Outbox->>Assess: 10. [Report] Tổng hợp toàn bộ Turn Feedbacks, tính Radar Scoring & Action Plan
    Assess-->>User: 11. Bắn SSE 'report.ready' / Client GET /report xuất Comprehensive Report
```

---

## 4. BẢNG ÁNH XẠ TOÀN BỘ FILE & THƯ MỤC (EXACT FILE MAPPING)

### 4.1. Tầng Core (`src/core/`)
| Đường dẫn hiện tại | Đường dẫn mục tiêu | Chức năng / Trách nhiệm |
| :--- | :--- | :--- |
| `src/common/*` | `src/core/common/*` | Exceptions, Filters, Guards, Middleware, Constants, Swagger |
| `src/config/*` | `src/core/config/*` | `env.validation.ts`, `env.validation.spec.ts` |
| `src/runtime/*` | `src/core/runtime/*` | `runtime-role.ts`, `runtime-role.spec.ts` |
| `src/types/*` | `src/core/types/*` | Shared global types |
| `src/test-utils/*` | `src/core/test-utils/*` | Shared testing mocks & helpers |

### 4.2. Tầng Infrastructure (`src/infrastructure/`)
| Đường dẫn hiện tại | Đường dẫn mục tiêu | Chức năng / Trách nhiệm |
| :--- | :--- | :--- |
| `src/infrastructure/database/prisma/*` | `src/infrastructure/database/prisma/*` | Prisma client, Database connection error handler |
| `src/infrastructure/realtime/*` | `src/infrastructure/realtime/*` | SSE / Redis PubSub services |
| `src/ai/*` | `src/infrastructure/ai/*` | `OpenAIGateway`, `IAIGateway`, Prompts, Pipelines, Zod Validator |
| `src/workflow/*` | `src/infrastructure/workflow/*` | `WorkflowDispatcherService`, Outbox resilience, Outbox job |
| `src/interview/media-storage.interface.ts` <br> `src/interview/supabase-media-storage.adapter.ts` | `src/infrastructure/storage/media-storage.interface.ts` <br> `src/infrastructure/storage/supabase-media-storage.adapter.ts` | Adapter lưu trữ file âm thanh an toàn, cấp presigned URLs |

### 4.3. Tầng Modules - Bounded Contexts (`src/modules/`)
| Thư mục hiện tại | Thư mục mục tiêu | File chính / Mô tả |
| :--- | :--- | :--- |
| `src/auth/*` | `src/modules/auth/*` | `AuthModule`, `AuthController`, `AuthService`, Guards, Decorators |
| `src/user/*` | `src/modules/user/*` | `UserModule`, `UserController`, `UserService` |
| `src/admin/*` | `src/modules/admin/*` | `AdminModule`, `AdminController`, `AdminService` |
| `src/health/*` | `src/modules/health/*` | `HealthModule`, `HealthController` |
| `src/interview/*` *(Phần còn lại)* | `src/modules/media/*` | `MediaModule`, `SpeechToTextService`, `VoiceMetricsService`, `TranscribeAnswerService`, `TranscriptionProcessor` |
| `src/question/*` | `src/modules/interview-prep/question-generation/*` | `QuestionGenerationModule`, `GenerateSessionQuestionsService`, `QuestionGenerationProcessor` |
| `src/question-bank/*` | `src/modules/interview-prep/question-bank/*` | `QuestionBankModule`, `QuestionBankService` |
| `src/question-criteria/*` | `src/modules/interview-prep/question-criteria/*` | `QuestionCriteriaModule`, `QuestionCriteriaService` |
| `src/saved-job-description/*` | `src/modules/interview-prep/job-description/*` | `JobDescriptionModule`, `SavedJobDescriptionController`, `SavedJobDescriptionService` |
| *(Mới)* | `src/modules/interview-prep/interview-prep.module.ts` | **Aggregator Module** kết nối 4 module con chuẩn bị phỏng vấn |
| `src/session/*` | `src/modules/interview-live/session/*` | `SessionModule`, `SessionController`, `SessionService`, Strategies (`hr`, `technical`) |
| `src/turn/*` | `src/modules/interview-live/turn/*` | `TurnModule`, `TurnController`, `TurnService`, Intake Handlers (`text`, `voice`) |
| *(Mới)* | `src/modules/interview-live/interview-live.module.ts` | **Aggregator Module** kết nối Session và Turn |
| `src/assessment/*` | `src/modules/interview-assessment/evaluation/*` | `EvaluationModule`, `EvaluateAnswerService`, `ContextPackService`, `RubricCatalogService`, `FeedbackProcessor` |
| `src/report/*` | `src/modules/interview-assessment/report/*` | `ReportModule`, `ReportController`, `ReportService`, `GenerateComprehensiveReportService`, `ReportProcessor` |
| *(Mới)* | `src/modules/interview-assessment/interview-assessment.module.ts` | **Aggregator Module** kết nối Evaluation và Report |

---

## 5. KẾ HOẠCH TRIỂN KHAI THEO PHÂN ĐOẠN (PHASED EXECUTION CHECKLIST)

Bản kế hoạch được chia thành **12 phần nhỏ độc lập** để triển khai an toàn và tuần tự:

### [x] Phần 1: Cấu hình TypeScript Path Aliases (`server/tsconfig.json`)
- [x] Bổ sung các alias `@core/*`, `@infra/*`, `@modules/*` vào `server/tsconfig.json`.
- [x] Giữ nguyên `@/*` trỏ về `./src/*` để đảm bảo tương thích ngược trong quá trình migrate.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/core/*"],
      "@infra/*": ["./src/infrastructure/*"],
      "@modules/*": ["./src/modules/*"]
    }
  }
}
```

---

### [x] Phần 2: Di chuyển & Tổ chức Tầng Core (`src/core/`)
- [x] Tạo thư mục `server/src/core/`.
- [x] Di chuyển `common/` $\rightarrow$ `src/core/common/`.
- [x] Di chuyển `config/` $\rightarrow$ `src/core/config/`.
- [x] Di chuyển `runtime/` $\rightarrow$ `src/core/runtime/`.
- [x] Di chuyển `types/` $\rightarrow$ `src/core/types/`.
- [x] Di chuyển `test-utils/` $\rightarrow$ `src/core/test-utils/`.
- [x] Cập nhật các import nội bộ trong `src/core/` và chạy unit tests của core (`npm test src/core`).

---

### [x] Phần 3: Di chuyển & Tổ chức Tầng Infrastructure (`src/infrastructure/`)
- [x] Di chuyển `ai/` $\rightarrow$ `src/infrastructure/ai/`.
- [x] Di chuyển `workflow/` $\rightarrow$ `src/infrastructure/workflow/`.
- [x] Tạo `src/infrastructure/storage/`, di chuyển `media-storage.interface.ts` và `supabase-media-storage.adapter.ts` từ `src/interview/` sang.
- [x] Tạo `storage.module.ts` để export Storage Providers.
- [x] Giữ nguyên `database/prisma/` và `realtime/` trong `src/infrastructure/`.
- [x] Cập nhật các import và chạy tests của infrastructure (`npm test src/infrastructure`).

---

### [x] Phần 4: Xây dựng Bounded Context Media (`src/modules/media/`)
- [x] Tạo thư mục `src/modules/media/`.
- [x] Di chuyển các file xử lý âm thanh từ `src/interview/` sang `src/modules/media/`:
  - `speech-to-text.service.ts` & `.spec.ts`
  - `voice-metrics.service.ts` & `.spec.ts`
  - `transcribe-answer.service.ts` & `.spec.ts`
  - `transcription.processor.ts`
  - `transcription-job.dto.ts`
  - `audio-object-storage.service.ts` & `.spec.ts`
  - `upload-and-transcribe-answer-audio.service.ts`
- [x] Đổi tên `InterviewModule` $\rightarrow$ `MediaModule` trong `src/modules/media/media.module.ts`.
- [x] Xóa thư mục cũ `src/interview/`.
- [x] Chạy tests của media (`npm test src/modules/media`).

---

### [x] Phần 5: Xây dựng Bounded Context Interview Prep (`src/modules/interview-prep/`) - HOÀN THÀNH 100%
- [x] Tạo thư mục `src/modules/interview-prep/`.
- [x] Di chuyển `src/question/` $\rightarrow$ `src/modules/interview-prep/question-generation/`.
- [x] Di chuyển `src/question-bank/` $\rightarrow$ `src/modules/interview-prep/question-bank/`.
- [x] Di chuyển `src/question-criteria/` $\rightarrow$ `src/modules/interview-prep/question-criteria/`.
- [x] Di chuyển `src/saved-job-description/` $\rightarrow$ `src/modules/interview-prep/job-description/`.
- [x] Tạo Aggregator Module `interview-prep.module.ts` kết nối và export 4 module con (`QuestionGenerationModule`, `QuestionBankModule`, `QuestionCriteriaModule`, `JobDescriptionModule`).
- [x] Cập nhật import liên quan:
  - `src/app.module.ts`: thay thế các module rời rạc bằng `InterviewPrepModule`.
  - `src/modules/media/`: trỏ đúng `QuestionCriteriaService` từ `@modules/interview-prep/question-criteria/...`.
  - `src/turn/`: cập nhật các intake handlers (`text`, `voice`) trỏ sang path mới.
  - `src/core/runtime/runtime-role.spec.ts`: cập nhật mock providers.
- [x] Kiểm thử & nghiệm thu nghiêm ngặt:
  - Unit tests context prep: `npm test src/modules/interview-prep` $\rightarrow$ **PASS** (4/4 suites, 41/41 tests).
  - Regression toàn hệ thống: `npm test` $\rightarrow$ **PASS** (59/59 suites, 459/459 tests).
  - Biên dịch TypeScript: `npm run build` $\rightarrow$ **PASS** (0 errors).
  - Runtime bootstrapping: `node dist/main.js` $\rightarrow$ **PASS** (khởi tạo thành công các controllers, services, outbox processors và mapping đầy đủ routes).
  - Lưu ý Watch Mode: Lỗi tạm thời `MODULE_NOT_FOUND` trong lúc watch mode phát hiện file di chuyển là race-condition tự nhiên khi tệp đang được chuyển vị trí; sau khi build/start lại hệ thống khởi động bình thường không có lỗi sót lại.

---

### [x] Phần 6: Xây dựng Bounded Context Interview Live (`src/modules/interview-live/`) - HOÀN THÀNH 100%
- [x] Tạo thư mục `src/modules/interview-live/`.
- [x] Di chuyển `src/session/` $\rightarrow$ `src/modules/interview-live/session/`.
- [x] Di chuyển `src/turn/` $\rightarrow$ `src/modules/interview-live/turn/`.
- [x] Tạo Aggregator Module `interview-live.module.ts` kết nối Session và Turn modules.
- [x] Chạy tests của interview-live (`npm test src/modules/interview-live`) $\rightarrow$ **PASS** (17/17 suites, 118/118 tests).

---

### [x] Phần 7: Xây dựng Bounded Context Interview Assessment (`src/modules/interview-assessment/`) - HOÀN THÀNH 100%
- [x] Tạo thư mục `src/modules/interview-assessment/`.
- [x] Di chuyển `src/assessment/` $\rightarrow$ `src/modules/interview-assessment/evaluation/` (đổi tên thành `EvaluationModule`).
- [x] Di chuyển `src/report/` $\rightarrow$ `src/modules/interview-assessment/report/` (`ReportModule`).
- [x] Tạo Aggregator Module `interview-assessment.module.ts` kết nối Evaluation và Report modules.
- [x] Cập nhật toàn bộ các module phụ thuộc (`prep`, `live`, `media`, `ai`, `core runtime`, `test/`, `prisma/`).
- [x] Chạy tests của interview-assessment (`npm test src/modules/interview-assessment`) $\rightarrow$ **PASS** (11/11 suites, 98/98 tests).
- [x] Full regression test toàn bộ backend (`npm test`) $\rightarrow$ **PASS** (59/59 suites, 459/459 tests).
- [x] TypeScript build (`npm run build`) $\rightarrow$ **PASS** (0 errors).
- [x] Runtime bootstrapping verification (`node dist/main.js`) $\rightarrow$ **PASS** (NestJS khởi động thành công, ánh xạ chính xác toàn bộ routes và khởi chạy outbox workers).

---

### [ ] Phần 8: Di chuyển Identity & Admin Modules
- [ ] Di chuyển `src/auth/` $\rightarrow$ `src/modules/auth/`.
- [ ] Di chuyển `src/user/` $\rightarrow$ `src/modules/user/`.
- [ ] Di chuyển `src/admin/` $\rightarrow$ `src/modules/admin/`.
- [ ] Di chuyển `src/health/` $\rightarrow$ `src/modules/health/`.
- [ ] Chạy tests của các modules này (`npm test src/modules/auth src/modules/user src/modules/admin src/modules/health`).

---

### [ ] Phần 9: Cập nhật Root `AppModule` (`src/app.module.ts`)
- [ ] Cập nhật lại các import trong `src/app.module.ts` theo cấu trúc gọn gàng:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

// Core & Infra
import { CommonModule } from '@core/common/common.module';
import { validateEnv } from '@core/config/env.validation';
import { InterviewAIExceptionFilter } from '@core/common/exceptions/interview-ai-exception.filter';
import { MaintenanceModeGuard } from '@core/common/guards/maintenance-mode.guard';
import { RequestIdMiddleware } from '@core/common/middleware/request-id.middleware';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { AiModule } from '@infra/ai/ai.module';
import { WorkflowModule } from '@infra/workflow/workflow.module';

// Business Modules
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { AdminModule } from '@modules/admin/admin.module';
import { MediaModule } from '@modules/media/media.module';
import { InterviewPrepModule } from '@modules/interview-prep/interview-prep.module';
import { InterviewLiveModule } from '@modules/interview-live/interview-live.module';
import { InterviewAssessmentModule } from '@modules/interview-assessment/interview-assessment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    UserModule,
    AdminModule,
    AiModule,
    WorkflowModule,
    MediaModule,
    InterviewPrepModule,
    InterviewLiveModule,
    InterviewAssessmentModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: InterviewAIExceptionFilter },
    { provide: APP_GUARD, useClass: MaintenanceModeGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

---

### [ ] Phần 10: Cập nhật Automated Boundary Tests (`feature-boundaries.spec.ts`)
- [ ] Cập nhật lại danh sách FEATURES và các quy tắc kiểm tra ranh giới kiến trúc trong `src/architecture/feature-boundaries.spec.ts`:
  1. `core/` không phụ thuộc vào `infrastructure/` hoặc `modules/`.
  2. `controllers` trong `modules/` không được import trực tiếp persistence (`@prisma/client`), queue (`bullmq`), hay external SDK (`openai`, `supabase`).
  3. Cross-module imports giữa các Bounded Contexts chỉ thông qua public interfaces / aggregator exports.
- [ ] Chạy `npm test src/architecture/feature-boundaries.spec.ts` đảm bảo `PASS`.

---

### [ ] Phần 11: Kiểm thử toàn diện & Build Check
- [ ] Chạy toàn bộ test suites của backend:
  ```bash
  npm test
  ```
  *(Yêu cầu: 59/59 test suites passed, 459/459 tests passed)*
- [ ] Chạy build TypeScript kiểm tra không còn broken imports:
  ```bash
  npm run build
  ```

---

### [ ] Phần 12: Cập nhật Tài liệu Onboarding & Visual Architecture Guide
- [ ] Cập nhật `server/README.md` với sơ đồ 3 tầng và hướng dẫn cho dev mới.
- [ ] Cập nhật `server/CLAUDE.md` với quy chuẩn vị trí đặt file mới (Core, Infra, Bounded Contexts).
