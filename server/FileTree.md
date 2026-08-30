# File Tree: server

## Tổng quan kiến trúc

Server là ứng dụng NestJS (REST API + SSE) với kiến trúc modular. Yêu cầu chính chạy qua pipeline: Auth -> Session -> Turn (submit answer) -> AI Processor (feedback/report) -> Client (SSE event).

**Request flow:**
1. User authenticate qua `auth` module (cookie-based JWT)
2. Lưu job description qua `saved-job-description` module
3. Tạo interview session qua `session` module, enqueue job `question-generation`
4. `QuestionGenerationProcessor` sinh câu hỏi hybrid (1/5 AI + 4/5 question bank), lưu DB
5. Client nhận câu hỏi qua SSE/polling
6. User submit answer (text/voice) qua `turn` module
7. `FeedbackProcessor` đánh giá answer qua pipeline (HR/Technical/Mixed), lưu score + annotated segments
8. Khi tất cả feedback xong, `ReportService` enqueue job `comprehensive-report`
9. `ComprehensiveReportProcessor` tạo executive summary, competency heatmap, action plan
10. Client nhận report qua `report` module

---

```
├── 📁 prisma
│   ├── 📁 migrations
│   │   └── 📄 migration.sql                     # File migration SQL hợp nhất: schema hardening, RLS, indexes, constraints
│   ├── 📁 seed
│   │   ├── 📁 data
│   │   │   └── ⚙️ kaggle-questions.json         # Dataset câu hỏi interview từ Kaggle (frontend)
│   │   ├── 📄 00-context-packs.ts               # Seed context pack VN/Western + rubric dimensions
│   │   ├── 📄 01-users.ts                       # Seed demo users (admin, candidates)
│   │   ├── 📄 02-question-bank.ts               # Seed question bank (90 legacy + 30 frontend)
│   │   ├── 📄 02b-kaggle-questions.ts           # Import câu hỏi từ Kaggle dataset
│   │   ├── 📄 05-saved-job-descriptions.ts      # Seed sample job descriptions
│   │   ├── 📄 _client.ts                        # Prisma client singleton cho seed scripts
│   │   └── 📄 index.ts                          # Entry point: chạy tất cả seed theo thứ tự
│   ├── 📄 deduplicate-user-answers.sql          # Script loại bỏ duplicate user answers
│   ├── 📄 find-role-policies.mjs                # Kiểm tra RLS policies liên quan role
│   ├── 📄 inspect-db.mjs                        # Inspect schema + table sizes
│   ├── 📄 inspect-rls.mjs                       # Kiểm tra Row Level Security policies
│   ├── 📄 migrate-local-auth.ts                 # Migration script cho auth local
│   ├── 📄 prepare-db-push-raw-sql.ts            # Push raw SQL lên database
│   ├── 📄 prepare-user-answer-unique.ts         # Thêm unique constraint cho user answers
│   ├── 📄 run-role-migration.mjs                # Chạy role migration
│   ├── 📄 schema.prisma                         # Prisma schema: tất cả models, relations, indexes
│   ├── 📄 seed-demo-users.ts                    # Seed demo users standalone
│   ├── 📄 seed.ts                               # Legacy seed entry point
│   └── 📄 verify-db-hardening.ts                # Verify database security config
├── 📁 scripts
│   ├── 📄 deny-production-db-sync.mjs           # Guard: chặn sync database từ dev lên production
│   ├── 📄 recovery-inventory.mjs                # Liệt kê backup files + recovery info
│   ├── 📄 require-db-backup-confirmation.mjs    # Yêu cầu confirm trước khi backup/restore
│   ├── 📄 test-local-llm.mjs                    # Test kết nối LLM local (Ollama, etc.)
│   └── 📄 verify-runtime.js                     # Verify runtime dependencies (node, npm, etc.)
├── 📁 src
│   │
│   │── 📄 app.module.ts                         # Root module: import tất cả feature modules, BullModule (Redis queues), global guard + filter + middleware
│   │── 📄 main.ts                               # Entry point: bootstrap NestJS, global prefix /api/v1, CORS, cookieParser, Swagger (/api/docs)
│   │
│   ├── 📁 admin                                 # --- ADMIN MODULE: Quản lý users (chỉ admin) ---
│   │   ├── 📁 dto
│   │   │   └── 📄 update-user.dto.ts            # DTO: update role (UserRole) và status (AccountStatus)
│   │   ├── 📄 admin.controller.ts               # Prefix: /admin. GET/PATCH/DELETE users. JwtAuthGuard + RolesGuard (chỉ admin)
│   │   ├── 📄 admin.module.ts                   # Import PrismaModule, AuthModule
│   │   └── 📄 admin.service.ts                  # Logic: list users, update role/status, soft-delete. Guard: không tự sửa mình, không xóa admin cuối cùng
│   │
│   ├── 📁 ai                                    # --- AI MODULE: Engine AI cốt lõi - prompt, pipeline, giao tiếp với LLM ---
│   │   ├── 📁 pipelines
│   │   │   ├── 📄 base-pipeline.service.ts      # Abstract base: điều phối build prompt -> gọi OpenAI -> validate Zod -> chuẩn hóa response
│   │   │   │                                      # generateQuestions(): build prompt -> gọi LLM -> validate -> trả về câu hỏi
│   │   │   │                                      # evaluateAnswer(): build eval prompt -> gọi LLM -> validate -> tính score có trọng số -> sanitize segments
│   │   │   ├── 📄 hr.pipeline.service.ts        # Chiến lược HR: tập trung behavioral, ví dụ STAR, giao tiếp, culture fit
│   │   │   ├── 📄 technical.pipeline.service.ts # Chiến lược Technical: chiều sâu, giải quyết vấn đề, trade-offs, debugging, system design
│   │   │   ├── 📄 mixed.pipeline.service.ts     # Chiến lược Mixed: cân bằng behavioral + technical
│   │   │   ├── 📄 pipeline-strategy.factory.ts  # Factory: map SessionType -> pipeline service (HR/Technical/Mixed)
│   │   │   ├── 📄 interview-pipeline.interface.ts # Interface: SessionType, QuestionGenInput, FeedbackInput, GeneratedQuestion, SurgicalFeedback
│   │   │   ├── 📄 pipeline.schemas.ts           # Zod schemas: QuestionsSchema, FeedbackSchema. PROMPT_VERSION = 'surgical-feedback-v1.5'
│   │   │   └── 📄 dimension-matcher.ts          # Resolve applied_dimensions từ AI response -> allowed rubric dimensions (4 nhánh matching)
│   │   ├── 📁 processors
│   │   │   ├── 📄 question-generation.processor.ts  # BullMQ worker: sinh câu hỏi hybrid (1/5 AI + 4/5 question bank). Persist vào session_questions + criteria. Fallback sang question bank khi AI lỗi
│   │   │   ├── 📄 feedback.processor.ts         # BullMQ worker: đánh giá answer -> persist aiFeedback + annotatedSegments. Emit SSE events. Kiểm tra report sẵn sàng
│   │   │   ├── 📄 comprehensive-report.processor.ts # BullMQ worker: tổng hợp feedbacks -> executive summary, competency heatmap, action plan. 5 loại report. Đánh dấu session hoàn thành
│   │   │   └── 📄 transcription.processor.ts    # BullMQ worker: tải audio -> Whisper transcription -> tính voice metrics -> persist transcript -> enqueue feedback
│   │   ├── 📁 prompts
│   │   │   ├── 📄 question-gen-v1.0.ts          # Config: temperature=0.4, maxTokens=2400
│   │   │   ├── 📄 surgical-feedback-v1.5.ts    # Config: temperature=0.2, maxTokens=3000
│   │   │   └── 📄 comprehensive-report-v1.0.ts  # Config: temperature=0.2, maxTokens=1500
│   │   ├── 📄 prompt-builder.service.ts         # Xây dựng prompt cốt lõi: BASE_PROMPTS (3 tasks), applyContextPack (rubric dims + cultural notes),
│   │   │                                        #   applyContextPackForEvaluation (scoring rules theo session type), injectDynamicContext (user message gắn thẻ XML)
│   │   │                                        # Prompt flow: BASE_PROMPT -> +strategy -> +contextPack -> +language -> injectDynamicContext -> messages[]
│   │   ├── 📄 openai.gateway.ts                 # OpenAI API client: model/timeout theo task, retry logic (quota cooldown 60s, rate limit 1-2s),
│   │   │                                        #   sửa JSON (trailing commas, markdown fences, embedded objects), retry khi response bị truncate, Whisper transcription
│   │   ├── 📄 context-pack.service.ts           # Lấy rubric config (dimensions, weights, cultural notes) cho VN/Western. DB-first -> fallback sang CONTEXT_PACK_DATA static
│   │   ├── 📄 zod-validator.service.ts          # Wrapper Zod validation -> ném InterviewAIException khi lỗi
│   │   ├── 📄 question-metadata.ts              # Chuẩn hóa metadata câu hỏi AI sinh: domain resolver (exact ID -> normalized -> regex -> keyword), difficulty sanitizer, estimated time
│   │   ├── 📄 feedback-segment-sanitizer.ts     # Validate/sửa annotated segments: tìm startIndex/endIndex đúng trong candidate answer. Xử lý range rỗng, không hợp lệ, không khớp
│   │   ├── 📄 ai-error.utils.ts                 # Phân loại lỗi: isAIQuotaExceeded, isAIFallbackEligible, describeAIError
│   │   ├── 📄 fallback-content.ts               # Bilingual fallback content khi AI unavailable: feedback messages, action plans (STAR), report summaries
│   │   ├── 📄 output-language.ts                # Resolve output language (vi/en) + sinh language instruction cho AI prompt
│   │   ├── 📄 ai.module.ts                      # AI module: đăng ký 4 BullMQ queues, providers (OpenAI, PromptBuilder, ContextPack, Pipelines, Processors)
│   │   └── 📄 rubric.controller.ts              # GET /rubrics/:contextPackId - trả về rubric dimensions + weights đang active (JWT-guarded)
│   │
│   ├── 📁 auth                                  # --- AUTH MODULE: Authentication + Authorization ---
│   │   ├── 📁 decorators
│   │   │   └── 📄 roles.decorator.ts            # @Roles(...) decorator: SetMetadata cho role-based access
│   │   ├── 📁 dto
│   │   │   ├── 📄 authenticated-user.dto.ts     # DTO: { id, email, role } - JwtAuthGuard gắn vào request
│   │   │   ├── 📄 local-auth.dto.ts             # DTOs: RegisterDto, LoginDto, ChangePasswordDto, PasswordResetRequestDto, PasswordResetConfirmDto
│   │   │   └── 📄 refresh-response.dto.ts       # DTO: { accessToken, refreshToken, expiresIn } (không dùng trong cookie flow)
│   │   ├── 📁 guards
│   │   │   ├── 📄 jwt-auth.guard.ts             # Đọc JWT từ httpOnly cookie -> verify -> lấy user -> gắn { id, email, role } vào request.user
│   │   │   ├── 📄 roles.guard.ts                # Đọc metadata @Roles() -> kiểm tra request.user.role trong allowed roles
│   │   │   ├── 📄 refresh.guard.ts              # Placeholder guard cho refresh token flow (MVP)
│   │   │   └── 📄 sse-token.guard.ts            # Thin wrapper JwtAuthGuard cho SSE endpoints
│   │   ├── 📄 auth.controller.ts                # Prefix: /auth. POST register/login/logout, GET /me, POST change-password, POST password-reset/request + /confirm
│   │   ├── 📄 auth.module.ts                    # Global module: JwtModule, AuthService, tất cả guards. Export guards + AuthService
│   │   ├── 📄 auth.service.ts                   # Core: register (scrypt hash, 12-128 chars), login, getAuthenticatedUser (kiểm tra JWT + tokenVersion),
│   │   │                                        #   changePassword (rotate cookie), requestPasswordReset (OTP qua email), resetPassword (verify OTP)
│   │   └── 📄 password.ts                       # Password hashing: scrypt + random 16-byte salt. Format: scrypt$<salt>$<derived>. timingSafeEqual để so sánh
│   │
│   ├── 📁 common                                # --- COMMON MODULE: Shared infrastructure ---
│   │   ├── 📁 constants
│   │   │   └── 📄 queue.constants.ts            # Tên queue + retry config: question-generation (2), feedback (2), comprehensive-report (3, delay 3s), transcription (2)
│   │   ├── 📁 exceptions
│   │   │   ├── 📄 error-code.enum.ts            # ~25 error codes: Auth, Session, Answer, Report, AI (quota, rate limit, timeout, invalid JSON, schema), General
│   │   │   ├── 📄 interview-ai.exception.ts     # Custom HttpException: { success: false, errorCode, message }
│   │   │   └── 📄 interview-ai-exception.filter.ts # Global exception filter: chuẩn hóa mọi lỗi -> { success, errorCode, message, path, timestamp }
│   │   ├── 📁 guards
│   │   │   └── 📄 maintenance-mode.guard.ts     # Global guard: chặn POST/PUT/PATCH/DELETE khi MAINTENANCE_MODE=true. Cho phép GET/HEAD/OPTIONS
│   │   ├── 📁 middleware
│   │   │   └── 📄 request-id.middleware.ts      # Gắn X-Request-ID (UUID) vào mọi request/response
│   │   ├── 📁 services
│   │   │   └── 📄 sse.service.ts                # SSE dùng Redis: emit(channel, event, data) qua Redis pub/sub. Reference-counted subscriptions, auto-unsub
│   │   ├── 📁 swagger
│   │   │   ├── 📄 swagger.ts                    # Cài đặt Swagger UI tại /api/docs (cookie-based auth)
│   │   │   ├── 📄 api-error-response.dto.ts     # Swagger DTO: { success: false, errorCode, message, path, timestamp }
│   │   │   └── 📄 api-error-responses.decorator.ts # @ApiCommonErrors(...statuses) sinh các @ApiResponse cho common errors
│   │   └── 📄 common.module.ts                  # Global module: export SseService
│   │
│   ├── 📁 config                                # --- CONFIG MODULE: Env validation ---
│   │   ├── 📄 env.validation.ts                 # Zod schema validate tất cả env vars: Supabase, JWT, SMTP, DB pool/timeout, OpenAI (key, models, timeouts), Redis, session limits, admin credentials
│   │   └── 📄 env.validation.spec.ts
│   │
│   ├── 📁 health                                # --- HEALTH MODULE: Health check ---
│   │   ├── 📄 health.controller.ts              # GET /health: ping DB (SELECT 1) + Redis (PING). Trả về { status: ok|degraded, services: { db, redis } } kèm latency
│   │   └── 📄 health.module.ts
│   │
│   ├── 📁 prisma                                # --- PRISMA MODULE: Database layer + reference data ---
│   │   ├── 📄 prisma.service.ts                 # extends PrismaClient (PrismaPg adapter). Connection pool config, connectWithRetry (3 lần), graceful degradation
│   │   ├── 📄 prisma.module.ts                  # Global module: export PrismaService, ReferenceDataService
│   │   ├── 📄 context-pack.data.ts              # Static data: 2 context packs (VN + Western) với rubric dimensions (D1-D6 behavioral, TD1-TD5 technical), weights, cultural notes
│   │   ├── 📄 reference-data.service.ts         # Bootstrap: chuẩn hóa legacy context pack IDs, tạo/update default RubricVersion + Category + Criterion cho VN/Western
│   │   ├── 📄 rubric-versioning.ts              # Helpers: buildRubricCategoriesFromPack, buildRubricSnapshot (JSON), buildScoringWeights
│   │   ├── 📄 db-timezone.ts                    # DB timezone utils: default Asia/Ho_Chi_Minh, validate chuỗi timezone, build Postgres connection config
│   │   └── 📄 prisma-connection-error.ts        # Phân loại lỗi Prisma: transient (P1001, P1002, P1008, P1017, ECONNRESET, timeout) vs permanent
│   │
│   ├── 📁 question-bank                         # --- QUESTION BANK MODULE: Nguồn câu hỏi fallback ---
│   │   ├── 📄 question-bank.service.ts          # selectFallbackQuestions: 30/50/20 easy/medium/hard. Mixed sessions: 50/50 HR/technical. Text localized qua translations[language]
│   │   ├── 📄 question-bank.module.ts           # Import QuestionCriteriaModule. Provide/export QuestionBankService
│   │   └── 📝 CLAUDE.md                         # Docs: 120 câu hỏi được seed (90 legacy + 30 frontend), contract của selectFallbackQuestions
│   │
│   ├── 📁 question-criteria                     # --- QUESTION CRITERIA MODULE: Giải quyết rubric criterion ---
│   │   ├── 📄 question-criteria.service.ts      # codesFromQuestionBank: trích xuất criterion codes từ question bank. codesFromSessionQuestion: trích xuất từ session question.
│   │   │                                        #   buildSessionQuestionCriteriaData: tra cứu rubric criterion IDs theo code, trả về data sẵn sàng để persist
│   │   └── 📄 question-criteria.module.ts       # Provide/export QuestionCriteriaService
│   │
│   ├── 📁 report                                # --- REPORT MODULE: Lấy report + enqueue job ---
│   │   ├── 📁 dto
│   │   │   ├── 📄 report-response.dto.ts        # DTOs: ReportResponseDto, TranscriptItemDto, AnnotatedSegmentDto
│   │   │   └── 📄 feedback-progress.dto.ts      # DTO: { totalQuestions, answered, skipped, feedbackRequired, feedbackCompleted, feedbackPending, reportReady }
│   │   ├── 📄 report.controller.ts              # GET /sessions/:sessionId/report: trả về ReportResponseDto đầy đủ (JWT-guarded)
│   │   ├── 📄 report.module.ts                  # Import AuthModule, đăng ký comprehensive-report queue
│   │   └── 📄 report.service.ts                 # getReport: assemble từ session_report + feedbacks theo câu. reportQuality: full|partial|unavailable|not_scorable
│   │                                            #   getFeedbackProgress: đếm. enqueueReport: enqueue job (dedup theo job ID). enqueueIfAllFeedbacksReady: auto-enqueue
│   │
│   ├── 📁 saved-job-description                 # --- SAVED JOB DESCRIPTION MODULE: CRUD job descriptions ---
│   │   ├── 📁 dto
│   │   │   └── 📄 save-job-description.dto.ts   # DTO: companyName, jobTitle, level, requirements (min 30), jobContent (min 30), techStack[], benefits, salary
│   │   ├── 📄 saved-job-description.controller.ts # Prefix: /saved-job-descriptions. GET list, POST save (upsert theo userId+companyName+jobTitle)
│   │   ├── 📄 saved-job-description.module.ts   # Provide/export SavedJobDescriptionService
│   │   └── 📄 saved-job-description.service.ts  # findAll: không deleted, sắp theo lastUsedAt. save: upsert (khớp userId+companyName+jobTitle), trim mọi string
│   │
│   ├── 📁 session                               # --- SESSION MODULE: Vòng đời interview session ---
│   │   ├── 📁 dto
│   │   │   ├── 📄 create-session.dto.ts         # DTO: jobDescription (min 100), sessionType (hr/technical/mixed), contextPack, language, numQuestions (3-45, default 10), targetRoles[]
│   │   │   ├── 📄 update-session-status.dto.ts  # DTO: status (active/paused/canceled/completed), remainingSeconds, autoSkipUnanswered
│   │   │   └── 📄 session-response.dto.ts       # DTO: session fields (id, status, sessionType, contextPackId, numQuestions, etc.)
│   │   ├── 📄 session.controller.ts             # Prefix: /sessions. POST create, GET list/get/status/questions/feedback-progress, PATCH status, GET SSE events
│   │   ├── 📄 session.module.ts                 # Import ReportModule, AuthModule, đăng ký question-generation queue
│   │   └── 📄 session.service.ts                # create: enforce giới hạn 24h (default 10), đảm bảo rubric version, tạo session + enqueue question gen
│   │                                            #   findQuestions: trả về câu hỏi kèm answer status, auto chuyển generating->active
│   │                                            #   updateStatus: state machine (generating->active->paused->active->completing->completed). Auto-skip câu chưa trả lời, enqueue report
│   │
│   ├── 📁 turn                                  # --- TURN MODULE: Gửi answer + xử lý audio ---
│   │   ├── 📁 dto
│   │   │   ├── 📄 submit-answer.dto.ts          # DTO: questionId, answerMode (text/voice), answerText (min 10), skipQuestion, audioFileUrl, audioDurationSeconds
│   │   │   └── 📄 turn-response.dto.ts          # Response: { answerId, feedbackQueued, transcriptionPending }
│   │   ├── 📄 turn.controller.ts                # POST /sessions/:sessionId/turns/audio (upload), POST /sessions/:sessionId/turns (submit answer)
│   │   ├── 📄 turn.service.ts                   # submitAnswer: 3 nhánh (skip, voice-no-transcript, text/edited-voice). Dedup theo questionId. Xử lý retry cho transcription đang chờ
│   │   ├── 📄 audio-storage.service.ts          # Upload audio lên Supabase Storage (interview-audio bucket), validate MIME (webm/mp4/wav) + size (max 10MB), transcribe qua Whisper
│   │   ├── 📄 whisper.service.ts                # Tải audio từ HTTPS URL (validate allowed hosts, không IP, không redirects), kiểm tra content-type + size, gọi OpenAIGateway.transcribe()
│   │   ├── 📄 voice-metrics.service.ts          # Tính WPM + số filler words (uh, um, like, you know, so, actually, basically, literally, right, okay)
│   │   └── 📄 turn.module.ts                    # Import AuthModule, AiModule, QuestionCriteriaModule, đăng ký feedback + transcription queues
│   │
│   ├── 📁 user                                  # --- USER MODULE: Quản lý profile ---
│   │   ├── 📁 dto
│   │   │   └── 📄 update-profile.dto.ts         # DTO: firstname, lastname, personality, education, workExperience[], projects[], technicalSkills[], certifications[], awards[]
│   │   ├── 📄 user.controller.ts                # GET /profile (get), PATCH /profile (create/update)
│   │   ├── 📄 user.module.ts                    # Provide UserController, UserService
│   │   └── 📄 user.service.ts                   # getProfile: trả về user + profile. upsertProfile: transaction - validate candidate phải có tên, update user fields + upsert userProfile (JSON fields)
│   │
│   ├── 📁 types
│   │   └── 📄 express.d.ts                      # TypeScript ambient: extend Express.User với { id, email, refreshToken } (dùng bởi auth guards)
│   │
│   └── 📁 test-utils
│       └── 📄 mock-factories.ts                 # Mock factories cho unit tests (Prisma, services, etc.)
├── 📁 test
│   ├── ⚙️ jest-e2e.json                         # Jest config cho e2e tests
│   └── 📄 session-completion-flow.e2e-spec.ts   # E2E test: luồng hoàn tất session đầy đủ (create -> questions -> answers -> feedback -> report)
├── ⚙️ .dockerignore
├── ⚙️ .env.example                             # Example env vars (copy sang .env)
├── ⚙️ .gitignore
├── ⚙️ .prettierrc
├── 📝 CLAUDE.md                                 # Project instructions cho Claude Code
├── 🐳 Dockerfile                               # Docker build config
├── 📝 README.md
├── ⚙️ docker-compose.yml                        # Local dev: NestJS app + PostgreSQL + Redis
├── 📄 eslint.config.mjs                         # ESLint config
├── ⚙️ nest-cli.json                             # NestJS CLI config
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── 📄 prisma.config.ts                          # Prisma config (datasource, migrations path)
└── ⚙️ tsconfig.json
```

