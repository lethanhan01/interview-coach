# Backend NestJS refactor roadmap

**Ngày đánh giá:** 2026-08-10  
**Phạm vi:** `server/`  
**Mục tiêu:** làm rõ ownership và dependency của modular monolith hiện tại, không rewrite, không đổi hành vi sản phẩm trong refactor kiến trúc.

> **Cách triển khai:** dùng [index kế hoạch](./README.md) và file từng Phase làm checklist thực thi chính thức. Phần roadmap bên dưới là bối cảnh, quyết định kiến trúc và rationale chung; tiến độ chỉ cập nhật tại [refactor progress](./refactor-progress.md).

## Quyết định kiến trúc

Giữ NestJS modular monolith, Prisma, BullMQ, Redis Pub/Sub/SSE và các fallback AI hiện có. Không tách microservice, không áp CQRS toàn hệ thống, không tạo repository abstraction cho từng Prisma model, và không áp bốn layer Clean Architecture cho mọi CRUD.

Chỉ dùng port/adapter tại các boundary thay thế được hoặc cần cô lập rõ ràng:

```text
Application / feature logic
  -> StructuredLlmClient              (OpenAI adapter)
  -> SpeechToText                     (OpenAI adapter)
  -> AudioObjectStorage               (Supabase adapter)
  -> RealtimePublisher                (Redis Pub/Sub adapter)
  -> Queue                            (BullMQ adapter, nếu cần đổi transport)
```

Các use case cùng dùng LLM không cần mỗi use case một `QuestionGeneratorPort`, `AnswerEvaluatorPort`, `ReportGeneratorPort` nếu cả ba chỉ là wrapper một-một quanh cùng provider. Feature service vẫn sở hữu prompt, validation, fallback và ý nghĩa nghiệp vụ; adapter chỉ sở hữu protocol/provider, timeout/retry và chuẩn hóa response.

## Kết quả đối chiếu báo cáo với code

Kết luận: **báo cáo đúng về hướng đi và hầu hết các vấn đề ưu tiên cao**, nhưng cần chỉnh một số mô tả và thứ tự triển khai bên dưới để tránh refactor quá mức hoặc làm hỏng contract.

