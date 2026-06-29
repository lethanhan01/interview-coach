# Project Log — InterviewAI

Phase milestones và implementation sessions. Giới hạn: 200 dòng — xem .claude/rules/claude-md-sync.md §CHANGELOG.

---

## Phase Milestones

| Phase | Trạng thái | Ngày |
|-------|-----------|------|
| Discovery | Hoàn thành | 2026-05-04 |
| Requirements Analysis | Hoàn thành | 2026-05-09 |
| Architectural Design | Hoàn thành | 2026-06-06 |
| Implementation | Đang tiến hành | — |

**Discovery (2026-05-04):** Hướng A — AI Feedback Web App, target fresher VN 0–12 tháng. Surgical Feedback + Context Pack VN/Western. Outputs: docs/Discovery_Docs/Discovery_Document.md.

**Requirements Analysis (2026-05-09):** SRS, user stories, traceability matrix hoàn chỉnh. Outputs: docs/Design/. 2 open questions deferred (JD length threshold, context pack switching trong session).

**Architectural Design (2026-06-06):** SAD, HLD, ADR-001→008, DB design (11 tables), API design (23 endpoints), uiux-design, LLD (5 modules). Key: NestJS-only (ADR-005), Supabase (ADR-003), GPT-4o npm SDK (ADR-004), SSE+Redis (ADR-006), BullMQ 5-queue (ADR-007), pgvector deferred v2.

---

## Implementation — In Progress

| Phase | Trạng thái | Ghi chú |
|-------|------------|---------|
| Phase DB | Done | Prisma client, schema + raw SQL applied |
| Phase P0 | Done | Dependencies, env, AppModule |
| Phase P1 | Done | SseService, exceptions, middleware |
| Phase P2 | Done | JWT strategy, guards, refresh/logout |
| Phase P3 | Done | 5 processors, 3 pipelines, OpenAI gateway |
| Phase P4 | Done | Session CRUD, SSE stream |
| Phase P5 | Done | Turn submit, Whisper, voice metrics |
| Phase P6 | Done | Report endpoint, annotated transcript |
| Phase P7 | Done | Supabase auth, middleware, api-client |
| Phase P8 | Done | 5 pages, 8 components |
| Phase P8-FIX | Done | 7 bugs fixed (auth token, SSE headers, endpoints, DTOs) |
| Phase P8-FOLLOWUP | Done | Mic error handling, WCAG label, Button adoption, E2E setup |
| Phase P9 | Done | Unit tests — 81.22% statements (>=80% dat), 121 tests |
| Phase P9-FIX | Done | 9 bugs fixed (ContextPack IDs, schema, seed, mock, fallback) |
| Phase DEV-BYPASS | Done | Auth bypass via AUTH_ENABLED, NEXT_PUBLIC_SKIP_AUTH |
| Phase P8-REPORT-FIX | Done | Score scale 0-100, ScoringMethodCard, prompt v1.1 |
| Phase UI-REDESIGN | Done | Purple design system, landing page, all 5 app pages restyled |

---

## Recent Sessions

### 2026-06-29 — Chấm điểm linh hoạt per-question (Task 1-8 hoàn thành)

Mỗi câu chỉ chấm trên tập tiêu chí câu hỏi thực sự đánh giá được (không phải toàn bộ rubric). Plan: `docs/superpowers/plans/chamdiemlinhhoat.md`.

- LLM chỉ trả `applied_dimensions: { id, score }[]`; **code** tra name+base weight từ rubric theo `sessionType`, loại id lạ, chuẩn hóa weight, tính `overallScore = clamp(round(Σ score×weight), 1, 100)`. Throw `SCHEMA_VALIDATION_ERROR` nếu 0 dimension hợp lệ.
- `FeedbackSchema` bỏ `overall_score`, thêm `applied_dimensions`; `SurgicalFeedback` thêm `appliedDimensions`. Prompt unify → `surgical-feedback-v1.4`.
- Persist: cột nullable `ai_feedbacks.dimension_scores` (JSONB, migration `20260629084143`). Fallback + feedback cũ = null → backward-compat.
- Report API: `TranscriptItemDto.appliedDimensions?`. Client `AnnotatedTranscript` render breakdown thực tế, fallback `getRubricHint` cho câu null.
- Spec §2.7 pattern-weights hiện thực ở runtime bằng LLM dynamic selection — gap đã biết: runtime chưa lưu pattern câu hỏi (`SessionQuestion` chỉ có category/competency/difficulty) nên không map cứng pattern→weight được.
- Commits: `eb67de0`, `f58052e`, `6044015`, `83dbc6d`, `4b57fb7`, `7443273`, `91b4a41`, `bf18daf` + docs sync.

