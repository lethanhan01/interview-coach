# BÁO CÁO ĐÁNH GIÁ VÀ ĐỀ XUẤT REFACTOR KIẾN TRÚC BACKEND NESTJS

## 1. Mục đích tài liệu

Tài liệu này đánh giá kiến trúc backend NestJS hiện tại, xác định các vấn đề có thể gây khó khăn khi maintain và mở rộng hệ thống, đồng thời đề xuất kiến trúc mục tiêu và kế hoạch refactor theo từng giai đoạn.

Mục tiêu chính:

* Giảm coupling giữa các module.
* Loại bỏ các God Module / God Service đang bắt đầu hình thành.
* Phân biệt rõ business logic và infrastructure.
* Chuẩn hóa ownership của từng nghiệp vụ.
* Chuẩn bị kiến trúc cho các nghiệp vụ phức tạp hơn như:

  * JD Analysis.
  * CV Analysis.
  * Competency Rubric.
  * Rubric Catalog.
  * Adaptive Question Generation.
  * Answer Evaluation.
  * Voice Analysis.
  * Comprehensive Report.
* Cho phép thay thế OpenAI, Redis, Supabase, Prisma hoặc các external provider mà ít ảnh hưởng đến business logic.
* Giữ nguyên API contract và nghiệp vụ hiện tại trong quá trình refactor.
* Cho phép chuyển một số bounded context sang microservice trong tương lai nếu thực sự cần.

---

# 2. Tổng quan hệ thống hiện tại

Backend hiện tại là ứng dụng NestJS sử dụng REST API kết hợp SSE và BullMQ.

Luồng nghiệp vụ chính hiện tại:

```text
Authentication
      ↓
Saved Job Description
      ↓
Interview Session
      ↓
Question Generation
      ↓
Candidate Answer / Turn
      ↓
Transcription nếu dùng Voice
      ↓
AI Feedback
      ↓
Comprehensive Report
      ↓
SSE → Client
```

Trong implementation hiện tại, việc tạo session sẽ enqueue question generation; câu trả lời được đưa qua feedback pipeline; voice answer có thêm transcription; sau khi toàn bộ feedback hoàn thành hệ thống tạo comprehensive report.

Hệ thống cũng đã sử dụng 4 queue riêng cho:

```text
question-generation
feedback
comprehensive-report
transcription
```

Đây là nền tảng phù hợp với nghiệp vụ xử lý dài và không nên thay thế bằng xử lý đồng bộ.

---

# 3. Đánh giá tổng quan kiến trúc hiện tại

## 3.1. Những điểm đang làm tốt

### 3.1.1. Đã áp dụng modular architecture

Hệ thống đã được chia thành các module:

```text
auth
admin
user
session
turn
ai
question-bank
question-criteria
report
saved-job-description
health
prisma
common
```

Đây là nền tảng tốt hơn rất nhiều so với kiến trúc:

```text
controllers/
services/
repositories/
dto/
```

ở cấp toàn project.

---

## 3.2. Async processing được thiết kế hợp lý

Các tác vụ AI dài đã được đưa sang BullMQ thay vì giữ HTTP connection:

```text
Question Generation
Feedback
Report Generation
Transcription
```

Thiết kế này nên được giữ lại.

Thứ cần refactor là **ownership của các worker**, không phải cơ chế queue.

---

## 3.3. Có cơ chế resilience cho AI

AI infrastructure hiện đã có:

* Retry.
* Quota handling.
* Rate-limit handling.
* Timeout.
* JSON repair.
* Zod validation.
* Fallback question.
* Fallback feedback/report.
* Response truncation retry.

Đây là phần implementation có giá trị và nên được bảo toàn khi refactor.

---

## 3.4. Session lifecycle đã bắt đầu được mô hình hóa

Session hiện có các trạng thái:

```text
generating
→ active
→ paused
→ active
→ completing
→ completed
```

và `SessionService` đang thực thi state transition tương ứng.

Đây là tiền đề phù hợp để tách thành một Domain State Machine.

---

# 4. Vấn đề kiến trúc chính

## 4.1. `AiModule` đang trở thành God Module

Đây là vấn đề có mức ưu tiên cao nhất.

Hiện tại `ai/` cùng lúc chứa:

```text
AI Gateway
Prompt Builder
Context Pack
Question Generation
Answer Evaluation
Feedback Processing
Report Generation
Transcription
Rubric Dimension Matching
Question Metadata
Feedback Sanitization
Fallback Content
Language Resolution
BullMQ Processors
```

Các thành phần này không thuộc cùng một business capability.

Ví dụ:

```text
QuestionGenerationProcessor
```

thuộc nghiệp vụ Question.

```text
FeedbackProcessor
```

thuộc Assessment.

```text
ComprehensiveReportProcessor
```

thuộc Reporting.

```text
TranscriptionProcessor
```

thuộc Voice/Interview Processing.

Việc chúng đều sử dụng AI không có nghĩa chúng thuộc `AiModule`.

### Vấn đề

Hiện tại architecture đang có xu hướng:

```text
                AI MODULE
             /      |      \
            /       |       \
       Question  Feedback  Report
          |
     Transcription
```

Khi thêm:

```text
JD Analyzer
CV Analyzer
Competency Builder
Adaptive Interview
Company Analyzer
AI Coach
```

