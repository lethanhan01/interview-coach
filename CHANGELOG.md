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

---

## Architectural Decisions (Active Reference)

- **SSE auth**: `?token=` query param — EventSource khong ho tro custom headers.
- **apiClient**: auto-attach Bearer via `getSession()` (Supabase cache) moi request.
- **NavLinks**: client component tach khoi server layout — server layout async, khong dung duoc hooks.
- **Test strategy**: services-first; controllers la thin delegation, cover sau khi coverage da du.
- **BullMQ error**: process() outer catch swallow + set status `'error'`; khong re-throw.
- **UserModule**: tach rieng khoi AuthModule — profile logic khong thuoc authentication.
- **Voice DTO**: `audioDurationSeconds`/`audioSizeBytes` la chuan server DTO, client adapt.
