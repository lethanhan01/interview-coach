# KẾ HOẠCH THIẾT KẾ KIẾN TRÚC BACKEND HỆ THỐNG MOCK INTERVIEW
## Tối Ưu Cho Scope Hiện Tại & Thiết Kế Điểm Mở Rộng (Extension Seams) Tương Lai

- **Tài liệu:** Kế hoạch thiết kế & tái cấu trúc kiến trúc Backend
- **Hệ thống:** Nền tảng luyện phỏng vấn tích hợp AI (AI Mock Interview Coach)
- **Công nghệ nền tảng:** NestJS 11, TypeScript, PostgreSQL (Prisma ORM), Redis (BullMQ), OpenAI Gateway
- **Mục đích:** Cung cấp bản thiết kế chuẩn xác để đội ngũ review, rà soát và đánh giá kỹ lưỡng trước khi bắt tay vào triển khai.

---

## 1. TỔNG QUAN VÀ ĐỊNH NGHĨA PHẠM VI (SCOPE DEFINITION)

### 1.1. Phạm vi Triển khai Hiện tại (Current Active Scope)
Hệ thống tập trung làm thật xuất sắc, ổn định, an toàn và tối ưu cho hình thức **Phỏng vấn Luyện tập theo lượt (Turn-based Mock Interview)**:
- **Chế độ phỏng vấn (Interview Modes)**:
  - `hr`: Phỏng vấn nhân sự, văn hóa và câu hỏi tình huống hành vi (STAR).
  - `technical`: Phỏng vấn kiến thức kỹ thuật chuyên sâu theo vị trí công việc.
- **Phương thức tiếp nhận câu trả lời (Answer Intake)**:
  - `text`: Nhập nội dung câu trả lời dạng văn bản.
  - `audio`: Ghi âm và upload file âm thanh (được lưu trữ riêng tư, bóc băng tự động).
- **Tương tác AI (AI Orchestration)**:
  - Sinh bộ câu hỏi phỏng vấn bám sát Job Description (JD) & Hồ sơ cá nhân (Profile) hoặc ngân hàng câu hỏi gắn Rubrics.
  - Đánh giá câu trả lời từng lượt (`AiFeedback`): Phân tích điểm số, điểm mạnh, điểm yếu và trích xuất phân đoạn chi tiết (`AnnotatedSegment`).
  - Tổng hợp báo cáo phỏng vấn toàn diện (`SessionReport`) kèm ma trận điểm số Radar đa chiều và lộ trình cải thiện (Action Plan).
- **Hạ tầng bất đồng bộ & Bảo mật**:
  - Lưu trữ media riêng tư (Private Object Storage, truy xuất an toàn qua Pre-signed URL có hạn dùng).
  - Điều phối tác vụ ngầm (Bóc băng audio, sinh câu hỏi, chấm điểm, tổng hợp báo cáo) bằng **Transactional Outbox Pattern** kết hợp **Redis BullMQ**.

### 1.2. Phạm vi Mở rộng Tương lai (Future Extension Scope)
Các tính năng sau **chưa cần lập trình trong giai đoạn này**, nhưng kiến trúc **đã bố trí sẵn các điểm cắm nối (Extension Seams / Ports & Adapters)** để khi phát triển chỉ cần "cắm thêm" mà **hoàn toàn không phải refactor lại core logic**:
1. **Live Coding / Algorithm Interview**: Môi trường chạy code Sandbox cô lập (Docker/gVisor), chấm testcases tự động và trợ lý AI gợi ý 3 cấp độ (Hint Escalation).
2. **Real-time Duplex Voice Interview**: Đàm thoại trực tiếp 2 chiều độ trễ thấp (<500ms) qua WebRTC/WebSocket với Voice Activity Detection (Silero VAD) và xử lý ngắt lời AI (Barge-in).
3. **Multi-LLM Provider**: Bổ sung song song Google Gemini, Anthropic Claude hoặc Local LLMs bên cạnh OpenAI.

---

## 2. ỨNG DỤNG CÁC NGUYÊN TẮC THIẾT KẾ CỐT LÕI (SOLID & COHESION)

