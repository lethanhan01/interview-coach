# Tiến độ refactor backend

**Cập nhật lần cuối:** 2026-08-10  
**Nguồn kế hoạch:** [index](./README.md) · [roadmap tổng](./2026-08-10-server-backend-refactor-roadmap.md)

## Trạng thái hiện tại

**Phase đang thực hiện:** Hoàn tất Phase 5 — Assessment ownership.
**Blocker hiện tại:** Chưa có.
**Bước tiếp theo:** Chờ xác nhận để bắt đầu Phase 6 — Reporting ownership.

## Bảng Phase

| Phase | Trạng thái | Đã hoàn thành | Bước tiếp theo | Evidence/ghi chú |
| --- | --- | --- | --- | --- |
| 0 — Safety net | Hoàn tất | Baseline, contract inventory, queue/SSE/lifecycle characterization, integration taxonomy và HTTP contract harness. | Chờ xác nhận bắt đầu Phase 1. | Build pass; unit 43 suites/378 tests pass; integration 1 suite pass; HTTP E2E 1 suite pass trên PostgreSQL/Redis cô lập. Question-generation baseline không có `jobId`/dedup. |
| 1 — Rubric Catalog | Hoàn tất | Assessment sở hữu catalog read/provision code; startup không còn write/migrate catalog. | Chờ xác nhận bắt đầu Phase 2. | Build pass; unit 44 suites/379 tests pass; integration và HTTP E2E pass. |
| 2 — AI boundary | Hoàn tất | Tách OpenAI chat/transcription SDK invocation khỏi facade; gateway giữ toàn bộ behavior policy. | Chờ xác nhận bắt đầu Phase 3. | Build pass; unit 44 suites/380 tests pass; integration và HTTP E2E pass. |
| 3 — Question | Hoàn tất | Question là owner của `question-generation` worker và use case generation; AI chỉ còn provider/pipeline boundary. | Chờ xác nhận bắt đầu Phase 4. | Build pass; unit 44 suites/380 tests pass; integration và HTTP E2E pass. |
| 4 — Voice | Hoàn tất | Interview sở hữu audio storage/STT orchestration và `transcription` worker; AI chỉ giữ OpenAI provider boundary. | Chờ xác nhận bắt đầu Phase 5. | Build pass; unit 44 suites/380 tests pass; integration và HTTP E2E pass. |
| 5 — Assessment | Hoàn tất | Assessment sở hữu rubric read/controller, `EvaluateAnswer`, sanitizer/dimension matcher/fallback và sole `feedback` worker. | Chờ xác nhận bắt đầu Phase 6. | Build pass; unit 44 suites/380 tests pass; integration và HTTP E2E pass. |
| 6 — Reporting | Chưa bắt đầu | — | Chờ Phase 5. | — |
| 7 — Session | Chưa bắt đầu | — | Chờ Phase 1 và 6. | — |
| 8 — Turn | Chưa bắt đầu | — | Chờ Phase 4 và 5. | — |
| 9 — Infrastructure | Chưa bắt đầu | — | Chờ semantic phases. | — |
| 10 — Identity | Chưa bắt đầu | — | Chờ interview pipeline ổn định. | — |

## Quyết định quan trọng

| Ngày | Quyết định | Lý do | Ảnh hưởng |
| --- | --- | --- | --- |
| 2026-08-10 | Giữ modular monolith; không rewrite/microservice/CQRS toàn hệ thống. | Hệ thống đã có Nest module, BullMQ, Redis/SSE và fallback AI hoạt động; pain point là ownership/dependency. | Mọi phase là strangler refactor nhỏ, reversible. |
| 2026-08-10 | Freeze REST, queue, SSE, DB write, AI behavior và audio security contract trong refactor. | Dễ phân biệt architectural regression với product change. | Thay đổi contract phải là plan/ADR riêng. |
| 2026-08-10 | Chỉ dùng port/adapter ở external boundary thật. | Tránh một port/repository/factory cho từng service khi mới có một implementation. | OpenAI, STT, storage, realtime là seam ưu tiên. |
| 2026-08-10 | Reporting vẫn là context riêng trong các phase đầu. | Report tiêu thụ Assessment nhưng có API/read model/queue lifecycle riêng. | Không ép move vào Assessment. |
| 2026-08-10 | Giữ audio validation tại upload và STT download. | Download URL là SSRF boundary cho queued/retry path. | Không “simplify” bằng cách bỏ validation thứ hai. |
| 2026-08-10 | Move behavior trước, move folder sau. | Folder-only PR lớn gây noise và che semantic regression. | Mỗi phase có compatibility facade rồi cleanup. |

## Nhật ký thực hiện

### 2026-08-10 — Phase 5 / Assessment ownership exit criteria đạt