| Nhận định | Kết quả đối chiếu | Điều chỉnh đưa vào roadmap |
| --- | --- | --- |
| `AiModule` là God Module | Đúng. `ai.module.ts` vừa đăng ký bốn queue/processor, vừa chứa gateway, prompt, pipeline, rubric HTTP controller, feedback utility; processors còn import trực tiếp Question/Turn/Report. | Tách ownership theo feature từng worker; AI chỉ còn capability infrastructure. Không di chuyển thư mục hàng loạt trước khi tách responsibility. |
| Bốn async queue là nền tảng tốt | Đúng: `question-generation`, `feedback`, `comprehensive-report`, `transcription`. | Giữ queue name, job name, payload, job ID, attempts/backoff xuyên suốt các phase; worker mới chỉ là consumer khác cùng contract. |
| Session lifecycle đã là state machine hoàn chỉnh | Đúng một phần. Code dùng string status, không có domain state machine riêng. Luồng thực tế thường là `generating -> active -> paused -> active -> completing -> completed`; `error` và `canceled` là nhánh terminal, `ready` là trạng thái tương thích được chấp nhận nhưng không thấy worker hiện tại tạo ra. | Trước khi tách service, khóa transition bằng bảng test. Chỉ trích `SessionLifecyclePolicy` thuần trước; chưa đổi schema/status enum trong roadmap này. |
| `BasePipelineService` trộn question và feedback | Đúng. Nó build prompt, gọi OpenAI, parse/Zod validate, map rubric dimension, tính score và sanitize segment cho hai use case. | Tách theo use case trong Question và Assessment; không thay bằng hierarchy/adapter một-một cho mọi tác vụ. Report generation vốn đã nằm chủ yếu ở `ComprehensiveReportProcessor`, không ở base pipeline. |
| `OpenAIGateway` quá rộng | Đúng. Gateway hiện tạo chat/audio client, chọn model/timeout, retry/quota/rate limit, sửa JSON/truncation và Whisper. | Trích chat client và transcription client trước, giữ `OpenAIGateway` compatibility facade; chỉ tách retry/parser thành class độc lập khi dùng từ hơn một client hoặc test cho thấy cần. |
| Audio storage và Whisper bị coupling | Đúng, và mạnh hơn báo cáo mô tả: `AudioStorageService.uploadInterviewAudio()` upload rồi gọi `WhisperService.transcribe()`. | Storage adapter chỉ upload/get URL. Một orchestration use case giữ response hiện tại có transcript. Giữ validation MIME/size ở upload **và** validation URL/download ở STT, vì lớp sau là biện pháp chống SSRF cho job/URL không tin cậy. |
| Rubric/reference data không thuộc Prisma | Đúng. `PrismaModule` global export cả `ReferenceDataService`; service này bootstrap có upsert rubric và normalize dữ liệu legacy. | Chuyển ownership về Assessment/Rubric. Chuyển side effect bootstrap thành seed/migration/versioned catalog command có chủ đích, nhưng giữ đường migration idempotent trong lúc chuyển đổi. |
| `QuestionBankModule` và `QuestionCriteriaModule` nên gộp | Hợp lý. `QuestionBankModule` đã import `QuestionCriteriaModule`; processor question generation dùng cả hai. | Tạo một `QuestionModule` facade, giữ các service nhỏ bên trong; không tạo `QuestionService` chung khổng lồ. |
| Report thuộc Assessment | Chỉ đúng một phần. Report đọc kết quả assessment nhưng còn có read API, queue orchestration và presentation contract riêng. | Giữ `ReportModule`/`Reporting` là context riêng trong các phase đầu; nó phụ thuộc vào dữ liệu assessment. Chỉ gộp vào Assessment nếu code sau khi tách chứng minh có cùng lifecycle/owner. |
| Auth + User + Admin cần gộp ngay | Có thể hợp lý về naming nhưng chưa phải đau điểm chính; `AuthModule` đang global và ba bề mặt API/permission khác nhau. | Hoãn merge vật lý. Chuẩn hóa ownership Identity sau pipeline interview; không ép một `IdentityModule` nếu chỉ đổi folder/module name. |
| SSE trong `common` là infrastructure | Đúng. `SseService` dùng trực tiếp ioredis Pub/Sub. | Đặt implementation dưới infrastructure ở cuối một phase nhỏ, expose publisher/stream contract; không đổi event name/channel. |
| Safety net đã có E2E full flow | Chưa đủ chính xác. Có 43 unit spec và `test/session-completion-flow.e2e-spec.ts`, nhưng file này mock Prisma, queues và service, rồi gọi class trực tiếp; nó là integration flow test chứ chưa phải HTTP + Redis + database E2E. | Bổ sung contract/integration test thật trước các refactor có risk, giữ test flow hiện tại như fast regression test. |

### Bằng chứng chính đã kiểm tra

- `server/src/ai/ai.module.ts`: bốn worker, AI pipeline, OpenAI, rubric controller, dependencies Report/Question/Turn.
- `server/src/session/session.service.ts`: create + limit + rubric resolution + queue + read model + transition + completion + report enqueue.
- `server/src/turn/turn.service.ts`: upload, text/voice/skip/dedup/retry transcription và enqueue feedback.
- `server/src/report/report.service.ts`: read projection, progress, queue dedup và readiness coordination.
- `server/src/prisma/reference-data.service.ts`: `OnApplicationBootstrap` thực hiện normalize/upsert rubric.
- `server/src/turn/audio-storage.service.ts` và `whisper.service.ts`: storage gọi transcription trực tiếp; validation download/host là security boundary.
- `server/src/ai/processors/*`: worker hiện chứa persistence, fallback, event emission và orchestration đáng kể, không chỉ parse job rồi gọi use case.

## Kiến trúc đích, áp dụng có chọn lọc