`AiModule` sẽ tiếp tục tăng kích thước và trở thành trung tâm dependency của toàn hệ thống.

### Hướng xử lý

AI nên là:

> Infrastructure capability.

Không nên là:

> Business capability.

---

# 5. Dependency giữa module hiện tại chưa tối ưu

Dependency hiện tại bao gồm:

```text
AiModule
 ├── ReportModule
 ├── QuestionBankModule
 └── QuestionCriteriaModule

TurnModule
 ├── AuthModule
 ├── AiModule
 └── QuestionCriteriaModule

SessionModule
 ├── ReportModule
 └── AuthModule
```

Điều này khiến business flow phụ thuộc vào module implementation.

Ví dụ:

```text
Turn
 ↓
AI
 ↓
Report
```

Kiến trúc mục tiêu nên theo hướng:

```text
Business Use Case
        ↓
      Port
        ↑
Infrastructure Adapter
```

Ví dụ:

```text
EvaluateAnswerUseCase
          ↓
AnswerEvaluatorPort
          ↑
OpenAIAnswerEvaluatorAdapter
```

---

# 6. `BasePipelineService` đang có responsibility quá rộng

Hiện pipeline base đồng thời thực hiện:

```text
build prompt
call LLM
validate output
generate questions
evaluate answers
calculate score
sanitize segments
```

Trong khi:

```text
Generate Question
```

và:

```text
Evaluate Answer
```

là hai use case hoàn toàn khác nhau.

### Đề xuất

Thay:

```text
BasePipelineService
```

bằng các abstraction:

```text
QuestionGeneratorPort

AnswerEvaluatorPort

ReportGeneratorPort
```

và implementation:

```text
OpenAIQuestionGeneratorAdapter

OpenAIAnswerEvaluatorAdapter

OpenAIReportGeneratorAdapter
```

Không cần dùng inheritance chỉ vì chúng cùng gọi LLM.

---

# 7. `OpenAIGateway` đang gánh quá nhiều trách nhiệm

Hiện gateway xử lý đồng thời:

```text
API communication
model selection
timeout
retry
quota
rate limit
JSON repair
response repair
truncated response
Whisper transcription
```

Đây là dấu hiệu service có nguy cơ tiếp tục phình lớn.

### Đề xuất

Tách thành:

```text
infrastructure/
└── ai/
    └── openai/
        ├── clients/
        │   ├── openai-chat.client.ts
        │   └── openai-transcription.client.ts
        │
        ├── resilience/
        │   ├── ai-retry.policy.ts
        │   ├── ai-rate-limit.policy.ts
        │   └── ai-error-classifier.ts
        │
        ├── structured-output/
        │   ├── json-response-parser.ts
        │   ├── json-response-repairer.ts
        │   └── zod-output-validator.ts
        │
        └── config/
            └── ai-model.config.ts
```

---

# 8. `SessionService` đang trở thành God Service

`SessionService` hiện đảm nhiệm:

```text
create session
enforce session limits
resolve rubric
persist session
enqueue question generation
query questions
calculate answer status
auto activate session
state transition
skip unanswered questions
enqueue report
```

Nếu tiếp tục thêm:

```text
adaptive interview
dynamic question allocation
session expiration
recovery
competency coverage
resume logic
timeout handling
```

service sẽ rất khó maintain.

### Đề xuất

Tách thành use case:

```text
CreateSessionUseCase
GetSessionQuery
ListSessionsQuery
GetSessionQuestionsQuery
ChangeSessionStatusUseCase
CompleteSessionUseCase
```

Domain logic:

```text
SessionStateMachine

SessionLimitPolicy

SessionCompletionPolicy
```

---

# 9. `TurnService` đang chứa nhiều workflow khác nhau

Hiện `TurnService` xử lý:

```text
skip question

submit text answer

submit voice answer

edited voice answer

dedup

transcription retry
```

### Đề xuất

Tách thành:

```text
SubmitTextAnswerUseCase

SubmitVoiceAnswerUseCase

SkipQuestionUseCase

RetryTranscriptionUseCase
```

Nếu muốn giữ compatibility với code hiện tại, có thể giữ:

```text
TurnService
```

nhưng biến nó thành facade mỏng gọi các use case tương ứng.

---

# 10. Audio Storage và Speech-to-Text đang bị coupling

Hiện tại `AudioStorageService` và `WhisperService` có một phần responsibility chồng chéo quanh validation, download và transcription.

### Kiến trúc mục tiêu

```text
AudioStoragePort
      ↑
SupabaseAudioStorageAdapter
```

Responsibility:

```text
upload()
delete()
getUrl()
```

Riêng Speech:

```text
SpeechToTextPort
      ↑
OpenAIWhisperAdapter
```

Responsibility:

```text
transcribe()
```

Riêng validation:

```text
AudioFileValidator
```

Voice metrics:

```text
VoiceMetricsAnalyzer
```

Storage không được biết Whisper.

Whisper không được biết business session.

---

# 11. Worker đang nằm sai ownership

Hiện:

```text
ai/processors/
├── question-generation.processor.ts
├── feedback.processor.ts
├── comprehensive-report.processor.ts
└── transcription.processor.ts
```

### Ownership mục tiêu