| Nguyên tắc | Hiện thực hóa cho Scope Hiện tại | Điểm tựa Mở rộng Tương lai (Extension Seams) |
| :--- | :--- | :--- |
| **Single Responsibility (SRP)** | Mỗi Service/Handler chỉ chịu trách nhiệm duy nhất: `TextAnswerIntakeHandler` chỉ xử lý text; `AudioAnswerIntakeHandler` chỉ lưu trữ private media và kích hoạt lệnh bóc băng; `SessionLifecyclePolicy` chỉ thẩm định trạng thái hợp lệ. | Bổ sung `LiveCoding`: chỉ cần tạo mới `CodeAnswerIntakeHandler`, không làm phình to hay ảnh hưởng tới các handler hiện có. |
| **Open / Closed (OCP)** | Core `SessionWorkflowEngine` điều phối luồng theo quy trình chuẩn hóa thông qua interface `IInterviewModeStrategy`. | Thêm chế độ phỏng vấn mới (ví dụ `LiveCodingStrategy`) chỉ cần tạo class mới và đăng ký vào `SessionStrategyRegistry`, **không sửa 1 dòng code nào** trong `SessionService`. |
| **Liskov Substitution (LSP)** | Mọi AI Adapter đều tuân thủ contract `IAIGateway`. | `OpenAIGateway` hiện tại có thể được thay thế hoặc bọc bởi `GeminiGateway` hay `FallbackAIGateway` mà các use cases (`QuestionService`, `AssessmentService`) không hề nhận biết sự thay đổi. |
| **Interface Segregation (ISP)** | Tách nhỏ các interface chuyên biệt: `IAnswerIntakeHandler`, `IWorkflowCommandHandler`, `IPrivateMediaStorageAdapter`, `IAIGateway`. | Không ép một interface khổng lồ cho cả Voice, Text và Code. Module nào cần tính năng gì thì chỉ phụ thuộc vào Port đó. |
| **Dependency Inversion (DIP)** | Các tầng Nghiệp vụ (Application/Domain) chỉ phụ thuộc vào **Ports/Interfaces** (được inject qua NestJS DI Tokens như `AI_GATEWAY_TOKEN`, `MEDIA_STORAGE_TOKEN`). | Infrastructure adapters (OpenAI SDK, Supabase/S3 Storage, Prisma) chỉ đóng vai trò cắm ngoài. Có thể mock 100% trong Unit Tests mà không cần database hay API key thật. |
| **High Cohesion - Loose Coupling** | Giao tiếp giữa các module (`Session`, `Turn`, `Question`, `Assessment`, `Report`) diễn ra qua **Domain Events** và **Transactional Outbox Commands**. | Ranh giới dữ liệu rõ ràng, ngăn ngừa việc 1 module chọc thẳng vào bảng dữ liệu của module khác, sẵn sàng tách thành Microservices độc lập khi cần scale. |

---

## 3. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ (HEXAGONAL ARCHITECTURE)