```text
src/
  infrastructure/
    ai/openai/                 # SDK client, retry/timeout, JSON extraction
    storage/supabase/          # AudioObjectStorage adapter
    speech/openai/             # SpeechToText adapter
    realtime/redis/            # Redis Pub/Sub implementation
    queue/bullmq/              # queue registration/adapter nếu cần
    database/prisma/           # Prisma client, connection, DB error helpers

  identity/                    # giữ module hiện có đến phase cuối
  saved-job-description/
  interview/                   # session lifecycle, answer/voice orchestration
  question/                    # bank, criteria, generation, question worker
  assessment/                  # rubric catalog/snapshot, feedback/evaluation
  reporting/                   # report query + report-generation workflow
```

Đây là **đích ownership**, không phải yêu cầu phải tạo toàn bộ cây thư mục ngay. Với feature nhỏ, controller + service + DTO vẫn ở cùng feature. Với feature phức tạp, dùng các lớp `application/`, `domain/`, `infrastructure/` chỉ khi chúng có trách nhiệm thực sự khác nhau.

### Dependency rules

1. Feature không import SDK OpenAI, Supabase, ioredis hoặc BullMQ trực tiếp trừ adapter/worker boundary được chỉ định.
2. Feature không import service implementation của feature khác để lấy chi tiết provider. Trong-process call trực tiếp vẫn được phép khi cùng workflow và không tạo vòng phụ thuộc.
3. Worker là presentation/transport adapter: deserialize job, gọi application service, map retry/failure/event. Logic nghiệp vụ mới không được thêm vào worker.
4. Prisma vẫn có thể được inject trực tiếp trong application service hiện tại. Chỉ tạo query/repository abstraction khi nhiều implementation, transaction boundary phức tạp, hoặc query bị chia sẻ thực tế.
5. Domain event chỉ dùng cho side effect qua context (ví dụ feedback hoàn tất kích report); không thay mọi method call bằng event bus.

## Contract bất biến trong toàn roadmap

Không đổi các mục dưới đây trong một PR refactor kiến trúc. Nếu bắt buộc đổi, lập ADR/migration plan riêng và chạy hai contract song song.

| Contract | Hiện trạng cần giữ |
| --- | --- |
| REST | `/sessions`, `/sessions/:id`, `/sessions/:id/questions`, `/sessions/:id/status`, `/sessions/:id/turns`, `/sessions/:id/turns/audio`, `/sessions/:id/report`, rubric endpoint và auth endpoints giữ path/method/status/DTO. |
| Queue | Queue/job names: `question-generation`, `feedback`, `comprehensive-report`, `transcription`; payload fields, deterministic job IDs, attempts/backoff và retry behavior giữ nguyên. |
| SSE | Channel `sse:session:${sessionId}`; events `session.status`, `turn.feedback_ready`, `turn.transcription_ready`, `session.feedback_progress`, `report.ready`; payload key giữ nguyên. |
| Database | Không đổi schema/record shape trong refactor ownership. `rubricVersionId` snapshot, question-criterion links, answer/feedback/report write semantics giữ nguyên. |
| AI behavior | Prompt version, model selection, timeout, fallback and scoring semantics không đổi trừ PR đã được phê duyệt riêng. |
| Security | JWT/roles behavior, audio upload MIME/size limit, allow-listed HTTPS host và no-redirect download không bị nới lỏng. |

## Roadmap triển khai tuần tự

Mỗi phase gồm các PR nhỏ; chỉ bắt đầu phase sau khi exit criteria của phase trước đạt. Số phase không phải deadline cứng: nếu một phase chưa xanh, sửa/rollback ngay tại phase đó.

### Phase 0 — Baseline và safety net (P0)

**Mục tiêu:** có thể chứng minh behavior không đổi trước khi di chuyển code.