```text
QuestionModule
└── QuestionGenerationProcessor

Assessment/Feedback
└── FeedbackProcessor

Assessment/Report
└── ReportGenerationProcessor

Interview/Voice
└── TranscriptionProcessor
```

Một processor lý tưởng chỉ làm:

```text
Receive BullMQ Job
       ↓
Parse input
       ↓
Call Use Case
       ↓
Handle success/failure
```

Không nên chứa business logic lớn.

---

# 12. `ReportService` đang trộn Query, Command và Policy

Hiện có:

```text
getReport()

getFeedbackProgress()

enqueueReport()

enqueueIfAllFeedbacksReady()
```

Tương ứng thực chất là:

```text
Query
Query
Command
Policy/Coordinator
```

### Đề xuất

```text
GetReportQuery

GetFeedbackProgressQuery

RequestReportGenerationUseCase

ReportReadinessPolicy
```

---

# 13. Business Rubric đang nằm sai trong Prisma

Hiện `prisma/` chứa:

```text
context-pack.data.ts
reference-data.service.ts
rubric-versioning.ts
```

và các logic liên quan:

```text
RubricVersion
Category
Criterion
ScoringWeight
RubricSnapshot
```

Đây không phải database infrastructure.

Đây là Assessment Domain.

### Prisma sau refactor chỉ nên chứa

```text
PrismaClient
Connection
Transaction
Database error mapping
Timezone/database helpers
```

Rubric cần được chuyển về:

```text
modules/
└── assessment/
    └── rubric/
```

---

# 14. Không nên để runtime bootstrap tự sửa Rubric Catalog

`ReferenceDataService` hiện thực hiện normalize và create/update RubricVersion, Category, Criterion khi bootstrap database.

Điều này có thể làm runtime startup có side effect lên business data.

### Khuyến nghị

Dữ liệu cố định nên được đưa sang:

```text
prisma/
└── seed/
    ├── rubric-catalog.ts
    ├── rubric-versions.ts
    └── rubric-criteria.ts
```

hoặc database migration phù hợp.

Runtime application nên đọc catalog, không nên tự động tái cấu trúc catalog mỗi lần khởi động.

---

# 15. `QuestionBankModule` và `QuestionCriteriaModule` quá nhỏ

Hiện:

```text
QuestionBankModule
    QuestionBankService

QuestionCriteriaModule
    QuestionCriteriaService
```

Hai module này có cohesion cao với Question Domain.

### Đề xuất

Gộp về:

```text
QuestionModule
```

Nhưng không cần gộp service.

Bên trong vẫn có:

```text
QuestionBankService

QuestionRubricMapper

QuestionMetadataResolver
```

Mục tiêu là giảm số lượng Nest Module nhỏ không cần thiết, không phải tạo một service khổng lồ.

---

# 16. ContextPack và DimensionMatcher phải thuộc Assessment

Hiện `ContextPackService` cung cấp dimensions, weights và cultural notes, trong khi `dimension-matcher` ánh xạ AI output về rubric dimensions.

Đây là nghiệp vụ:

```text
Rubric
Assessment
Scoring
```

không phải AI infrastructure.

### Đề xuất

```text
assessment/
└── rubric/
    ├── rubric-context-resolver.ts
    ├── rubric-snapshot.service.ts
    ├── criterion-matcher.service.ts
    └── rubric-catalog.service.ts
```

AI chỉ nhận:

```text
RubricSnapshot
```

làm input.

---

# 17. Auth, User và Admin đang chia quá nhỏ

Hiện:

```text
auth
user
admin
```

đều thao tác trên cùng user/account domain. AuthService cũng đã bao gồm register, login, password change và password reset.

Admin lại quản lý role/status/delete user.

UserModule quản lý profile.

### Đề xuất

Gộp về bounded context:

```text
IdentityModule
```

nhưng giữ use case riêng.

```text
Identity
├── Authentication
├── Profile
└── Administration
```

Admin không cần trở thành domain riêng.

---

# 18. CommonModule đang chứa infrastructure

`SseService` hiện sử dụng Redis Pub/Sub nhưng nằm trong:

```text
common/services/
```

Redis SSE là infrastructure.

### Nên chuyển thành

```text
infrastructure/
└── realtime/
    └── redis-sse/
```

Business layer chỉ phụ thuộc:

```text
RealtimeEventPublisherPort
```

---

# 19. Exception hierarchy cần chuẩn hóa

Hiện base exception mang tên:

```text
InterviewAIException
```

nhưng error code bao gồm:

```text
Auth
Session
Answer
Report
AI
General
```

Tên exception vì vậy không phản ánh đúng responsibility.

### Đề xuất

```text
AppException
```

làm base.

Sau đó:

```text
AuthenticationException
SessionException
AssessmentException
QuestionException
AiProviderException
InfrastructureException
```

Global exception filter chịu trách nhiệm convert sang HTTP response.

---

# 20. Kiến trúc mục tiêu

Kiến trúc nên chuyển sang:

```text
Modular Monolith
      +
Feature First
      +
Clean Architecture có chọn lọc
      +
Ports & Adapters
      +
Event-driven async workflow
```

Không cần áp dụng Clean Architecture đầy đủ cho mọi CRUD nhỏ.

Boundary lớn nên được áp dụng cho các bounded context.

---

# 21. Bounded Context đề xuất