```
+---------------------------------------------------------------------------------------------------+
|                                      HTTP / REST API CONTROLLERS                                   |
|       AuthController  |  SessionController  |  TurnController  |  ReportController  |  Profile     |
+---------------------------------------------------------------------------------------------------+
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼ (Calls Use Cases)                                               ▼ (Delegates)
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    APPLICATION & DOMAIN LAYER                                     |
|                                                                                                   |
|  ┌─────────────────────────────────┐               ┌───────────────────────────────────────────┐  |
|  |         Session Module          |               |                Turn Module                |  |
|  | - SessionService                |               | - TurnService                             |  |
|  | - StrategyRegistry              |               | - AnswerIntakeRegistry                    |  |
|  |   ├─ StandardTurnBasedStrategy  |               |   ├─ TextAnswerHandler                    |  |
|  |   └─ [LiveCodingStrategy] (Fut) |               |   ├─ AudioAnswerHandler                   |  |
|  └────────────────┬────────────────┘               |   └─ [CodeAnswerHandler] (Future)         |  |
|                   │                                └─────────────────────┬─────────────────────┘  |
|                   ▼                                                      ▼                        |
|  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  |
|  |                                  TRANSACTIONAL WORKFLOW OUTBOX                              |  |
|  |  - WorkflowOutboxService (Ghi command vào cùng DB Transaction với state thay đổi)           |  |
|  |  - OutboxDispatcherJob (Quét pending -> Đẩy vào Redis BullMQ -> Dispatcher)                 |  |
|  |  - Command Handlers:                                                                        |  |
|  |    ├─ GenerateQuestionsCommandHandler                                                       |  |
|  |    ├─ TranscribeAudioCommandHandler                                                         |  |
|  |    ├─ EvaluateTurnAnswerCommandHandler                                                      |  |
|  |    ├─ GenerateSessionReportCommandHandler                                                   |  |
|  |    └─ [ExecuteCodeSandboxCommandHandler] (Future)                                           |  |
|  └──────────────────────────────────────────────┬──────────────────────────────────────────────┘  |
|                                                 │                                                 |
+═════════════════════════════════════════════════╪═════════════════════════════════════════════════+
|                                                 ▼                                                 |
|                                 INFRASTRUCTURE LAYER (PORTS & ADAPTERS)                           |
|                                                                                                   |
|  ┌─────────────────────────────────────────────────────────┐  ┌────────────────────────────────┐  |
|  |                   IAIGateway (Port)                     |  |  IPrivateMediaStorage (Port)   |  |
|  |                      ▲                                  |  |               ▲                |  |
|  |                      │ implements                       |  |               │ implements     |  |
|  |             OpenAIGateway (Current Adapter)             |  |      S3/SupabaseMediaAdapter   |  |
|  |             [ClaudeGateway / GeminiGateway] (Future)    |  |  (Lưu private key, cấp signed) |  |
|  └─────────────────────────────────────────────────────────┘  └────────────────────────────────┘  |
|                                                                                                   |
|  ┌─────────────────────────────────────────────────────────┐  ┌────────────────────────────────┐  |
|  |               PERSISTENCE (PRISMA ADAPTER)              |  |         MESSAGE QUEUE          |  |
|  | - PostgreSQL via Prisma ORM                             |  | - Redis + BullMQ Adapter       |  |
|  | - Session, Question, Turn, Feedback, Report Entities    |  | - Concurrency & Retry Policies |  |
|  └─────────────────────────────────────────────────────────┘  └────────────────────────────────┘  |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. CHI TIẾT THIẾT KẾ CÁC MODULE VÀ EXTENSION SEAMS

### 4.1. Session Engine & Strategy Seam
Mỗi hình thức phỏng vấn chịu trách nhiệm về 4 giai đoạn nghiệp vụ:
1. **Chuẩn bị câu hỏi**: Lấy từ Question Bank hoặc sinh động từ AI.
2. **Kiểm tra tiền điều kiện**: Kiểm tra xem ứng viên đã hoàn thành câu hỏi trước đó chưa.
3. **Điều kiện kết thúc**: Xác định khi nào phiên đã đủ điều kiện để tính điểm tổng kết.
4. **Cấu trúc dữ liệu báo cáo**: Định dạng payload báo cáo phù hợp với đặc thù phỏng vấn.

```typescript
// src/session/strategies/interview-mode-strategy.interface.ts
export interface IInterviewModeStrategy {
  readonly mode: 'hr' | 'technical' | string; // 'hr' | 'technical' | future: 'live_coding'

  prepareQuestions(session: InterviewSessionEntity): Promise<PreparedQuestionDto[]>;
  validateTurnPrerequisites(session: InterviewSessionEntity, currentTurnIndex: number): void;
  isSessionCompletable(session: InterviewSessionEntity): boolean;
  buildReportPayload(session: InterviewSessionEntity, evaluations: TurnEvaluationDto[]): Record<string, any>;
}

// src/session/strategies/session-strategy.registry.ts
@Injectable()
export class SessionStrategyRegistry {
  private readonly strategies = new Map<string, IInterviewModeStrategy>();

  constructor(
    hrStrategy: HrInterviewStrategy,
    technicalStrategy: TechnicalInterviewStrategy,
  ) {
    // Phân tách triệt để SRP/OCP: Hr xử lý hành vi STAR/rubric văn hóa, Technical xử lý kỹ thuật/hệ thống
    this.register('hr', hrStrategy);
    this.register('technical', technicalStrategy);
  }

  public register(mode: string, strategy: IInterviewModeStrategy): void {
    this.strategies.set(mode, strategy);
  }