1. Tạo `docs` contract inventory gồm endpoint, queue payload, SSE event và transition status thực tế từ source/test.
2. Viết test thuần cho `SessionService` transition: generating/ready/active/paused/completing/completed/error/canceled, complete-with-auto-skip và enqueue failure rollback.
3. Bổ sung integration test cho mỗi worker với queue payload thật và fake provider: question persistence/fallback, feedback persistence/fallback/progress, transcription-to-feedback, report completion.
4. Bổ sung HTTP contract tests bằng Nest test app + database test có kiểm soát cho: create session, question read/status, text answer, audio upload/voice retry, report pending/ready và SSE authorization. Redis/OpenAI/Supabase phải được fake ở boundary, không gọi production service.
5. Di chuyển test `session-completion-flow.e2e-spec.ts` vào nhóm integration nếu vẫn mock dependency; chỉ gọi là E2E khi nó boot HTTP app và dùng DB/Redis test thật.
6. Ghi baseline kết quả `npm run build`, `npm test -- --runInBand`, `npm run test:e2e` trong PR. Lần đánh giá này chạy unit suite trong giới hạn 60 giây của môi trường và bị timeout trước khi có summary, nên **không được xem là baseline pass**.

**Exit criteria:** test taxonomy rõ ràng; all build/unit/integration/contract tests pass trên CI; mỗi queue/SSE/REST contract có assertion; không có test gọi provider thật.

### Phase 1 — Đưa Rubric Catalog về Assessment ownership (P0)

**Mục tiêu:** Prisma chỉ còn database capability; rubric data/versioning có owner rõ.

1. Tạo `assessment/rubric` bên cạnh code cũ, move-by-import lần lượt `context-pack.data.ts`, `rubric-versioning.ts`, `ReferenceDataService` thành `RubricCatalogService`/`RubricCatalogBootstrap`.
2. Giữ API tạm tương thích `ensureActiveRubricVersion`, `ensureContextPack` để `SessionService`, pipeline và rubric controller không đổi caller trong PR đầu.
3. Tách hai ý nghĩa đang lẫn trong bootstrap:
   - đọc active catalog/snapshot ở runtime;
   - provision/update default catalog cho môi trường mới hoặc data legacy.
4. Chuyển provision sang seed hoặc command rõ ràng (idempotent và versioned); migration legacy context-pack ID là one-off migration có log/audit. Không tự ghi business catalog mỗi startup sau cutover.
5. Cập nhật `PrismaModule` để chỉ export Prisma service và helper database; Assessment module export catalog read service cần thiết.
6. Giữ checksum, active-version selection, rubric snapshot, foreign key/restrict semantics và seeded data byte-for-byte trong phase này.

**Rollback:** compatibility facade vẫn gọi implementation cũ/new; nếu catalog provisioning lỗi, restore facade và không chạy destructive migration.

**Exit criteria:** restart app không mutate catalog business data; local/test bootstrap documented; create session, question criteria persistence, rubric endpoint và scoring tests pass.

### Phase 2 — Cô lập OpenAI/provider boundary mà không đổi behavior (P1)

**Mục tiêu:** bỏ coupling provider khỏi feature dần dần, không viết lại AI resilience.

1. Extract từ `OpenAIGateway` thành `OpenAIChatClient` và `OpenAITranscriptionClient`; giữ cấu hình model per task, AbortSignal timeout, quota cooldown, 429 retry, truncation retry, structured JSON repair/logging.
2. Giữ `OpenAIGateway` như facade delegate sang hai client trong PR chuyển tiếp để không buộc mọi caller đổi cùng lúc.
3. Định nghĩa token/type nhỏ tại boundary (`StructuredLlmClient`, `SpeechToText`) khi caller đầu tiên chuyển sang inject token; adapter OpenAI implement chúng.
4. Để prompt construction, Zod schema, fallback content và semantic validation ở feature caller. Không đẩy chúng vào generic client.
5. Chỉ extract `RetryPolicy`, error classifier hoặc JSON parser nếu dùng ở cả chat và transcription hoặc có test riêng chứng minh lợi ích; không tạo nhiều file theo sơ đồ khi chỉ một caller.

**Exit criteria:** unit tests hiện tại cho gateway pass không đổi semantic; all chat/transcription callers vẫn qua same timeout/model/fallback paths; no OpenAI SDK import ngoài infrastructure adapter/facade.

### Phase 3 — Hình thành Question ownership, chuyển question worker (P0)

**Mục tiêu:** Question generation, bank, criteria và question metadata có một owner.