Thay vì rất nhiều module nhỏ, hệ thống nên có khoảng 5 business context chính:

```text
Identity

Job Description

Interview

Question

Assessment
```

Infrastructure nằm bên ngoài.

---

# 22. Cấu trúc thư mục mục tiêu

```text
src/
│
├── main.ts
├── app.module.ts
│
├── bootstrap/
│   ├── bootstrap.ts
│   ├── swagger.setup.ts
│   ├── cors.setup.ts
│   ├── security.setup.ts
│   ├── validation.setup.ts
│   └── graceful-shutdown.setup.ts
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── queue.config.ts
│   ├── auth.config.ts
│   ├── ai.config.ts
│   ├── storage.config.ts
│   └── env.validation.ts
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── middleware/
│   ├── filters/
│   ├── exceptions/
│   ├── dto/
│   ├── types/
│   ├── constants/
│   └── utils/
│
├── infrastructure/
│   │
│   ├── database/
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       ├── prisma.service.ts
│   │       ├── prisma-transaction.service.ts
│   │       ├── prisma-error.mapper.ts
│   │       ├── prisma-connection-error.ts
│   │       └── db-timezone.ts
│   │
│   ├── queue/
│   │   └── bullmq/
│   │       ├── bullmq.module.ts
│   │       ├── queue.constants.ts
│   │       └── queue.config.ts
│   │
│   ├── ai/
│   │   └── openai/
│   │       ├── clients/
│   │       │   ├── openai-chat.client.ts
│   │       │   └── openai-transcription.client.ts
│   │       │
│   │       ├── resilience/
│   │       │   ├── retry.policy.ts
│   │       │   ├── rate-limit.policy.ts
│   │       │   └── ai-error-classifier.ts
│   │       │
│   │       └── structured-output/
│   │           ├── json-parser.ts
│   │           ├── json-repairer.ts
│   │           └── zod-output-validator.ts
│   │
│   ├── storage/
│   │   └── supabase/
│   │       └── supabase-audio-storage.adapter.ts
│   │
│   ├── speech/
│   │   └── openai-whisper/
│   │       └── whisper.adapter.ts
│   │
│   ├── realtime/
│   │   └── redis-sse/
│   │       ├── redis-sse.module.ts
│   │       └── redis-sse.publisher.ts
│   │
│   └── observability/
│       ├── health/
│       ├── logging/
│       └── metrics/
│
└── modules/
    │
    ├── identity/
    │   ├── identity.module.ts
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    ├── job-description/
    │   ├── job-description.module.ts
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    ├── interview/
    │   ├── interview.module.ts
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    ├── question/
    │   ├── question.module.ts
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    └── assessment/
        ├── assessment.module.ts
        ├── rubric/
        ├── feedback/
        └── report/
```

---

# 23. Chi tiết `IdentityModule`

```text
identity/
│
├── identity.module.ts
│
├── domain/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── value-objects/
│   ├── repositories/
│   │   └── user.repository.ts
│   ├── events/
│   └── policies/
│       └── last-admin.policy.ts
│
├── application/
│   ├── use-cases/
│   │   ├── register/
│   │   ├── login/
│   │   ├── logout/
│   │   ├── change-password/
│   │   ├── request-password-reset/
│   │   ├── reset-password/
│   │   ├── update-profile/
│   │   ├── change-user-role/
│   │   ├── change-user-status/
│   │   └── delete-user/
│   │
│   └── ports/
│       ├── password-hasher.port.ts
│       ├── token-provider.port.ts
│       └── mail-provider.port.ts
│
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-user.repository.ts
│   └── security/
│       ├── scrypt-password-hasher.ts
│       └── jwt-token-provider.ts
│
└── presentation/
    └── http/
        ├── auth.controller.ts
        ├── profile.controller.ts
        └── admin-users.controller.ts
```

---

# 24. Chi tiết `InterviewModule`

```text
interview/
│
├── interview.module.ts
│
├── domain/
│   ├── entities/
│   │   ├── interview-session.entity.ts
│   │   └── answer.entity.ts
│   │
│   ├── repositories/
│   │   ├── interview-session.repository.ts
│   │   └── answer.repository.ts
│   │
│   ├── events/
│   │   ├── session-created.event.ts
│   │   ├── answer-submitted.event.ts
│   │   ├── answer-transcribed.event.ts
│   │   └── session-completed.event.ts
│   │
│   ├── policies/
│   │   ├── session-limit.policy.ts
│   │   ├── answer-submission.policy.ts
│   │   └── session-completion.policy.ts
│   │
│   └── services/
│       └── session-state-machine.ts
│
├── application/
│   ├── use-cases/
│   │   ├── create-session/
│   │   ├── get-session/
│   │   ├── list-sessions/
│   │   ├── get-session-questions/
│   │   ├── update-session-status/
│   │   ├── submit-text-answer/
│   │   ├── submit-voice-answer/
│   │   ├── skip-question/
│   │   ├── retry-transcription/
│   │   └── complete-session/
│   │
│   └── ports/
│       ├── realtime-event-publisher.port.ts
│       ├── audio-storage.port.ts
│       └── speech-to-text.port.ts
│
├── infrastructure/
│   ├── repositories/
│   └── queue/
│       └── transcription.processor.ts
│
└── presentation/
    └── http/
        ├── session.controller.ts
        ├── turn.controller.ts
        └── dto/
```