- Phase: 5 — Assessment ownership
- Trạng thái: Hoàn tất
- Hoàn thành: Assessment sở hữu rubric context read/controller, `EvaluateAnswer`, dimension matcher, segment sanitizer, feedback fallback và sole `feedback` worker. Worker gọi use case rồi persist/fallback, emit SSE và kiểm tra Report readiness; `AiModule` không còn đăng ký feedback queue/processor hoặc rubric/context provider.
- Contract kiểm tra: giữ `feedback` queue/payload/concurrency/retry, weighted score, dimension validation/normalization, annotation repair, fallback text, `AiFeedback`/`AnnotatedSegment` write shape, SSE `turn.feedback_ready`/`session.feedback_progress` và direct Report readiness call.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (44 suites, 380 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite); `git diff --check` — pass.
- Quyết định: xóa các compatibility re-export của context pack, feedback worker/sanitizer/dimension matcher và rubric controller sau khi chuyển hết importer. Giữ `BasePipelineService.evaluateAnswer` như code compatibility không còn được feedback worker gọi; chỉ xoá method này khi không còn importer thực.
- Rủi ro/rollback: chỉ một `@Processor(FEEDBACK_QUEUE)` tại Assessment; rollback là đăng ký lại processor cũ trong `AiModule`, không đổi schema, queue payload hoặc data.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 6 — Reporting ownership.

### 2026-08-10 — Phase 5 / feedback worker và rubric context ownership bắt đầu

- Phase: 5 — Assessment ownership
- Trạng thái: Đang thực hiện
- Hoàn thành: chuyển sole `feedback` BullMQ processor và `ContextPackService` registration sang `AssessmentModule`; `AiModule` không còn đăng ký feedback queue/processor hoặc context-pack provider. Giữ compatibility re-export cho các importer cũ trong lúc migration.
- Contract kiểm tra: không đổi queue name/payload, concurrency, retry/fallback, DB write, SSE hoặc Report readiness flow.
- Verification: `npm run build` — pass; `npm test -- --runInBand src/ai/processors/feedback.processor.spec.ts src/ai/processors/feedback-flow.integration.spec.ts` — pass (2 suites, 29 tests).
- Quyết định: chưa đánh dấu phase hoàn tất vì `BasePipelineService.evaluateAnswer` vẫn chứa rubric evaluation; sẽ trích use case trước khi xoá compatibility exports.
- Rủi ro/rollback: chỉ có một feedback processor được đăng ký tại Assessment; rollback là đăng ký lại processor cũ trong `AiModule`, không đổi schema/data/queue payload.
- Bước tiếp theo: trích `EvaluateAnswer`, persistence/fallback và assessment utilities khỏi AI pipeline.

### 2026-08-10 — Phase 4 / Voice ownership exit criteria đạt

- Phase: 4 — Voice ownership
- Trạng thái: Hoàn tất
- Hoàn thành: thêm `InterviewModule`; tách `AudioObjectStorage` chỉ upload/return URL+size khỏi `UploadAndTranscribeAnswerAudio`; chuyển STT thành `SpeechToText`, `VoiceMetricsService`, DTO và sole `transcription` consumer vào Interview; trích `TranscribeAnswer` để xử lý persist transcript/metrics, feedback/fallback và SSE. `AiModule` không còn đăng ký transcription worker hoặc provider Voice/Whisper.
- Contract kiểm tra: giữ response `POST /sessions/:sessionId/turns/audio` (`audioFileUrl`, size, transcript, duration); giữ `transcription-${answerId}`, attempts/backoff, feedback payload, `turn.transcription_ready`, immediate upload transcription và queued/retry transcription paths.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (44 suites, 380 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite); `git diff --check` — pass.
- Quyết định: tạo `InterviewModule` tối thiểu làm owner cho voice workflow; `TurnService` vẫn là facade HTTP/answer hiện hữu, không đổi API hay tách thêm các use case Phase 8 sớm.
- Rủi ro/rollback: chỉ một `@Processor(TRANSCRIPTION_QUEUE)` được đăng ký tại Interview; rollback là chuyển provider/processor registration về `AiModule`, không đổi schema, queue payload hoặc data.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 5 — Assessment ownership.

### 2026-08-10 — Phase 3 / Question ownership exit criteria đạt