1. Tạo `QuestionModule` façade import/export compatibility cho `QuestionBankService`, `QuestionCriteriaService`; đổi importer trước, xóa hai Nest module cũ sau.
2. Move `QuestionGenerationProcessor` vào Question, ban đầu giữ queue decorator, DTO payload, job options và SSE event nguyên trạng.
3. Extract application service `GenerateSessionQuestions` từ processor. Nó sở hữu hybrid ratio, metadata normalization, question-bank fallback, criteria link preparation và persistence transaction. Processor còn deserialize/call/log retry/emit event.
4. Move question-specific prompt strategy and `question-metadata` vào Question. Prompt base/shared structured LLM utility có thể còn ở AI infrastructure.
5. Không đổi thuật toán AI versus bank composition, randomization, order index, criterion mapping hay fallback conditions.

**Exit criteria:** only Question owns question-generation worker; test fallback AI-only/bank-only/hybrid, duplicate job and session cancellation; API question/status and `session.status` SSE exact contract pass.

### Phase 4 — Tách voice storage, speech và interview worker (P1)

**Mục tiêu:** audio artifact, STT provider và interview workflow tách responsibility nhưng response cũ vẫn hoạt động.

1. Extract `AudioObjectStorage` Supabase adapter from `AudioStorageService`: upload file -> object URL/metadata only.
2. Retain/create `UploadAndTranscribeAnswerAudio` application service to call storage then `SpeechToText`; `POST .../turns/audio` vẫn trả `audioFileUrl`, size, transcript và duration như hiện tại.
3. Move `WhisperService` behavior to speech adapter and retain host allow-list, HTTPS only, no credentials/IP, redirect error, content type and streamed max-size enforcement.
4. Move `VoiceMetricsService`, transcription job DTO/processor into Interview. Extract `TranscribeAnswer` use case: persist transcript/metrics -> enqueue feedback or fallback -> emit event.
5. Preserve both supported voice paths: immediate transcription returned from upload and queued transcription when answer URL has no transcript/retry. Document why two paths exist before considering product simplification.

**Exit criteria:** no storage adapter imports STT; no STT adapter imports session business; invalid URL/MIME/oversize tests pass; `turn.transcription_ready`, retry job ID and feedback payload stay unchanged.

### Phase 5 — Hình thành Assessment và chuyển feedback ownership (P0)

**Mục tiêu:** rubric snapshot, evaluation, score and feedback persistence có một owner.

1. Move `ContextPackService` rubric-read responsibility, dimension matcher, feedback segment sanitizer and fallback feedback into Assessment. Tách cultural/prompt text khỏi rubric snapshot nếu code review chứng minh chúng không cùng lifecycle; không ép tách chỉ theo folder.
2. Extract `EvaluateAnswer` from `BasePipelineService`/`FeedbackProcessor`. Nó owns allowed criterion resolution, prompt input, output validation, weighted score, sanitizer and persistence intent.
3. Move `FeedbackProcessor` to Assessment. Processor only loads job/calls use case/retry/event output; persistence/fallback moves out one behavior-preserving slice at a time.
4. Keep `BasePipelineService` only while question and feedback still share real mechanics. Once both have separate application services, delete it and strategy factory only if no longer meaningful. Do not preserve inheritance for naming symmetry.
5. Extract `FeedbackProgressReader` from `ReportService` only if it becomes shared by Session/Assessment/Reporting; otherwise leave read query where it is.

**Exit criteria:** Assessment owns feedback worker and rubric business logic; all scoring/segment/fallback tests pass exactly; output dimension IDs/weights and feedback SSE payloads are unchanged.

### Phase 6 — Stabilize Reporting as its own workflow (P1)

**Mục tiêu:** report read query và report-generation workflow tách rõ mà không ép gộp Assessment.

1. Rename/move `report` to `reporting` only if import migration is safe; a physical rename alone is optional and has no priority.
2. Split `ReportService` internally into `GetReport`, `GetFeedbackProgress`, `RequestReportGeneration`, `ReportReadinessPolicy`. Keep a `ReportService` facade until controllers and callers migrate.
3. Move `ComprehensiveReportProcessor` to Reporting and extract `GenerateComprehensiveReport`. It owns report input projection, prompt, validation, five report writes, overall score completion and `report.ready` event.
4. Keep `ReportReadinessPolicy` as direct in-process coordination initially. If feedback/report remain separate contexts and direct dependency causes a cycle, introduce a small typed `FeedbackCompleted` notification after contract tests exist; no blanket event bus.
5. Preserve idempotent `report-${sessionId}` job handling, delayed/retry policy, completed-session update and report types/version resolution.