---

# 25. Chi tiết `QuestionModule`

```text
question/
│
├── question.module.ts
│
├── domain/
│   ├── entities/
│   │   └── question.entity.ts
│   ├── repositories/
│   │   └── question.repository.ts
│   ├── enums/
│   │   ├── question-source.enum.ts
│   │   └── question-difficulty.enum.ts
│   └── policies/
│       ├── question-source-mix.policy.ts
│       └── difficulty-distribution.policy.ts
│
├── application/
│   ├── use-cases/
│   │   ├── select-bank-questions/
│   │   └── generate-session-questions/
│   │
│   ├── services/
│   │   ├── question-bank.service.ts
│   │   ├── question-metadata-resolver.ts
│   │   └── question-rubric-mapper.ts
│   │
│   └── ports/
│       └── question-generator.port.ts
│
├── infrastructure/
│   ├── repositories/
│   ├── ai/
│   │   ├── openai-question-generator.adapter.ts
│   │   └── prompts/
│   │       └── question-generation-v1.ts
│   │
│   └── queue/
│       └── question-generation.processor.ts
│
└── presentation/
    └── http/
```

---

# 26. Chi tiết `AssessmentModule`

```text
assessment/
│
├── assessment.module.ts
│
├── rubric/
│   │
│   ├── domain/
│   │   ├── rubric.entity.ts
│   │   ├── rubric-version.entity.ts
│   │   ├── rubric-category.entity.ts
│   │   ├── rubric-criterion.entity.ts
│   │   └── rubric-snapshot.ts
│   │
│   ├── application/
│   │   ├── rubric-catalog.service.ts
│   │   ├── rubric-context-resolver.ts
│   │   ├── rubric-snapshot.service.ts
│   │   └── criterion-matcher.service.ts
│   │
│   └── infrastructure/
│       └── repositories/
│
├── feedback/
│   │
│   ├── domain/
│   │   ├── feedback.entity.ts
│   │   └── score.value-object.ts
│   │
│   ├── application/
│   │   ├── evaluate-answer.use-case.ts
│   │   ├── feedback-segment-sanitizer.ts
│   │   └── ports/
│   │       └── answer-evaluator.port.ts
│   │
│   └── infrastructure/
│       ├── ai/
│       │   ├── openai-answer-evaluator.adapter.ts
│       │   └── prompts/
│       │       └── answer-evaluation-v1.ts
│       │
│       └── queue/
│           └── feedback.processor.ts
│
└── report/
    │
    ├── domain/
    │   └── interview-report.entity.ts
    │
    ├── application/
    │   ├── generate-report.use-case.ts
    │   ├── get-report.query.ts
    │   ├── get-feedback-progress.query.ts
    │   ├── report-readiness.policy.ts
    │   └── ports/
    │       └── report-generator.port.ts
    │
    ├── infrastructure/
    │   ├── ai/
    │   │   ├── openai-report-generator.adapter.ts
    │   │   └── prompts/
    │   │       └── comprehensive-report-v1.ts
    │   │
    │   └── queue/
    │       └── report-generation.processor.ts
    │
    └── presentation/
        └── http/
            └── report.controller.ts
```

---

# 27. Mapping cấu trúc hiện tại sang cấu trúc mới

| Hiện tại                         | Kiến trúc mục tiêu                             |
| -------------------------------- | ---------------------------------------------- |
| `auth/`                          | `modules/identity/`                            |
| `user/`                          | `modules/identity/`                            |
| `admin/`                         | `modules/identity/application/administration`  |
| `session/`                       | `modules/interview/`                           |
| `turn/`                          | `modules/interview/`                           |
| `saved-job-description/`         | `modules/job-description/`                     |
| `question-bank/`                 | `modules/question/`                            |
| `question-criteria/`             | `modules/question/` + `assessment/rubric`      |
| `report/`                        | `modules/assessment/report/`                   |
| `context-pack.service`           | `assessment/rubric`                            |
| `rubric-versioning`              | `assessment/rubric`                            |
| `dimension-matcher`              | `assessment/rubric` hoặc `assessment/feedback` |
| `feedback-segment-sanitizer`     | `assessment/feedback`                          |
| `question-metadata`              | `question/application/services`                |
| `question-generation.processor`  | `question/infrastructure/queue`                |
| `feedback.processor`             | `assessment/feedback/infrastructure/queue`     |
| `comprehensive-report.processor` | `assessment/report/infrastructure/queue`       |
| `transcription.processor`        | `interview/infrastructure/queue`               |
| `audio-storage.service`          | Supabase Storage adapter                       |
| `whisper.service`                | Speech-to-Text adapter                         |
| `SseService`                     | Realtime infrastructure                        |
| `OpenAIGateway`                  | OpenAI infrastructure clients                  |
| `PrismaModule` business data     | chuyển về domain tương ứng                     |
| `AiModule`                       | không còn là business module tổng hợp          |

---

# 28. Dependency architecture mục tiêu

Business dependency:

```text
Presentation
      ↓
Application
      ↓
Domain
```

Infrastructure:

```text
Infrastructure
      ↓
implements Application Ports
```

Không được:

```text
Domain
 ↓
Prisma
```

Không được:

```text
Domain
 ↓
OpenAI
```

Không được:

```text
Domain
 ↓
BullMQ
```

Không được:

```text
Application
 ↓
Supabase SDK
```

Mà phải:

```text
Application
      ↓
    Port
      ↑
Infrastructure Adapter
```

---

# 29. Flow mục tiêu: Question Generation

```text
POST /sessions
      ↓
CreateSessionUseCase
      ↓
InterviewSessionRepository
      ↓
Session Created
      ↓
enqueue question-generation
      ↓
QuestionGenerationProcessor
      ↓
GenerateSessionQuestionsUseCase
      ↓
QuestionGeneratorPort
      ↓
OpenAIQuestionGeneratorAdapter
      ↓
QuestionRepository
```

Question Bank fallback nằm trong `QuestionModule`, không nằm trong AI infrastructure.

---

# 30. Flow mục tiêu: Submit Answer

```text
POST /sessions/:id/turns
          ↓
SubmitTextAnswerUseCase
          ↓
AnswerRepository
          ↓
enqueue feedback
```

Voice:

```text
Upload Audio
     ↓
AudioStoragePort
     ↓
SubmitVoiceAnswerUseCase
     ↓
enqueue transcription
```

---

# 31. Flow mục tiêu: Transcription

```text
TranscriptionProcessor
        ↓
TranscribeAnswerUseCase
        ↓
SpeechToTextPort
        ↓
OpenAIWhisperAdapter
        ↓
Transcript persisted
        ↓
enqueue feedback
```

---

# 32. Flow mục tiêu: Feedback

```text
FeedbackProcessor
       ↓
EvaluateAnswerUseCase
       ↓
RubricSnapshot
       ↓
AnswerEvaluatorPort
       ↓
OpenAIAnswerEvaluatorAdapter
       ↓
Feedback Sanitizer
       ↓
Score calculation
       ↓
Feedback persisted
       ↓
FeedbackCompletedEvent
```

---

# 33. Flow mục tiêu: Report

```text
FeedbackCompleted
       ↓
ReportReadinessPolicy
       ↓
All required feedback complete?
       │
       ├── No → stop
       │
       └── Yes
             ↓
       enqueue report
             ↓
      ReportProcessor
             ↓
      GenerateReportUseCase
             ↓
      ReportGeneratorPort
             ↓
      OpenAIReportGenerator
             ↓
      ReportRepository
             ↓
      report.ready event
```

---

# 34. Nguyên tắc refactor an toàn

Refactor kiến trúc không nên được thực hiện bằng cách rewrite toàn bộ project.

Chiến lược nên là:

```text
Strangler Refactoring
```

Tức là:

```text
Old implementation
        ↓
introduce new abstraction
        ↓
migrate responsibility
        ↓
verify
        ↓
remove old implementation
```

Mỗi bước phải đảm bảo:

```text
API contract không đổi

Database schema không đổi nếu chưa cần

Queue payload không đổi nếu chưa migration

SSE event contract không đổi

Existing E2E test vẫn pass
```

---

# 35. Kế hoạch refactor đề xuất

## Phase 0 — Thiết lập Safety Net

Chưa thay đổi architecture.

Bổ sung test cho các critical flow:

```text
Authentication

Create Session

Question Generation

Submit Text Answer

Submit Voice Answer

Feedback

Session Completion

Report Generation
```

Hiện hệ thống đã có E2E cho full session completion flow.

Cần coi test này là regression contract trong toàn bộ quá trình refactor.

Ngoài ra nên snapshot:

```text
REST request/response

BullMQ job payload

SSE event payload

Prisma writes
```

---

# 36. Phase 1 — Làm sạch Infrastructure

Đây là phase ít ảnh hưởng business nhất.

### Di chuyển

```text
src/prisma
→ src/infrastructure/database/prisma
```

Không đổi implementation ngay.

Di chuyển:

```text
SseService
→ infrastructure/realtime
```

Di chuyển:

```text
audio storage
→ infrastructure/storage/supabase
```

Tách:

```text
Whisper
→ infrastructure/speech
```

Mục tiêu của phase này chỉ là:

> Đưa technical implementation về đúng boundary.

Không thay đổi business behavior.

---

# 37. Phase 2 — Tách OpenAI Infrastructure

Refactor `OpenAIGateway`.

Tạo:

```text
OpenAIChatClient

OpenAITranscriptionClient

AiRetryPolicy

AiErrorClassifier

StructuredOutputParser
```

Sau đó giữ compatibility adapter nếu cần:

```text
OpenAIGateway
```

tạm thời delegate sang các component mới.

Ví dụ:

```text
Old code
    ↓
OpenAIGateway
    ↓
new OpenAIChatClient
```

Khi toàn bộ caller được migrate thì mới xóa Gateway cũ.

---

# 38. Phase 3 — Giải thể `AiModule` theo từng feature

Không xóa `AiModule` trong một commit lớn.

Thứ tự nên là:

```text
Question Generation
        ↓
Transcription
        ↓
Feedback
        ↓
Report
```

Mỗi worker được chuyển sang module sở hữu nghiệp vụ.

Sau khi chuyển hết:

```text
AiModule
```

chỉ còn infrastructure.

Sau đó có thể xóa business `AiModule`.

---

# 39. Phase 4 — Tạo `QuestionModule`

Gộp:

```text
QuestionBankModule

QuestionCriteriaModule

QuestionGeneration
```

vào `QuestionModule`.

Nhưng giữ nguyên:

```text
QuestionBankService
QuestionRubricMapper
QuestionMetadataResolver
```

Không tạo `QuestionService` khổng lồ.

---

# 40. Phase 5 — Tạo `AssessmentModule`

Di chuyển:

```text
ContextPack
RubricVersioning
Rubric Criteria
Dimension Matcher
Feedback Sanitizer
Feedback Processor
Report
```

về:

```text
AssessmentModule
```

Đây là phase có giá trị kiến trúc rất lớn vì toàn bộ scoring domain sẽ có một owner rõ ràng.

Sau phase này:

```text
PrismaModule
```

không còn sở hữu Rubric business logic.

```text
AiModule
```

không còn sở hữu scoring business logic.

---

# 41. Phase 6 — Refactor `SessionService`

Không xóa `SessionService` ngay.

Tạo lần lượt:

```text
CreateSessionUseCase

GetSessionQuestionsQuery

ChangeSessionStatusUseCase

CompleteSessionUseCase

SessionStateMachine
```

Sau đó:

```text
SessionService
```

tạm thời trở thành facade.

Ví dụ:

```text
SessionController
       ↓
SessionService
       ↓
CreateSessionUseCase
```

Khi controller đã migration hoàn toàn:

```text
SessionController
       ↓
CreateSessionUseCase
```

lúc đó mới xóa `SessionService`.

---

# 42. Phase 7 — Refactor `TurnService`

Áp dụng cùng chiến lược:

```text
TurnService
    ↓
SubmitTextAnswerUseCase
SubmitVoiceAnswerUseCase
SkipQuestionUseCase
```

Sau migration:

```text
TurnController
       ↓
Use Cases
```

`TurnService` có thể được loại bỏ.

---

# 43. Phase 8 — Tạo `InterviewModule`

Sau khi Session và Turn đã được chia use case:

```text
SessionModule
TurnModule
```

có thể được gom về:

```text
InterviewModule
```

Nhưng không gộp business logic trở lại.

Tức là:

```text
1 NestJS Module

nhiều use case/service nhỏ
```

---

# 44. Phase 9 — Refactor Identity

Cuối cùng mới xử lý:

```text
Auth
User
Admin
```

vì phần này tương đối độc lập với interview pipeline.

Tạo:

```text
IdentityModule
```

và tách AuthService thành use case.

---

# 45. Phase 10 — Chuyển service-to-service dependency sang Events/Ports

Sau khi boundary đã ổn định, mới tối ưu dependency.

Ví dụ hiện tại:

```text
Feedback
   ↓
ReportService.enqueueIfAllFeedbacksReady()
```

chuyển thành:

```text
FeedbackCompletedEvent
        ↓
ReportReadinessHandler
```

Tương tự:

```text
SessionCreatedEvent

AnswerSubmittedEvent

AnswerTranscribedEvent

FeedbackCompletedEvent

ReportGeneratedEvent
```

Không cần biến mọi thứ thành event.

Chỉ dùng event cho những side effect xuyên bounded context.

---

# 46. Những việc KHÔNG nên làm trong quá trình refactor

Không nên cùng lúc:

```text
refactor architecture
+
đổi database schema
+
đổi API contract
+
đổi queue payload
+
đổi prompt
+
đổi scoring algorithm
```

Nếu xảy ra regression sẽ rất khó xác định nguyên nhân.

Trong architectural refactor:

> Business behavior phải được giữ ổn định.

Business improvement nên thực hiện sau.

---

# 47. Nguyên tắc một Pull Request

Một PR nên có một mục tiêu kiến trúc rõ ràng.

Ví dụ tốt:

```text
refactor: extract OpenAI chat client

refactor: move transcription worker into interview module

refactor: extract CreateSessionUseCase

refactor: introduce QuestionGeneratorPort

refactor: move rubric context into assessment module
```

Không nên:

```text
refactor entire backend architecture
```

trong một PR duy nhất.

---

# 48. Điều kiện hoàn thành mỗi phase

Mỗi phase chỉ được coi là hoàn tất khi:

```text
Build pass

Unit test pass

Integration test pass

Session completion E2E pass

REST API contract không đổi

Queue contract không đổi

SSE event contract không đổi

Không xuất hiện circular dependency mới

Không duplicate business logic

Old implementation tương ứng đã được remove
```

---

# 49. Priority Matrix

| Refactor                                | Priority          | Impact                     |
| --------------------------------------- | ----------------- | -------------------------- |
| Giải thể God `AiModule`                 | P0                | Rất cao                    |
| Tách `SessionService`                   | P0                | Rất cao                    |
| Rubric → Assessment                     | P0                | Rất cao                    |
| Prisma chỉ còn infrastructure           | P0                | Cao                        |
| Tách `OpenAIGateway`                    | P1                | Cao                        |
| QuestionBank + Criteria → Question      | P1                | Cao                        |
| Feedback → Assessment                   | P1                | Cao                        |
| Report → Assessment                     | P1                | Cao                        |
| Storage / Whisper separation            | P1                | Trung bình                 |
| Session + Turn → Interview              | P2                | Trung bình                 |
| Auth + User + Admin → Identity          | P2                | Trung bình                 |
| Event-driven cross-module communication | P2                | Cao về dài hạn             |
| CQRS toàn hệ thống                      | Không cần         | Có nguy cơ overengineering |
| Microservice ngay bây giờ               | Không khuyến nghị | Complexity cao             |

