# Project Log — InterviewAI

Phase milestones và implementation sessions trong một file duy nhất.

---

## Phase Milestones

| Phase | Trạng thái | Ngày |
|-------|-----------|------|
| Discovery | Hoàn thành | 2026-05-04 |
| Requirements Analysis | Hoàn thành | 2026-05-09 |
| Architectural Design | Hoàn thành | 2026-06-06 |
| Implementation | Đang tiến hành | — |

### Discovery — Completed 2026-05-04

- Outputs: docs/Discovery_Docs/Discovery_Document.md
- Key decisions:
  - Chọn Hướng A: AI Feedback Web App (loại Hướng B peer-to-peer, C human coach, D mobile-first)
  - Target audience: fresher CNTT 0–12 tháng kinh nghiệm tại Việt Nam (50.000–57.000/năm)
  - Pricing: Free for students — không paywall, không freemium trong scope đồ án
  - Differentiator: Surgical Feedback (highlight transcript) + Cultural Context Pack VN/Western
  - Tech feasibility confirmed: GPT-4o mini ($0.15/1M tokens), Whisper WER ~10% tiếng Việt
  - Out-of-scope V1: coding interview, live copilot, mobile native, multi-language (ngoài Vie/En), gamification, enterprise B2B
  - Success metrics: ≥50 users beta, ≥80% rating "cụ thể, hữu ích", activation rate ≥60%
- Open questions handed to Requirements Analysis:
  - A2: User có chấp nhận nói tiếng Việt với AI không? (validate bằng interview + pilot)
  - A3: Whisper có xử lý tốt accent Bắc/Nam không? (WER target ≥80%)
  - A4: LLM feedback tiếng Việt có đủ cụ thể và actionable không? (pilot 5 users + HR review)
  - A5: Retention — user có quay lại ≥2 phiên không? (beta test)

### Requirements Analysis — Completed 2026-05-09

- Started: 2026-05-06
- Entry criteria met:
  - [x] Problem statement được định nghĩa rõ (Discovery §8)
  - [x] Target users được xác định: fresher CNTT 0–12 tháng tại VN
  - [x] Competitive analysis hoàn thành: 5 đối thủ quốc tế phân tích đầy đủ
  - [x] Solution direction được chọn (Hướng A) với justification
  - [x] Success metrics định nghĩa và measurable (§11.1 Discovery)
  - [x] Assumptions logged (6 assumptions, §10.1 Discovery)
  - [x] Discovery Document v0.1 hoàn chỉnh
- Outputs:
  - SRS (docs/Design/) — sections complete
  - User stories (docs/Design/) — covered all SRS features
  - Glossary, Traceability matrix, Test plan outline
  - All requirements have MoSCoW priority and acceptance criteria
- Open questions deferred to design:
  - OQ-001: JD length threshold — SRS FR-001 nói "≥50 ký tự" nhưng cần validate với user
  - OQ-002: Context Pack switching — user có thể đổi VN↔Western trong cùng session hay chỉ lúc tạo?

### Architectural Design — Completed 2026-06-06

- Outputs:
  - docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md
  - docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md
  - docs/Design/ArchitecturalDesign/ADRs/ (ADR-001 to ADR-008)
  - docs/Design/DetailedDesign/database-design/ (9 files, 11 MVP tables)
  - docs/Design/DetailedDesign/api-design/ (6 files, 23 MVP endpoints)
  - docs/Design/DetailedDesign/uiux-design/ (4 files, 5 MVP routes)
  - docs/Design/DetailedDesign/lld/ (8 files, 5 NestJS modules)
- Key decisions:
  - NestJS-only backend, no FastAPI (ADR-005/D-01)
  - Supabase for auth + DB + storage (ADR-003)
  - OpenAI GPT-4o via npm SDK (ADR-004)
  - SSE + Redis Pub/Sub instead of WebSocket (ADR-006)
  - BullMQ 5-queue architecture, timeouts locked (ADR-007/D-07)
  - pgvector deferred to v2 (D-05)

### Implementation — In Progress