**Exit criteria:** Reporting has one owner for report worker/readiness/query; duplicate feedback completion cannot enqueue duplicate report; readiness, partial/unavailable report and report SSE tests pass.

### Phase 7 — Split Session lifecycle by cohesive behavior (P0)

**Mục tiêu:** giảm `SessionService` orchestration without controller/API churn.

1. Extract a pure `SessionLifecyclePolicy` (allowed transition + preconditions) and characterize its behavior with table-driven tests. Do not change status storage from string in this phase.
2. Extract `CreateInterviewSession`: creation limit, saved-JD ownership check, active rubric resolution, session persistence, question job enqueue and enqueue failure compensation.
3. Extract read queries only as they become independently reusable: `GetInterviewSession`, `ListInterviewSessions`, `GetSessionQuestions`.
4. Extract `ChangeInterviewSessionStatus` / `CompleteInterviewSession`: auto-skip transaction, all-answered rule, report enqueue and compensation path.
5. Keep `SessionService` as a thin compatibility façade during controller migration, then delete it. Do not make controllers inject five use cases merely to satisfy a pattern; a small feature application service is acceptable.

**Exit criteria:** constructor dependencies are focused; lifecycle/limit/completion tests pass; no status transition changes, no race regression with question worker or report enqueue.

### Phase 8 — Split Turn/answer workflow by path (P1)

**Mục tiêu:** make text, voice and skip rules understandable and testable separately.

1. Extract shared authorization/session/question lookup and idempotency guard once; do not copy guard logic into every use case.
2. Extract `SubmitTextAnswer`, `SubmitVoiceAnswer`, `SkipQuestion`, `RetryTranscription` from `TurnService` in separate PRs. Queue feedback/transcription behind the same job payload builder.
3. Keep `TurnService` façade while controller contract remains unchanged, then remove it.
4. Explicitly test concurrent/replayed submit by `(sessionId, questionId)`, edited voice answer behavior, already-completed transcription retry and skipped answer exclusion from feedback requirement.

**Exit criteria:** Turn has no AI module import; every old path has direct test; dedup/upsert semantics and job ID remain identical.

### Phase 9 — Infrastructure placement and cross-context cleanup (P2)

**Mục tiêu:** complete folder/module cleanup only after real ownership is proven.

1. Move `SseService` to `infrastructure/realtime/redis`, expose a narrow publisher/stream token, preserve observable stream behavior and channel/event contract.
2. Move Prisma connection/timezone/error helpers to `infrastructure/database/prisma`; do this mechanically after rubric code already left, not before.
3. Centralize BullMQ queue registrations/constants in infrastructure only if it removes duplicated registration without obscuring feature-owned processors.
4. Run static import/circular-dependency audit. Delete all compatibility facades and dead exports only after no importer remains.
5. For each cross-context dependency, choose direct call vs notification based on lifecycle: direct call for same synchronous use case; notification for independently retryable side effect. Document each chosen event, its idempotency key and failure policy.

**Exit criteria:** physical topology reflects ownership, no `AiModule` as business aggregator, no Prisma business catalog export, no circular module dependency, no duplicate implementation.

### Phase 10 — Identity review, not automatic merge (P2)

**Mục tiêu:** decide with evidence whether a single Identity context adds value.

1. Map Auth (credentials/tokens), User (self profile) and Admin (user administration) consumers, authorization rules and lifecycle.
2. If a common policy/use case is genuinely shared, add `IdentityModule` as a facade and migrate one capability at a time. Otherwise retain modules and document their boundaries.
3. Do not make `AuthModule` global merely for convenience in new code; inject explicit guard/module dependencies as modules are touched.

**Exit criteria:** merge is performed only if it reduces imports/duplication; auth routes, cookies, token-version and admin safety rules remain unchanged.