- Phase: 3 — Question ownership
- Trạng thái: Hoàn tất
- Hoàn thành: thêm `QuestionModule` làm facade cho Question Bank/Criteria và owner duy nhất của queue consumer; tách `GenerateSessionQuestions` chứa hybrid AI-bank generation, metadata normalization, criterion persistence transaction; processor chỉ gọi use case, map lifecycle/retry failure và emit SSE; chuyển `question-metadata` sang Question; `AiModule` không còn đăng ký question worker hay import Question Bank/Criteria.
- Contract kiểm tra: giữ `question-generation` queue/job payload, fallback AI ↔ bank, `skipDuplicates`, rubric criterion links, session active/error race, SSE `session.status` và HTTP session reads.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (44 suites, 380 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite); `git diff --check` — pass.
- Quyết định: giữ prompt config question tại AI trong phase này vì `BasePipelineService` còn cùng owner với OpenAI invocation; move config riêng lẻ sẽ tạo vòng `Question -> Ai -> Question`, không mang lại ownership thực tế.
- Rủi ro/rollback: facade cũ `QuestionBankModule`/`QuestionCriteriaModule` vẫn tồn tại để tương thích; rollback chỉ cần đăng ký processor cũ trở lại `AiModule`, không đổi schema/data/queue payload.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 4 — Voice ownership.

### 2026-08-10 — Phase 2 / AI provider boundary exit criteria đạt

- Phase: 2 — AI boundary
- Trạng thái: Hoàn tất
- Hoàn thành: thêm `OpenAIChatClient` và `OpenAITranscriptionClient` chỉ sở hữu OpenAI SDK/protocol invocation; `OpenAIGateway` giữ facade, model/timeout selection, quota/rate-limit retry, truncation retry, JSON repair/logging và response mapping; thêm characterization test cho transcription boundary.
- Contract kiểm tra: không đổi REST, queue/SSE payload, prompt/Zod/fallback/scoring, model/config/env, retry/timeout hoặc output/error semantics; không migrate caller.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (44 suites, 380 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite); `git diff --check` — pass.
- Quyết định: chưa thêm `StructuredLlmClient`/`SpeechToText` hoặc generic retry/parser vì chưa có consumer cần chuyển DI và không có reuse độc lập chứng minh lợi ích.
- Rủi ro/rollback: facade và caller không đổi; rollback chỉ cần bỏ hai adapter mới và khôi phục SDK invocation trong gateway, không ảnh hưởng schema/data/queue.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 3 — Question ownership.

### 2026-08-10 — Phase 1 / Rubric Catalog exit criteria đạt

- Phase: 1 — Rubric Catalog
- Trạng thái: Hoàn tất
- Hoàn thành: di chuyển context-pack data/versioning và catalog provision về `src/assessment/rubric/`; `RubricCatalogService` chỉ đọc/validate active version; Session migrate sang Assessment; xoá `ReferenceDataService` khỏi `PrismaModule` và bỏ toàn bộ startup provision/legacy-ID write.
- Contract kiểm tra: giữ nguyên seeded catalog `v1`, checksum, `rubricVersionId`, criterion link, foreign-key behavior và REST rubric/session response; HTTP E2E provision catalog rõ ràng thay vì dựa vào side effect startup.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (44 suites, 379 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite); `git diff --check` — pass.
- Quyết định: `npm run seed` là provisioning path idempotent cho environment mới; `npm run db:migrate-legacy-context-packs` là command one-off có log cho `vn`/`western`, không chạy khi app boot.
- Rủi ro/rollback: environment mới phải chạy seed sau schema apply; rollback có thể tạm restore startup provision, không cần schema/data migration phá hủy.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 2 — AI boundary.

### 2026-08-10 — Phase 0 / baseline repository

- Phase: 0 — Safety net
- Trạng thái: Đang thực hiện
- Hoàn thành: ghi baseline commit `7817d629a337e836ebf14e1e5491f4de2e232dc3` và xác nhận worktree sạch; từ commit tạo plan `c73bc61` đến baseline không có thay đổi trong `server/src`, `server/test` hoặc `server/package.json`.
- Contract kiểm tra: chưa thay đổi runtime contract.
- Verification: `git status --short`, `git diff --name-only c73bc61..7817d62 -- server/src server/test server/package.json` — pass (không có thay đổi backend/refactor chưa ghi nhận).
- Quyết định: baseline là HEAD hiện tại, không dùng commit tạo plan vì HEAD là trạng thái repository thực tế sẽ được kiểm thử.
- Rủi ro/rollback: baseline chưa phải test xanh; không được coi đây là approval để bắt đầu refactor runtime.
- Bước tiếp theo: lập contract inventory versioned cho Session, Turn, Report, Rubric và Auth.

### 2026-08-10 — Phase 0 / contract inventory