- Entry criteria: Architectural Design exit criteria met (all design docs complete)
- Target deliverables:
  - [ ] NestJS server — 5 modules, all endpoints
  - [ ] Next.js client — 5 MVP routes
  - [ ] BullMQ workers — 4 processors (RewriteEval v1.1)
  - [ ] Supabase migrations — 11 tables, RLS policies
  - [ ] Test coverage >= 80% (unit + integration)
  - [ ] E2E tests for UC-02/03/04/05/06

Sub-phase status:

| Phase | Trạng thái | Ghi chú |
|-------|------------|---------|
| Phase DB | Done | Prisma client generated, schema + raw SQL applied |
| Phase P0 | Done | Tất cả dependencies, env, AppModule |
| Phase P1 | Done | SseService, exceptions, middleware |
| Phase P2 | Done | JWT strategy, guards, refresh/logout |
| Phase P3 | Done | 5 processors, 3 pipelines, OpenAI gateway |
| Phase P4 | Done | Session CRUD, SSE stream |
| Phase P5 | Done | Turn submit, Whisper, voice metrics |
| Phase P6 | Done | Report endpoint, annotated transcript |
| Phase P7 | Done | Supabase auth, middleware, api-client |
| Phase P8 | Done | 5 pages, 8 components |
| Phase P8-FIX | Done | 7 bugs fixed, 4 ESLint resolved |
| Phase P9 | Not started | Unit + integration tests (80% coverage target) |

---

## Implementation Sessions

Ghi lại chi tiết từng session làm việc, thứ tự thời gian ngược.

---

## 2026-06-07 — UI/UX Review & Fix

**Branch:** `feat/mvp`
**Commits:** `afa9059`, `0fd612b`, `6bda5ba`

### Những gì đã hoàn thành

**Task 1 — Foundation: Font, Metadata, Lang** (`afa9059`)

- `client/app/globals.css`: Sửa `font-family: Arial, Helvetica, sans-serif` → `font-family: var(--font-sans), sans-serif`. Geist Sans (đã load qua `next/font/google`) giờ được áp dụng đúng.
- `client/app/layout.tsx`: Thay metadata placeholder "Create Next App" → title "InterviewAI — Luyện phỏng vấn với AI", description tiếng Việt.
- `client/app/layout.tsx`: Sửa `lang="en"` → `lang="vi"`.

**Task 2 — Shared Button Component** (`0fd612b`)

- `client/components/ui/Button.tsx` (mới): Component dùng chung với 3 variant (primary / secondary / ghost), prop `loading` tích hợp `LoadingSpinner`, `focus-visible:ring-2` cho keyboard navigation, `aria-disabled` đồng bộ với `disabled`.

**Task 3 — Login Page: Labels + Loading State** (`6bda5ba`)

- Thêm `<label htmlFor>` sr-only cho email và password inputs.
- Submit button: thay `'...'` bằng `<LoadingSpinner size="sm" />` + text "Đang xử lý...".
- Error paragraph: thêm `role="alert"`.

**Task 4 — Navbar: Active Link + Brand Name** (`6bda5ba`)

- `client/components/ui/NavLinks.tsx` (mới): Client component dùng `usePathname()` để detect active route, set `aria-current="page"`, active link có `font-semibold text-gray-900`.
- `client/app/(app)/layout.tsx`: Import `NavLinks`, xóa 3 `<Link>` inline, sửa brand "InterviewCoach" → "InterviewAI".

**Task 5 — Sessions Page: Visual Hierarchy** (`6bda5ba`)

- Thêm `SESSION_TYPE_LABELS`, `STATUS_LABELS`, `STATUS_CLASSES`, `formatDate()`.
- Session card: type label localize ("hr" → "HR / Behavioral"), status badge màu (pill, color-coded), context pack, ngày tạo, điểm tổng khi completed.
- CTA: từ text link → pill button.

**Task 6 — Setup Wizard: Step Labels** (`6bda5ba`)

- Thêm `STEP_LABELS: Record<Step, string>`.
- Step indicator: circles `h-8 w-8 font-semibold`, completed steps hiện checkmark SVG, label text bên dưới mỗi circle (visible trên `sm+`).

**Task 7 — Accessibility: Interview & Report Components** (`6bda5ba`)