---

# 50. Kiến trúc không nên hướng tới

Không nên biến project thành:

```text
src/
├── controllers/
├── services/
├── repositories/
├── dto/
└── entities/
```

vì business capability sẽ bị phân tán.

Cũng không nên tạo:

```text
question-bank/
├── domain/
├── application/
├── infrastructure/
└── presentation/

question-criteria/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

cho từng feature rất nhỏ.

Clean Architecture nên áp dụng ở:

```text
Identity
Interview
Question
Assessment
JobDescription
```

thay vì từng class/service nhỏ.

---

# 51. Nguyên tắc quyết định có tách Service hay không

Nên tách khi một service:

* Thực hiện nhiều use case độc lập.
* Có nhiều nhánh nghiệp vụ lớn.
* Vừa query vừa command vừa orchestration.
* Giao tiếp nhiều external system.
* Có nhiều lý do khác nhau để thay đổi.
* Khó unit test độc lập.
* Constructor có quá nhiều dependencies.

Không nên tách chỉ vì:

```text
file > 200 lines
```

Số dòng không phải tiêu chí chính.

Responsibility mới là tiêu chí chính.

---

# 52. Nguyên tắc quyết định có gộp Module hay không

Nên gộp module khi:

```text
cùng Aggregate

cùng Business Capability

module quá nhỏ

thường xuyên import lẫn nhau

không có lifecycle độc lập
```

Ví dụ hợp lý:

```text
Auth + User + Admin
→ Identity

Session + Turn
→ Interview

QuestionBank + QuestionCriteria
→ Question
```

Không nên gộp:

```text
Interview + Assessment

Question + Assessment
```

vì dù liên quan chặt chẽ, hai context này có responsibility khác nhau.

---

# 53. Định hướng mở rộng tương lai

Sau kiến trúc mới, các capability tiếp theo có thể được thêm mà không phá cấu trúc.

Ví dụ:

```text
modules/
├── identity/
├── job-description/
├── candidate-profile/
├── interview/
├── question/
├── assessment/
└── company/
```

JD Analysis:

```text
job-description/
└── analysis/
```

CV Analysis:

```text
candidate-profile/
└── analysis/
```

Competency Builder:

```text
assessment/
└── competency/
```

Rubric Catalog:

```text
assessment/
└── rubric/
```

Adaptive Interview:

```text
interview/
└── adaptive/
```

Question allocation:

```text
question/
└── selection/
```

Không cần đưa chúng trở lại một `AiModule`.

---

# 54. Hình ảnh kiến trúc cuối cùng

```text
                      ┌─────────────────────┐
                      │    Presentation     │
                      │ REST / SSE / Worker │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │     Application     │
                      │      Use Cases      │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │       Domain        │
                      │   Business Rules    │
                      └─────────────────────┘
                                 ▲
                                 │ implements ports
                                 │
                      ┌──────────┴──────────┐
                      │   Infrastructure    │
                      │                    │
                      │ Prisma             │
                      │ OpenAI             │
                      │ Redis / BullMQ      │
                      │ Supabase           │
                      │ Whisper            │
                      └─────────────────────┘
```

Ở cấp bounded context:

```text
             ┌──────────┐
             │ Identity │
             └──────────┘

┌───────────────┐
│ JobDescription│
└───────┬───────┘
        │
        ▼
 ┌─────────────┐
 │  Interview  │
 └──────┬──────┘
        │
        ├─────────────► Question
        │
        └─────────────► Assessment
                              │
                         ┌────┴────┐
                         │ Rubric  │
                         │Feedback │
                         │ Report  │
                         └─────────┘
```

---

# 55. Kết luận

Kiến trúc hiện tại **không cần rewrite**.

Nền tảng quan trọng đã có:

```text
NestJS Module

BullMQ

Redis

SSE

Prisma

Async pipeline

AI fallback

Session lifecycle

E2E interview flow
```

Vấn đề chính hiện tại nằm ở **ownership và dependency boundary**.

Ba thay đổi mang lại giá trị cao nhất là:

```text
1. Giải thể AiModule với vai trò God Business Module.

2. Chuyển Rubric / ContextPack / Scoring về Assessment Domain.

3. Tách SessionService, TurnService và ReportService thành các application use case.
```

Sau đó mới tiến hành:

```text
Question consolidation

Interview consolidation

Identity consolidation

Ports & Adapters

Cross-module Events
```

Kiến trúc mục tiêu cuối cùng nên giữ hệ thống ở dạng:

> **Modular Monolith có bounded context rõ ràng, business logic chia theo use case, infrastructure được che sau ports/adapters, còn BullMQ và event-driven workflow đảm nhiệm các quy trình xử lý dài.**

Đây là hướng cân bằng giữa khả năng maintain, scalability và độ phức tạp, đồng thời vẫn cho phép hệ thống tiếp tục phát triển thêm JD Analyzer, CV Analyzer, Competency/Rubric Catalog, Adaptive Interview và nhiều AI provider mà không khiến codebase quay trở lại trạng thái phụ thuộc tập trung vào một `AiModule`.