  public getStrategy(mode: string): IInterviewModeStrategy {
    const strategy = this.strategies.get(mode);
    if (!strategy) {
      throw new BadRequestException(`Hình thức phỏng vấn không được hỗ trợ: ${mode}`);
    }
    return strategy;
  }
}
```

---

### 4.2. Answer Intake & Media Seam
Phân tách xử lý nhập liệu văn bản (`Text`) và ghi âm giọng nói (`Audio`) qua **Strategy / Handler Pattern**:

```typescript
// src/turn/intake/answer-intake-handler.interface.ts
export interface IAnswerIntakeHandler<TPayload, TResult> {
  readonly supportedMode: string; // 'text' | 'audio' | future: 'code'
  
  handle(
    sessionId: string,
    questionId: string,
    payload: TPayload,
    transactionContext: PrismaTransaction
  ): Promise<TResult>;
}
```

1. **`TextAnswerIntakeHandler`**:
   - Kiểm tra tính hợp lệ của văn bản (độ dài, ký tự rác).
   - Ghi nhận `UserAnswer` (với `answerMode: 'text'`).
   - Ghi Outbox Command: `EVALUATE_TURN_ANSWER`.
2. **`AudioAnswerIntakeHandler`**:
   - Nhận audio buffer từ request.
   - Upload vào private bucket thông qua `IPrivateMediaStorageAdapter`, sinh `mediaKey`.
   - Ghi nhận `UserAnswer` (với `answerMode: 'audio'`, `mediaKey`, `transcriptionStatus: 'pending'`).
   - Ghi Outbox Command: `TRANSCRIBE_AUDIO`.

---

### 4.3. Hexagonal AI Gateway Seam
Ứng dụng triệt để nguyên tắc **Dependency Inversion (DIP)** để tách rời nghiệp vụ khỏi vendor OpenAI:

```typescript
// src/infrastructure/ai/ports/ai-gateway.port.ts
export const AI_GATEWAY_TOKEN = Symbol('AI_GATEWAY_TOKEN');

export interface IAIGateway {
  // Sinh dữ liệu có cấu trúc qua Zod schema (câu hỏi, đánh giá tiêu chí, báo cáo)
  generateStructured<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodSchema<T>;
    schemaName: string;
  }): Promise<T>;

  // Sinh văn bản tự do
  generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
  }): Promise<string>;

  // Bóc băng âm thanh sang văn bản
  transcribeAudio(params: {
    audioStreamOrBuffer: Buffer;
    language?: string;
  }): Promise<{ text: string; durationSeconds?: number }>;
}
```

- Hiện tại: `OpenAIGateway` cài đặt `IAIGateway`.
- `QuestionService`, `AssessmentService`, `ReportService` chỉ phụ thuộc vào `IAIGateway` thông qua `@Inject(AI_GATEWAY_TOKEN)`.
- Khi cần bổ sung Google Gemini hoặc Anthropic Claude: chỉ cần viết thêm `GeminiGateway implements IAIGateway` và hoán đổi trong DI container, **không sửa 1 dòng code nghiệp vụ nào**.

---

### 4.4. Transactional Workflow Outbox Seam
Giải quyết triệt để vấn đề mất dữ liệu hoặc rớt tác vụ nền khi server gặp sự cố giữa lúc DB commit và gửi message vào queue:

```
[User Request] ──> [DB Transaction: Save State + Save Outbox Command] ──> [DB Commit]
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
▼
[Outbox Dispatcher Poller] (Quét các record 'pending')
  │
  ├── Đẩy job vào Redis BullMQ (kèm Idempotency Key)
  └── Đánh dấu trạng thái 'dispatched'
        │
        ▼
[BullMQ Worker Service]
  │
  ├── Tìm Handler tương ứng trong CommandHandlerRegistry
  │     ├─ GenerateQuestionsHandler
  │     ├─ TranscribeAudioHandler
  │     ├─ EvaluateTurnAnswerHandler
  │     └─ GenerateSessionReportHandler
  │
  └── Thực thi tác vụ -> Cập nhật Outbox 'processed' (hoặc retry nếu lỗi)