- `TextAnswerInput.tsx`: `<label htmlFor>` sr-only + `id` + `aria-label` cho textarea.
- `VoiceRecorder.tsx`: `aria-label` cho start/stop buttons, `role="alert"` cho error, `aria-hidden="true"` cho pulse indicator.
- `CompetencyScoreChart.tsx`: Bar fill div có `role="progressbar"`, `aria-valuenow/min/max`, `aria-label` mô tả dimension và score.

### Trạng thái (sau UI/UX review)

| Phần | Trạng thái | Ghi chú |
|------|------------|---------|
| `client/app/globals.css` | Done | Font đúng |
| `client/app/layout.tsx` | Done | Metadata + lang đúng |
| `client/components/ui/Button.tsx` | Done | Chưa dùng rộng rãi — component sẵn sàng |
| `client/app/(auth)/login/page.tsx` | Done | Labels + loading + role=alert |
| `client/components/ui/NavLinks.tsx` | Done | Active detection hoạt động |
| `client/app/(app)/layout.tsx` | Done | Brand + NavLinks |
| `client/app/(app)/sessions/page.tsx` | Done | Visual hierarchy đầy đủ |
| `client/app/(app)/setup/page.tsx` | Done | Step labels + checkmark |
| `client/components/interview/TextAnswerInput.tsx` | Done | WCAG AA |
| `client/components/interview/VoiceRecorder.tsx` | Done | WCAG AA |
| `client/components/report/CompetencyScoreChart.tsx` | Done | WCAG AA |
| E2E tests | Chưa làm | Chưa có test cho bất kỳ UI flow nào |
| Button adoption | Chưa làm | Button.tsx sẵn sàng, chưa replace inline buttons |

### Bước tiếp theo (UI/UX follow-up)

1. **Tích hợp `Button.tsx`** — `setup/page.tsx`, `sessions/[id]/page.tsx`, `report/page.tsx`.
2. **E2E tests** — Login flow, Setup wizard, Sessions list, Interview turn submission.
3. **VoiceRecorder: `getUserMedia` error handling** — `startRecording()` thiếu try/catch.
4. **Setup wizard: JD textarea thiếu label** — `setup/page.tsx:106`.
5. **Responsive kiểm tra thực tế** — Step labels (`hidden sm:block`) chưa verify mobile.

### Quyết định quan trọng

**NavLinks tách ra client component:** `AppLayout` là async server component — không thể dùng hooks. Tách `NavLinks.tsx` với `'use client'`; server layout giữ auth logic, client component giữ active state.

**`STEP_LABELS` typed `Record<Step, string>`:** Exhaustive coverage tại compile time — TypeScript báo lỗi nếu thêm step mà không update labels.

**`SESSION_TYPE_LABELS` và `STATUS_LABELS` local:** YAGNI — extract khi page thứ hai cần dùng.

**`Button.tsx` chưa replace toàn bộ inline buttons:** Scope là "fix issues". Replace toàn bộ mở rộng diff và tăng risk. Adopt dần theo từng page.

---

## 2026-06-06 — MVP Implementation P0→P8 + P8-FIX audit

### Hoàn thành

**Phase DB — Database Setup**
- Fix `datasource db` block trong `server/prisma/schema.prisma`
- Generate Prisma client vào `server/generated/prisma/`
- Apply schema lên Supabase qua `prisma db push`
- Apply raw SQL: triggers_auth_sync.sql → rls_policies.sql → indexes_partial.sql → seed_context_packs.sql

**Phase P0 — Foundation**
- Server dependencies: `@nestjs/config`, `@nestjs/passport`, `@nestjs/bullmq`, `passport-jwt`, `ioredis`, `bullmq`, `@supabase/supabase-js`, `openai`, `zod`, `class-validator`, `prisma`
- Client dependencies: `@supabase/supabase-js`, `@supabase/ssr`
- `main.ts`: global prefix `/api/v1`, ValidationPipe, CORS, cookieParser
- `app.module.ts`: ConfigModule global, ThrottlerModule, BullModule, PrismaModule
- `PrismaModule` + `PrismaService`