### 2026-06-29 — Report UI fixes (4 bugs)

- `AnnotatedTranscript`: bỏ `orderIndex + 1` — orderIndex đã 1-based, số câu hỏi bị lệch +1.
- `/sessions` list: điểm tổng `/10` → `/100`.
- `rubric-config.getRubricCategories`: single-type session (`hr`/`technical`) override `categoryWeightPct: 100` thay vì 50 (badge ScoringMethodCard hiển thị sai trọng số tiêu chí).
- `SessionMetadataCard`: "Thời gian thực hiện" (elapsed) → "Thời lượng" (durationMin cấu hình); "Vị trí mục tiêu" lấy từ `session.jobTitle`; bỏ row "Kinh nghiệm". Thêm `jobTitle?: string | null` vào `Session` type (lib/types.ts) — GET /sessions/:id đã trả raw Prisma object.

### 2026-06-28 — Question Bank T4-T8: 120 câu fallback đa ngôn ngữ

Question Bank fallback chuyển từ query inline trong worker sang module riêng:

- Seed `02-question-bank.ts`: canonical 120 active rows, gồm 90 câu cũ enrich `translations/tags/estimatedTimeMin/contentJson` + 30 câu frontend React/CSS/browser JS. `content` lưu EN, display theo `translations`.
- `SessionService`: enqueue question-generation payload có `userId` + `language: session.language`.
- `QuestionBankService`: select fallback theo `sessionType/contextPack`, spread độ khó 30/50/20, resolve text theo language, record `question_usage`.
- `QuestionGenerationProcessor`: inject service, persist fallback `session_questions`, record usage sau persist; bỏ helper fallback query inline.
- Docs/tests: thêm `src/question-bank/CLAUDE.md`, cập nhật `server/CLAUDE.md`, focused specs cho service/processor/session.

### 2026-06-08 — UI/UX Redesign — Purple Design System

Design system: `--color-brand: #6B3FA0`, Button/Card/Badge/Input/Textarea primitives, lucide-react.
Landing page (HeroSection/FeaturesSection/CtaSection), glassmorphism sticky navbar.
Tat ca 5 app pages restyled. Backend, API calls, SSE logic khong thay doi.
Report sub-components (AnnotatedTranscript, ActionPlanCard, CompetencyScoreChart) chua restyle.

### 2026-06-08 — Phase P8-REPORT-FIX

Score scale: toan bo UI dung thang 0-100; `CompetencyScoreChart` fix pct calc, `aria-valuemax=100`.
`ScoringMethodCard` moi: VN 4x25%, Western 5x20%, weight bars.
`AnnotatedTranscript`: rubric dimensions per question, nhan prop `contextPackId?`.
Backend `surgical-feedback-v1.1`: `model_answer` phai la cau tra loi mau 3-5 cau (khong phai danh sach goi y).

### 2026-06-08 — Phase P9-FIX: DB/Seed + Question Bank Fallback

9 bugs fixed. Quyet dinh quan trong:

- ContextPack IDs uppercase: `'VN'`, `'Western'` — fix FK violation tren moi POST /sessions.
- `previewFeatures` xoa khoi datasource (invalid trong Prisma version nay).
- Fallback set status `'ready'`, khong phai `'active'`.
- `process()` outer catch khong re-throw — set `'error'` va swallow, tranh BullMQ retry loop.
- seedQuestionBank: idempotency guard `count >= 90`, 6 pairs x 15, difficulty 30/50/20.

### 2026-06-09 — MVP Hardening

Idempotency, SSRF protection, session state machine corrections:

- `UserAnswer` `@@unique([sessionId, questionId])` — dedup CTE migration + `upsert` với `update: {}` trong `TurnService`.
- `WhisperService`: HTTPS-only, IP block, allowlist (`SUPABASE_URL` + `AUDIO_ALLOWED_HOSTS`), 15s timeout, streaming size check.
- `SessionService.updateStatus`: `completing` intermediate state; rollback về `'active'` nếu enqueue thất bại; `SESSION_INCOMPLETE` validation (answerCount >= questionCount).
- `ReportService.enqueueReport`: bỏ tham số `turnIds` (tự fetch), idempotent job ID `report-${sessionId}`, retry nếu job `failed`.
- `FeedbackProcessor`: `upsert` thay `create`, `deleteMany` segments trước `createMany` — cho phép re-run idempotent.
- `ComprehensiveReportProcessor`: validate `feedbacks.length === expectedFeedbackCount` trước khi proceed.
- `CommonModule` global: `SseService` provided once, không cần inject per-module.
- Global `ThrottlerGuard` qua `APP_GUARD`.
- `migration.sql` gộp: triggers + RLS + indexes + seed + schema changes vào 1 file.