```

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN HÓA (PRISMA SCHEMA)

Thiết kế loại bỏ lưu trữ URL công khai, sử dụng `mediaKey` cho storage riêng tư, và bổ sung cột `metadata Json?` để mở rộng linh hoạt mà không cần alter table:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ----------------------------------------------------
// 1. NHÓM PHIÊN PHỎNG VẤN (SESSION DOMAIN)
// ----------------------------------------------------

enum SessionStatus {
  configuring
  generating_questions
  ready
  in_progress
  evaluating
  completed
  abandoned
}

model InterviewSession {
  id                    String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId                String              @map("user_id") @db.Uuid
  sessionType           String              @map("session_type") // 'hr', 'technical', future: 'live_coding'
  status                SessionStatus       @default(configuring)
  
  jobTitle              String              @map("job_title")
  jobDescription        String              @map("job_description")
  language              String              @default("vi")
  durationMin           Int                 @default(30) @map("duration_min")
  remainingSeconds      Int?                @map("remaining_seconds")
  
  rubricVersionId       String              @map("rubric_version_id") @db.Uuid
  savedJobDescriptionId String?             @map("saved_job_description_id") @db.Uuid
  
  overallScore          Int?                @map("overall_score") // Thang điểm 0 - 100
  metadata              Json?               // Cấu hình đặc thù của phiên (VD: bitrate audio, limit sandbox tương lai)
  
  completedAt           DateTime?           @map("completed_at") @db.Timestamptz(6)
  createdAt             DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime            @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  rubricVersion         RubricVersion       @relation(fields: [rubricVersionId], references: [id], onDelete: Restrict)
  questions             SessionQuestion[]
  reports               SessionReport[]

  @@index([userId, status, createdAt(sort: Desc)], map: "idx_sessions_user_status")
  @@map("interview_sessions")
}

// ----------------------------------------------------
// 2. NHÓM CÂU HỎI & LƯỢT TRẢ LỜI (QUESTION & TURN DOMAIN)
// ----------------------------------------------------

model SessionQuestion {
  id               String                     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId        String                     @map("session_id") @db.Uuid
  orderIndex       Int                        @map("order_index")
  questionText     String                     @map("question_text")
  questionCategory String                     @map("question_category")
  estimatedTimeMin Int?                       @map("estimated_time_min")
  
  createdAt        DateTime                   @default(now()) @map("created_at") @db.Timestamptz(6)
  session          InterviewSession           @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  userAnswer       UserAnswer?
  criteria         SessionQuestionCriterion[]

  @@unique([sessionId, orderIndex], map: "uq_session_questions_order")
  @@index([sessionId], map: "idx_session_questions_session")
  @@map("session_questions")
}

model UserAnswer {
  id                   String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  questionId           String          @unique @map("question_id") @db.Uuid
  answerMode           String          @map("answer_mode") // 'text', 'audio', future: 'code'
  
  answerText           String          @map("answer_text") // Văn bản ứng viên nhập hoặc transcript bóc băng
  mediaKey             String?         @map("media_key")   // Object key trong private storage (thay vì public URL)
  audioDurationSeconds Int?            @map("audio_duration_seconds")
  
  skipped              Boolean         @default(false)
  transcriptionStatus  String?         @map("transcription_status") // 'pending', 'completed', 'failed'
  
  metadata             Json?           // Thông số mở rộng (WPM, filler words, testcase results)
  
  createdAt            DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime        @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  question             SessionQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  aiFeedback           AiFeedback?

  @@index([questionId], map: "idx_user_answers_question")
  @@map("user_answers")
}

// ----------------------------------------------------
// 3. NHÓM ĐÁNH GIÁ & BÁO CÁO (ASSESSMENT & REPORT DOMAIN)
// ----------------------------------------------------

model AiFeedback {
  id                String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userAnswerId      String             @unique @map("user_answer_id") @db.Uuid
  overallScore      Int                @map("overall_score")
  modelAnswer       String             @map("model_answer")
  keyTakeaway       String             @map("key_takeaway")
  promptVersion     String             @map("prompt_version")
  isFallback        Boolean            @default(false) @map("is_fallback")
  
  dimensionScores   Json?              @map("dimension_scores")
  
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  userAnswer        UserAnswer         @relation(fields: [userAnswerId], references: [id], onDelete: Cascade)
  annotatedSegments AnnotatedSegment[]

  @@map("ai_feedbacks")
}

model AnnotatedSegment {
  id              String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  aiFeedbackId    String     @map("ai_feedback_id") @db.Uuid
  segmentText     String     @map("segment_text")
  startIndex      Int        @map("start_index")
  endIndex        Int        @map("end_index")
  highlightLevel  String     @map("highlight_level") // 'positive', 'warning', 'critical'
  annotation      String
  suggestion      String?
  
  createdAt       DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  aiFeedback      AiFeedback @relation(fields: [aiFeedbackId], references: [id], onDelete: Cascade)

  @@index([aiFeedbackId], map: "idx_annotated_segments_feedback")
  @@map("annotated_segments")
}

model SessionReport {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId        String           @map("session_id") @db.Uuid
  reportType       String           @default("standard") @map("report_type")
  version          Int              @default(1)
  contentJson      Json             @map("content_json")
  generatedByModel String?          @map("generated_by_model")
  
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  session          InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, reportType, version], map: "uq_session_reports_version")
  @@map("session_reports")
}

// ----------------------------------------------------
// 4. TRANSACTIONAL WORKFLOW OUTBOX
// ----------------------------------------------------

model WorkflowOutbox {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  commandType    String    @map("command_type")
  aggregateId    String    @map("aggregate_id") @db.Uuid
  payload        Json
  idempotencyKey String    @unique @map("idempotency_key")
  state          String    @default("pending") // 'pending', 'dispatched', 'processed', 'failed'
  attempts       Int       @default(0)
  availableAt    DateTime  @default(now()) @map("available_at") @db.Timestamptz(6)
  processedAt    DateTime? @map("processed_at") @db.Timestamptz(6)
  errorSummary   String?   @map("error_summary")
  
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([state, availableAt], map: "idx_workflow_outbox_due")
  @@index([aggregateId], map: "idx_workflow_outbox_aggregate")
  @@map("workflow_outbox")
}
```