**Phase P1 — Common Infrastructure**
- `common/constants/queue.constants.ts` — 5 queue names
- `common/exceptions/` — ErrorCode enum, InterviewAIException, global filter
- `common/middleware/request-id.middleware.ts` — X-Request-ID header
- `common/services/sse.service.ts` — Redis pub/sub, `emit()` + `subscribe(): Observable`

**Phase P2 — AuthModule**
- `auth/strategies/jwt.strategy.ts` — Supabase Bearer JWT, HS256
- `auth/guards/jwt-auth.guard.ts`, `refresh.guard.ts`
- `auth/auth.service.ts` — `refreshToken()` + `logout()`
- `auth/auth.controller.ts` — `POST /auth/refresh`, `POST /auth/logout`

**Phase P3 — AIModule**
- `ai/openai.gateway.ts` — `chatCompletion()` + `transcribe()`
- `ai/prompt-builder.service.ts` — 3-layer prompt, XML tag wrapping
- 3 pipeline strategies: `hr`, `technical`, `mixed`
- `ai/pipelines/pipeline-strategy.factory.ts`
- 5 BullMQ processors: question-generation (15s), follow-up (8s), feedback (15s), comprehensive-report (30s), rewrite-eval (stub)

**Phase P4 — SessionModule**
- `POST /sessions`, `GET /:id`, `GET /:id/status`, `PATCH /:id/status`, `SSE /:id/events`
- `QuestionComposerService`, `AntiRepeatService`, `SessionPlanValidator`

**Phase P5 — TurnModule**
- `POST /sessions/:id/turns` — text + voice modes
- `WhisperService`, `VoiceMetricsService`, `FollowUpCoordinatorService`

**Phase P6 — ReportModule**
- `GET /sessions/:id/report`
- `buildAnnotatedTranscript()`, `ComprehensiveReportBuilder.score()`

**Phase P7 — Client Foundation**
- `client/lib/supabase.ts`, `api-client.ts`, `types.ts`
- `client/middleware.ts` — protect `(app)/*`
- Login page, OAuth callback, protected layout

**Phase P8 — Client Pages**
- 5 pages: setup wizard, interview, report, profile, sessions list
- 8 components: QuestionCard, TextAnswerInput, VoiceRecorder, CompetencyScoreChart, ActionPlanCard, AnnotatedTranscript, LoadingSpinner, ErrorBoundary

### P8-FIX Audit

| # | Bug | File | Mức độ |
|---|-----|------|--------|
| 1 | `apiClient` không auto-attach auth token | `client/lib/api-client.ts` | BLOCKING |
| 2 | SSE dùng `EventSource` không gửi `Authorization` header | `session.controller.ts` + `page.tsx:59` | BLOCKING |
| 3 | `GET /sessions/:id/questions` endpoint không tồn tại | `session.controller.ts`, `session.service.ts` | BLOCKING |
| 4 | `GET /sessions` (list) endpoint không tồn tại | `session.controller.ts`, `session.service.ts` | BLOCKING |
| 5 | Không có UserModule — `GET/PATCH /profile` sẽ 404 | Cần tạo `server/src/user/` | BLOCKING |
| 6 | Client gửi `durationSeconds`/`sizeBytes`, DTO expect `audioDurationSeconds`/`audioSizeBytes` | `page.tsx:95-101` | BLOCKING |
| 7 | Fetch questions ngay sau redirect — BullMQ cần 15s | `page.tsx init()` | HIGH |
| E1-E4 | 4 ESLint errors | 4 server files | MEDIUM |

### Quyết định quan trọng

**SSE auth dùng query param token:** `SseTokenGuard` đọc `req.query.token`, verify JWT. Client truyền `?token=${accessToken}` trong EventSource URL.

**apiClient auto-token:** `request()` tự gọi `getSession()` và attach Bearer. 1 extra call per request — chấp nhận được vì Supabase cache.

**UserModule tách riêng khỏi AuthModule:** Profile logic không thuộc authentication.

**Voice field name là server DTO chuẩn:** `audioDurationSeconds`/`audioSizeBytes` match DB column. Client đổi, không phải server.