### 2026-06-27 — Schema Evolution T10: Bỏ PII bloat user_profiles (SR-03)

Bỏ 5 field PII thuần khỏi `UserProfile` — không dùng cho phỏng vấn, giảm phạm vi PII (NĐ 13/2023):

- Schema: xóa `dateOfBirth`, `gender`, `phone`, `hometown`, `nationality`. Giữ `personality` (input cho prompt generation).
- `db push --accept-data-loss` (chỉ seed data, an toàn) + `prisma generate`.
- DTO `update-profile.dto.ts`, `user.service.ts` (bỏ xử lý đặc biệt `dateOfBirth`), seed `01-users.ts`.
- Client: `PersonalInfoGroup.tsx` chỉ còn `fullName`; `types.ts`, `constants.ts` (bỏ GENDER/NATIONALITY options).
- Docs: `08_profile.md`, `07_backend_api_inventory.md`, `Database.md` (D5), `server/CLAUDE.md`, `client/lib/CLAUDE.md`.

### 2026-06-27 — Schema Evolution T11 Phần 2: CHECK constraints (SR-05)

Reactivate từ backlog (quyết định user). CHECK constraint ở DB layer làm defense-in-depth, chỉ áp cột tập giá trị ổn định đã verify:

- `migration.sql` §7: `chk_interview_sessions_session_type` ∈ `{hr,technical,mixed}`; `chk_users_role` ∈ `{candidate,admin}`. Idempotent (`DROP IF EXISTS` + `ADD`), apply thủ công sau `db push`.
- Loại khỏi scope: `users.status` (chỉ `active`), `interview_sessions.status` (8 giá trị, có `ready` mà trace D3 thiếu) — rủi ro drift cao, giữ ở application layer.
- ADR-008 mới: quy trình apply raw SQL ngoài `prisma db push`.
- Docs: `Database.md` Constraints summary.

### 2026-06-27 — Schema Evolution T12 (scope B): Tách bảng `resumes` (SR-02)

Tách CV data khỏi `user_profiles` sang bảng `resumes` riêng; chỉ tách schema + migrate JSONB. CV upload + parser + link `resume_id` defer sang T12b.

- Schema: thêm model `Resume` (parsed_json, parser_version, active, language, fileUrl?...), `User → Resume (1:n)`. `UserProfile` mất 6 cột CV (`education`, `workExperience`, `projects`, `technicalSkills`, `certifications`, `awards`).
- API contract giữ phẳng (flat-API, D5): `getProfile` merge `parsed_json` của resume active ngược vào `profile`; `upsertProfile` tách field CV → upsert một `Resume` thủ công (`parser_version='manual'`, merge từng phần). DTO/client/types không đổi.
- `migration.sql`: §5 bỏ (cột CV chuyển sang resumes); thêm RLS cho `resumes` (read/insert/update own, update có cả USING + WITH CHECK); §8 backfill DO block guarded (copy JSONB từ user_profiles sang resumes trước khi drop cột).
- Seed `01-users.ts`: tách `resume.create` độc lập với guard `userProfile` (fix bug coupled guard — reseed sau khi tách bảng vẫn tạo resume).
- Tests: `user.service.spec.ts` 10/10, full suite 198/198 pass. `prisma validate`/`generate` OK, tsc sạch cho file T12.
- Docs: `server/CLAUDE.md` (models + §User Module), `schema-design-review.md` SR-02, plan checkboxes.
- Migration đã chạy (DB chỉ seed/demo): `db push --accept-data-loss` drop 6 cột CV + tạo bảng `resumes`; RLS resumes apply (`db execute`); reseed tạo demo resume. §8 backfill no-op (skip vì reseed).

### 2026-06-27 — T13: Tách bảng session_reports (SR-07)

Tách report payload khỏi `interview_sessions` sang bảng `session_reports` chuẩn hóa:

- Schema: xóa `planJson`, `selfEvalJson`, `executiveSummaryJson`, `commAnalysisJson`, `competencyHeatmapJson`, `actionPlanJson`. Thêm model `SessionReport` (unique `(session_id, report_type, version)`). `InterviewSession → SessionReport (1:n)`.
- `ComprehensiveReportProcessor`: thay `interviewSession.update(JSON cols)` bằng `$transaction([4x sessionReport.upsert, interviewSession.update])` — idempotent cho BullMQ retry.
- `ReportService.getReport`: `findUnique` + `include: { sessionReports: true }`; đọc content từ rows thay vì columns; check `REPORT_NOT_READY` qua `find(executive_summary)`.
- `migration.sql §9`: DDL + index + guarded backfill từ các JSON columns cũ nếu còn tồn tại + RLS cho `session_reports`. Apply sau `db push`.
- Tests: spec cập nhật toàn bộ — bỏ JSON column mocks, thêm `sessionReport.upsert` mock + `$transaction` mock.
- DB: `db push --accept-data-loss` drop 6 JSON columns + tạo `session_reports`; RLS apply.