---

## 6. HƯỚNG DẪN MỞ RỘNG TÍNH NĂNG TƯƠNG LAI (EXTENSION PLAYBOOK)

Khi dự án chính thức kích hoạt phát triển tính năng mới, đội ngũ phát triển chỉ cần làm theo các bước chuẩn mực sau:

### 6.1. Bổ sung tính năng Live Coding
1. **Tạo Strategy**: Tạo file `LiveCodingStrategy implements IInterviewModeStrategy` trong `src/session/strategies/`.
2. **Đăng ký**: Gọi `sessionStrategyRegistry.register('live_coding', liveCodingStrategy)`.
3. **Thêm Answer Handler**: Tạo `CodeAnswerIntakeHandler implements IAnswerIntakeHandler` trong `src/turn/intake/` để nhận `{ code, language }`.
4. **Tạo Outbox Command**: Thêm command `EXECUTE_CODE_SANDBOX` và viết `ExecuteCodeSandboxCommandHandler implements IWorkflowCommandHandler` gọi tới Sandbox runner (gVisor/Docker).
5. **Kết quả**: Bảng `UserAnswer.metadata` tự động lưu `{ passedTestcases, totalTestcases, executionTimeMs }`. Không cần sửa `SessionService`, `TurnService`, hay `PrismaSchema`.

### 6.2. Bổ sung tính năng Real-time Voice (WebRTC/WebSocket)
1. **Tạo Gateway**: Tạo module `src/realtime/` quản lý kết nối WebSocket và binary audio stream.
2. **Tạo Strategy**: Tạo `RealtimeVoiceStrategy implements IInterviewModeStrategy`.
3. **Tích hợp VAD**: Gắn Silero VAD tại Gateway để phát hiện tiếng nói và gửi lệnh ngắt lời (Barge-in).
4. **Intake Audio**: Khi ứng viên nói xong 1 turn, Gateway gọi thẳng `TurnService.submitAnswer(...)` như một lượt thông thường.

### 6.3. Bổ sung nhà cung cấp AI mới (Gemini / Claude)
1. **Tạo Adapter**: Tạo `GeminiGateway implements IAIGateway` trong `src/infrastructure/ai/adapters/`.
2. **Cấu hình NestJS**: Thay đổi provider `AI_GATEWAY_TOKEN` trong `AIModule` trỏ tới `GeminiGateway` (hoặc tạo `FallbackAIGateway` gom cả 2).
3. **Kết quả**: Tất cả pipeline chấm điểm, sinh câu hỏi, tạo báo cáo tự động chạy mượt mà trên model mới mà không phải sửa lại code gọi AI.

---

## 7. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN (IMPLEMENTATION ROADMAP)

Để đảm bảo không làm gián đoạn hệ thống hiện tại, việc refactor được chia thành 4 giai đoạn an toàn:

### Giai đoạn 1: Chuẩn hóa Hợp đồng AI Gateway & Storage (Ports & Adapters) — [x] ĐÃ HOÀN THÀNH (100% Tests Passed)
- [x] Tạo Port `IAIGateway` (`src/ai/ai-gateway.interface.ts`) và refactor `OpenAIGateway` làm Adapter chuẩn implements `IAIGateway`.
- [x] Cập nhật các service AI (`BasePipelineService`, `EvaluateAnswer`, `GenerateSessionQuestions`, `GenerateComprehensiveReport`, `SpeechToText`) inject qua `AI_GATEWAY_TOKEN`.
- [x] Xây dựng Port `IPrivateMediaStorage` và `SupabaseMediaStorageAdapter` để lưu file ghi âm riêng tư và cấp Signed URL có hạn dùng an toàn (TTL 30 phút).
- [x] Đạt 100% test coverage trên 52/52 test suites (420/420 tests passed) và tuân thủ tuyệt đối ranh giới kiến trúc `feature-boundaries.spec.ts`.

### Giai đoạn 2: Tái cấu trúc Session Engine (Strategy Pattern) & Strict Cleanup — [x] ĐÃ HOÀN THÀNH (100% Tests Passed)
- [x] Task 2.1: Hoàn tất rà soát & dọn dẹp sạch sẽ mọi tàn dư của chế độ `mixed` cũ (nếu còn trong controller, DTO, schema, client).
- [x] Task 2.2: Định nghĩa interface `IInterviewModeStrategy` (`src/session/interview-mode-strategy.interface.ts`).
- [x] Task 2.3: Xây dựng 2 Strategy độc lập: `HrInterviewStrategy` (xử lý rubric hành vi STAR) và `TechnicalInterviewStrategy` (xử lý kiến thức & rubric kỹ thuật).
- [x] Task 2.4: Xây dựng `SessionStrategyRegistry` đăng ký `hr` và `technical`, tiêm vào `SessionService` (`CreateInterviewSession`, `ChangeInterviewSessionStatus`).
- [x] Task 2.5: Viết Unit Tests kiểm thử tính độc lập của từng Strategy và xác nhận 100% test suite passed (55/55 suites, 431/431 tests).

### Giai đoạn 3: Chuẩn hóa Answer Intake (Handler Pattern) — [x] ĐÃ HOÀN THÀNH (100% Tests Passed)
- [x] Task 3.1: Định nghĩa interface `IAnswerIntakeHandler` và `AnswerIntakeContext` (`src/turn/answer-intake-handler.interface.ts`).
- [x] Task 3.2: Xây dựng `TextAnswerIntakeHandler` (xử lý text input, validate độ dài, enqueue feedback job) và unit tests `text-answer-intake.handler.spec.ts`.
- [x] Task 3.3: Xây dựng `VoiceAnswerIntakeHandler` (xử lý audio URL, enqueue transcription job, tính voice metrics khi có transcript) và unit tests `voice-answer-intake.handler.spec.ts`.
- [x] Task 3.4: Xây dựng `AnswerIntakeRegistry` (`src/turn/answer-intake.registry.ts`), refactor `SubmitTurnAnswer` thành Thin Orchestrator, cập nhật `TurnModule` và `TurnService`.
- [x] Task 3.5: Viết Unit Tests kiểm thử độc lập từng Intake Handler, Registry và kiểm thử 100% toàn bộ hệ thống (58/58 test suites, 446/446 tests passed).

### Giai đoạn 4: Hoàn thiện Transactional Workflow Outbox & BullMQ — [ ] BƯỚC TIẾP THEO
- [ ] Task 4.1: Rà soát & hoàn thiện entity / interface `WorkflowOutboxService` đảm bảo ghi command trong cùng DB Transaction với state thay đổi.
- [ ] Task 4.2: Xây dựng / chuẩn hóa `WorkflowOutboxDispatcher` quét lệnh pending và đẩy vào BullMQ worker.
- [ ] Task 4.3: Xây dựng các Command Handler độc lập (`GenerateQuestionsCommandHandler`, `TranscribeAudioCommandHandler`, `EvaluateTurnAnswerCommandHandler`, `GenerateSessionReportCommandHandler`).
- [ ] Task 4.4: Kiểm thử kịch bản giả lập crash và idempotency để đảm bảo không bao giờ thất thoát job.
- [ ] Task 4.5: Chạy 100% test suites và xác nhận an toàn tuyệt đối.