## Pull-request slicing and order

| Order | Small PR scope | Depends on |
| --- | --- | --- |
| 0.1 | Contract inventory and test taxonomy | none |
| 0.2 | Lifecycle + queue/SSE characterization tests | 0.1 |
| 0.3 | HTTP contract test harness | 0.1 |
| 1.1 | Rubric catalog read service + compatibility facade | 0.x |
| 1.2 | Explicit catalog provision command/seed migration | 1.1 |
| 2.1 | OpenAI chat/transcription clients behind gateway facade | 0.x |
| 3.1 | `QuestionModule` facade and importer migration | 1.1 |
| 3.2 | `GenerateSessionQuestions` extraction | 3.1, 2.1 |
| 3.3 | Move question worker and remove old providers | 3.2 |
| 4.1 | Audio storage/STT separation with compatibility orchestration | 2.1 |
| 4.2 | Move transcription worker to Interview | 4.1, 3.1 |
| 5.1 | Assessment rubric/feedback utilities move | 1.1, 2.1 |
| 5.2 | `EvaluateAnswer` and feedback worker extraction | 5.1 |
| 6.1 | Reporting service internal split | 5.2 |
| 6.2 | Report worker extraction and readiness policy | 6.1 |
| 7.1 | Session lifecycle policy and create/completion slices | 1.1, 6.1 |
| 8.1 | Turn path slices and remove AI import | 4.2, 5.2 |
| 9.1 | Infrastructure moves, circular/import cleanup | 3.x–8.x |
| 10.1 | Identity evidence review | pipeline complete |

One PR contains one row or a smaller reversible subset. Do not combine architecture changes with prompt edits, score changes, database schema changes or client API changes.

## Mandatory verification per PR

1. `npm run build`.
2. Relevant unit tests plus `npm test -- --runInBand` before merge.
3. Relevant integration/HTTP contract tests; run `npm run test:e2e` once it contains real E2E coverage.
4. Assert input/output of affected queue payload and emitted SSE event exactly.
5. Inspect `git diff` for only scoped code; no unrelated client/docs changes are included.
6. Verify no new circular Nest module dependency and no direct provider SDK import in feature logic.
7. Test retry/idempotency/fallback path for every worker changed, not only happy path.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Worker move silently changes DI or duplicate consumers process the same queue | Register exactly one processor per queue during migration; use queue processing integration test and inspect providers before deleting old worker. |
| Background job payload drifts while producer/consumer merge at different time | Freeze typed payload definitions and test serialized object; use dual consumer only for explicit versioned migration. |
| Refactor weakens audio SSRF/upload validation | Preserve validation at both trust boundaries; add malicious URL, redirect, IP literal, MIME and stream-size tests. |
| Bootstrap removal leaves fresh environments without rubric | Provide documented idempotent seed/catalog command in CI/dev bootstrap before deleting `OnApplicationBootstrap` writes. |
| Session/report race causes stuck `completing` session or duplicate reports | Preserve existing update/queue dedup behavior; test feedback finishes before and after completion request; retain deterministic report job ID. |
| “Clean architecture” produces class explosion | Use tokens only at external boundaries; defer generic repository/event bus/CQRS unless a measured second use case proves need. |
| Folder move creates noisy conflict and hides semantic regression | Extract behavior under old path first, move in a follow-up mechanical PR, then remove compatibility export. |

## Explicit non-goals

- No microservice extraction or distributed transaction/outbox implementation.
- No database redesign, schema enum conversion, prompt/scoring redesign, model/provider replacement, API redesign or client rewrite.
- No global generic `Repository<T>`, command/query bus, event bus or “one port per service” framework.
- No forced merge of Reporting into Assessment or Identity into one physical module without evidence.

## Completion definition

The roadmap is complete when feature ownership is clear (Question, Interview, Assessment, Reporting), AI is infrastructure rather than a business umbrella, runtime no longer bootstraps rubric business data, provider/storage/realtime are behind narrow boundaries, old facades are removed, and all frozen REST/queue/SSE/database/security contracts remain green. The desired endpoint is a simpler modular monolith—not a more elaborate framework.