### 2026-06-27 — Xử lý 5 điểm chú ý trước T13

Dọn các điểm tồn đọng trước khi sang T13 (tách session_reports):

- Fix 4 lỗi tsc pre-existing ở `test/session-completion-flow.e2e-spec.ts`: `TurnService` (6→5 args, bỏ transcribe/calculate stale, reorder), `FeedbackProcessor` (+reportService 5th arg), 2 cast `Job<any>` qua `unknown`. e2e pass.
- Hardened toàn bộ `server/prisma/migrations/migration.sql` idempotent: §1 trigger `DROP TRIGGER IF EXISTS`, §2 mỗi policy `DROP POLICY IF EXISTS`, §3 `CREATE INDEX IF NOT EXISTS`. Re-run an toàn sau mỗi `db push`.
- Thêm script `npm run db:apply-sql` (`prisma db execute --file ...`, Prisma 7 đọc datasource từ `prisma.config.ts`).
- **CHECK constraints §7 đã APPLY lên Supabase**: blocker 1 legacy row `session_type='behavioral'` → remap `→'hr'` (user xác nhận, reversible); thêm UPDATE normalize vào §4. Verify 2 constraints tồn tại.
- ADR-008: cập nhật quy trình apply (`db:apply-sql`), ghi nhận file idempotent toàn bộ.

### 2026-06-28 — Fix AI JSON failures + REPORT_NOT_READY 404

Ba lỗi trong session `2dafce71` (FeedbackProcessor "Invalid JSON", QuestionGen empty response, GET report 404 sai ngữ nghĩa):

- `server/.env`: bật `OPENAI_JSON_MODE=true` → gateway gửi `response_format: { type: 'json_object' }` tới LM Studio, buộc grammar-based JSON output.
- `OpenAIGateway`: thêm `extractJsonContent()` private — strip markdown code fences (` ```json...``` `) và extract `{...}` từ prose nếu model wrap JSON. Cover tất cả callers (BasePipeline, ComprehensiveReportProcessor) mà không đụng callers.
- `ReportService`: `REPORT_NOT_READY` throw `HttpStatus.ACCEPTED (202)` thay vì `NOT_FOUND (404)` — đúng ngữ nghĩa HTTP (202 = đang xử lý, 404 = không tồn tại). Client không bị ảnh hưởng vì check `err.message.includes("REPORT_NOT_READY")`.
- Tests: 3 test JSON extraction mới (strip fence, giữ plain JSON, extract từ prose) + update test REPORT_NOT_READY verify `getStatus() === 202`. Full suite: 187/187 pass.

### 2026-06-28 — Hybrid question generation (AI 20% + QB 80%)

Tăng số câu hỏi per session và kết hợp nguồn AI + question bank:

- Durations: 30 min → 15 câu, 60 min → 30 câu, 90 min → 45 câu. Tỷ lệ cố định: AI = total/5, QB = total × 4/5.
- `QuestionGenerationProcessor`: hybrid flow — AI generates `aiCount` câu, QB fills `qbCount` câu; `mergeQuestions()` đặt AI tại positions 5, 10, 15, ... QB điền tất cả vị trí còn lại. Fallback all-QB khi AI fail giữ nguyên.
- `CreateSessionDto`: `@Max(10)` → `@Max(45)`.
- `DURATION_OPTIONS` client: `numQuestions` 5/8/10 → 15/30/45.
- Seed `02-question-bank.ts`: +25 câu hr×VN + technical×VN (tổng: hr×VN ~30, technical×VN ~40) để đảm bảo đủ cho 90-min session (36 QB needed).

---

## Architectural Decisions (Active Reference)

- **SSE auth**: `?token=` query param — EventSource khong ho tro custom headers.
- **apiClient**: auto-attach Bearer via `getSession()` (Supabase cache) moi request.
- **NavLinks**: client component tach khoi server layout — server layout async, khong dung duoc hooks.
- **Test strategy**: services-first; controllers la thin delegation, cover sau khi coverage da du.
- **BullMQ error**: process() outer catch swallow + set status `'error'`; khong re-throw.
- **UserModule**: tach rieng khoi AuthModule — profile logic khong thuoc authentication.
- **Voice DTO**: `audioDurationSeconds`/`audioSizeBytes` la chuan server DTO, client adapt.