---

## 8. NHẬT KÝ TIẾN ĐỘ, QUYẾT ĐỊNH KIẾN TRÚC & KẾ HOẠCH BƯỚC TIẾP THEO

### 8.1. Những gì đã hoàn thành (Phase 1, Phase 2 & Phase 3 Accomplishments)
1. **Giai đoạn 1 — Ports & Adapters cho AI Gateway & Media Storage**:
   - `src/ai/ai-gateway.interface.ts`: Hợp đồng chuẩn `IAIGateway` & token `AI_GATEWAY_TOKEN`.
   - `src/ai/openai.gateway.ts`: Adapter OpenAI implements `IAIGateway`.
   - Refactor toàn bộ pipeline sang DIP.
   - `src/interview/media-storage.interface.ts` & `src/interview/supabase-media-storage.adapter.ts`: Lưu trữ riêng tư & Signed URL.

2. **Giai đoạn 2 — Strategy Pattern cho Session Engine**:
   - `src/session/interview-mode-strategy.interface.ts`: Hợp đồng `IInterviewModeStrategy` định nghĩa các hook lifecycle: `validateSessionConfig`, `buildQuestionGenerationPayload`, `isSessionCompletable`, `buildReportGenerationPayload`.
   - `src/session/hr-interview.strategy.ts`: Chiến lược phỏng vấn nhân sự / STAR / hành vi.
   - `src/session/technical-interview.strategy.ts`: Chiến lược phỏng vấn kỹ thuật / system design.
   - `src/session/session-strategy.registry.ts`: Registry quản lý và phân giải Strategy linh hoạt, mở đường cắm thêm `LiveCodingStrategy` trong tương lai mà không sửa đổi `SessionService`.
   - Tích hợp vào `CreateInterviewSession` và `ChangeInterviewSessionStatus`.
   - Unit tests độc lập: `hr-interview.strategy.spec.ts`, `technical-interview.strategy.spec.ts`, `session-strategy.registry.spec.ts`, `session.service.spec.ts`.

3. **Giai đoạn 3 — Handler Pattern cho Answer Intake**:
   - `src/turn/answer-intake-handler.interface.ts`: Hợp đồng `IAnswerIntakeHandler` & `AnswerIntakeContext`.
   - `src/turn/text-answer-intake.handler.ts`: Chuyên xử lý câu trả lời dạng văn bản, validate và enqueue `FEEDBACK_QUEUE`.
   - `src/turn/voice-answer-intake.handler.ts`: Chuyên xử lý ghi âm giọng nói, phân luồng audio pending transcription vs voice kèm transcript (tính `VoiceMetrics` WPM/filler words).
   - `src/turn/answer-intake.registry.ts`: Registry quản lý tập trung các Handlers, sẵn sàng cho `CodeAnswerIntakeHandler` tương lai.
   - `src/turn/submit-turn-answer.service.ts`: Refactor thành Thin Orchestrator phân chia thẩm quyền và ủy thác cho Handler.
   - Unit tests độc lập: `text-answer-intake.handler.spec.ts`, `voice-answer-intake.handler.spec.ts`, `answer-intake.registry.spec.ts`, `turn.service.spec.ts`.

4. **Kết quả kiểm thử & đo lường chất lượng**:
   - Toàn bộ **58/58 test suites** và **446/446 tests** đều PASS 100%.
   - Ranh giới kiến trúc `src/architecture/feature-boundaries.spec.ts`: **0 vi phạm**, 100% tuân thủ.

---

### 8.2. Kế hoạch bước tiếp theo (Next Phase Plan: Phase 4)
Triển khai **Giai đoạn 4: Hoàn thiện Transactional Workflow Outbox & BullMQ** với các task nhỏ:
1. **Task 4.1**: Rà soát `WorkflowOutboxService` & tích hợp Transactional Outbox.
2. **Task 4.2**: Chuẩn hóa Dispatcher Poller & BullMQ producer.
3. **Task 4.3**: Command Handlers phân tách SRP.
4. **Task 4.4**: Kiểm thử idempotency & retry policies.
5. **Task 4.5**: Chạy toàn bộ test suites và kiểm tra ranh giới kiến trúc.