- Phase: 0 — Safety net
- Trạng thái: Đang thực hiện
- Hoàn thành: thêm [contract inventory](./00-phase-0-contract-inventory.md) versioned cho REST Session/Turn/Report/Rubric/Auth, bốn queue, SSE channel/event và lifecycle/security invariants.
- Contract kiểm tra: inventory đối chiếu trực tiếp với controller, DTO, producer và worker hiện tại; không thay đổi runtime contract.
- Verification: rà soát source controller/DTO/queue/SSE; `git diff --check` — pass.
- Quyết định: giữ inventory ở `docs/superpowers/plans/` để version cùng roadmap và dùng làm source cho các test characterization tiếp theo.
- Rủi ro/rollback: response projection chi tiết của một số read model (questions, feedback progress, audio upload) cần được HTTP contract test khóa ở task sau; tài liệu không thay thế assertion tự động.
- Bước tiếp theo: chuẩn hóa typed fixture cho bốn queue và bắt đầu characterization test SSE/lifecycle.

### 2026-08-10 — Phase 0 / test taxonomy và HTTP harness

- Phase: 0 — Safety net
- Trạng thái: Đang thực hiện
- Hoàn thành: sửa stale mock `savedJobDescription.userId` trong flow test; đổi nó thành `session-completion-flow.integration-spec.ts` và thêm `npm run test:integration`; thêm HTTP E2E boot `AppModule` với PostgreSQL `interviewcoach_test` và Redis cục bộ, workers tắt, provider credential giả.
- Contract kiểm tra: Auth register/cookie, create Session, `GET /sessions/:id/status`; không gọi OpenAI/Supabase production.
- Verification: `npm run build` — pass (109.5s); `npm test -- --runInBand` — pass (43 suites, 378 tests, 136.36s); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite).
- Quyết định: CI Server job provision PostgreSQL 16 + Redis, apply schema vào DB test rồi chạy integration/HTTP contract suites; flow mock không còn bị gọi nhầm là E2E HTTP.
- Rủi ro/rollback: HTTP suite mới chỉ khóa Auth/session create/status; các endpoint Turn, audio, Report, Rubric và SSE authorization vẫn phải được thêm trước khi Phase 0 hoàn tất.
- Bước tiếp theo: xem entry hoàn tất Phase 0 bên dưới.

### 2026-08-10 — Phase 0 / exit criteria đạt

- Phase: 0 — Safety net
- Trạng thái: Hoàn tất
- Hoàn thành: mở rộng HTTP contract test qua Session read/questions/status, Turn text/voice queue, audio validation, Report pending, Rubric và SSE auth; kiểm tra queue/SSE/lifecycle/worker assertions; phân loại question-generation baseline là không có `jobId`/dedup theo quyết định đã xác nhận.
- Contract kiểm tra: REST, queue, SSE, session lifecycle, fallback/retry và audio input boundary; không đổi runtime behavior/schema/provider.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (43 suites, 378 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 suite); `git diff --check` — pass.
- Quyết định: preserve absence of `jobId`/dedup for `question-generation`; chỉ thay đổi này qua contract migration riêng nếu cần trong tương lai.
- Rủi ro/rollback: PostgreSQL test là container tạm `localhost:5433`; CI dùng service container riêng. Phase 0 không có runtime migration nên rollback chỉ là revert test/docs/CI harness.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 1 — Rubric Catalog.

### 2026-08-10 — Khởi tạo kế hoạch

- Hoàn thành: audit source và tạo roadmap tổng, index, tài liệu Phase 0–10, progress ledger.
- Chưa thay đổi: không có source/runtime behavior nào bị refactor.
- Test: `npm test -- --runInBand` được khởi chạy nhưng môi trường dừng ở 60 giây trước kết quả tổng kết; các log lỗi hiển thị là expected-path test logs, không đủ để kết luận pass/fail.
- Tiếp theo: thực hiện Phase 0 theo checklist, ghi commit SHA và artifact CI tại entry kế tiếp.

## Mẫu entry sau mỗi PR

```md
### YYYY-MM-DD — <PR/commit/title>

- Phase: <n> — <name>
- Trạng thái: Chưa bắt đầu | Đang thực hiện | Blocked | Hoàn tất
- Hoàn thành: <task/checklist và file thay đổi>
- Contract kiểm tra: <REST / queue / SSE / DB / security>
- Verification: `<commands>` — <pass/fail + link artifact>
- Quyết định: <decision và lý do, hoặc “không có”>
- Rủi ro/rollback: <nếu có>
- Bước tiếp theo: <một hành động cụ thể>
```

## Quy ước trạng thái

- **Chưa bắt đầu:** chưa có implementation task được bắt đầu.
- **Đang thực hiện:** có một PR/task active; cập nhật ít nhất sau mỗi ngày làm việc.
- **Blocked:** không thể tiếp tục vì dependency, decision hoặc test/environment; nêu owner và điều kiện mở khóa.
- **Hoàn tất:** tất cả checklist/exit criteria của file phase đạt, evidence test đã ghi.