---

## Module Dependencies

```
app.module
├── ConfigModule (global, env validation)
├── BullModule (Redis queues)
├── CommonModule (global: SSE, exception filter, middleware, guard)
├── HealthModule
├── PrismaModule (global: DB service, reference data)
├── AuthModule (global: JWT, guards, password)
│   └── exports: JwtAuthGuard, RolesGuard, SseTokenGuard, AuthService
├── AiModule
│   ├── imports: ReportModule, QuestionBankModule, QuestionCriteriaModule
│   ├── providers: OpenAIGateway, PromptBuilderService, ContextPackService,
│   │              ZodValidatorService, HrPipelineService, TechnicalPipelineService,
│   │              MixedPipelineService, PipelineStrategyFactory,
│   │              QuestionGenerationProcessor, FeedbackProcessor,
│   │              ComprehensiveReportProcessor, TranscriptionProcessor
│   └── exports: PipelineStrategyFactory, ContextPackService, OpenAIGateway
├── SessionModule
│   ├── imports: ReportModule, AuthModule
│   ├── registers: question-generation queue
│   └── exports: SessionService
├── TurnModule
│   ├── imports: AuthModule, AiModule, QuestionCriteriaModule
│   ├── registers: feedback + transcription queues
│   └── providers: TurnService, AudioStorageService, WhisperService, VoiceMetricsService
├── ReportModule
│   ├── imports: AuthModule
│   ├── registers: comprehensive-report queue
│   └── exports: ReportService
├── UserModule
├── SavedJobDescriptionModule
├── AdminModule
│   ├── imports: PrismaModule, AuthModule
│   └── providers: AdminService
├── QuestionBankModule
│   ├── imports: QuestionCriteriaModule
│   └── exports: QuestionBankService
└── QuestionCriteriaModule
    └── exports: QuestionCriteriaService
```

## BullMQ Queues

| Queue Name | Retry | Worker | Purpose |
|---|---|---|---|
| `question-generation` | 2 | QuestionGenerationProcessor | Sinh câu hỏi hybrid (AI + question bank) |
| `feedback` | 2 | FeedbackProcessor | Đánh giá answer, persist scores + segments |
| `comprehensive-report` | 3 (3s delay) | ComprehensiveReportProcessor | Tổng hợp report cuối session |
| `transcription` | 2 | TranscriptionProcessor | Whisper transcription -> enqueue feedback |

## SSE Event Channels

| Channel | Event | Trigger |
|---|---|---|
| `session.{id}` | `session.status` | Question generation complete/error |
| `session.{id}` | `turn.feedback_ready` | Feedback generated for a turn |
| `session.{id}` | `turn.transcription_ready` | Audio transcription complete |
| `session.{id}` | `session.feedback_progress` | After each feedback (progress update) |
| `session.{id}` | `report.ready` | Comprehensive report generated |
