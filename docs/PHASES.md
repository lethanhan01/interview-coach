# Phase Log

This file tracks phase transitions and handoff artifacts.

## Phase: Discovery
- Status: Completed 2026-05-04
- Outputs: docs/Discovery_Docs/Discovery_Document.md
- Key decisions:
  - Chọn Hướng A: AI Feedback Web App (loại Hướng B peer-to-peer, C human coach, D mobile-first)
  - Target audience: fresher CNTT 0–12 tháng kinh nghiệm tại Việt Nam (50.000–57.000/năm)
  - Pricing: Free for students — không paywall, không freemium trong scope đồ án
  - Differentiator: Surgical Feedback (highlight transcript) + Cultural Context Pack VN/Western
  - Tech feasibility confirmed: GPT-4o mini ($0.15/1M tokens), Whisper WER ~10% tiếng Việt
  - Out-of-scope V1: coding interview, live copilot, mobile native, multi-language (ngoài Vie/En), gamification, enterprise B2B
  - Success metrics: ≥50 users beta, ≥80% rating "cụ thể, hữu ích", activation rate ≥60%
- Open questions handed to next phase:
  - A2: User có chấp nhận nói tiếng Việt với AI không? (validate bằng interview + pilot)
  - A3: Whisper có xử lý tốt accent Bắc/Nam không? (WER target ≥80%)
  - A4: LLM feedback tiếng Việt có đủ cụ thể và actionable không? (pilot 5 users + HR review)
  - A5: Retention — user có quay lại ≥2 phiên không? (beta test)

## Phase: Requirements Analysis
- Status: Completed 2026-05-09
- Started: 2026-05-06
- Entry criteria met:
  - [x] Problem statement được định nghĩa rõ (Discovery §8)
  - [x] Target users được xác định: fresher CNTT 0–12 tháng tại VN
  - [x] Competitive analysis hoàn thành: 5 đối thủ quốc tế phân tích đầy đủ
  - [x] Solution direction được chọn (Hướng A) với justification
  - [x] Success metrics định nghĩa và measurable (§11.1 Discovery)
  - [x] Assumptions logged (6 assumptions, §10.1 Discovery)
  - [x] Discovery Document v0.1 hoàn chỉnh
- Target deliverables:
  - [ ] SRS (docs/srs.md) — sections complete
  - [ ] User stories (docs/user-stories/) — covered all SRS features
  - [ ] Glossary (docs/glossary.md)
  - [ ] Traceability matrix (docs/traceability-matrix.md)
  - [ ] Test plan outline (docs/test-plan/strategy.md)
  - [ ] All requirements have MoSCoW priority
  - [ ] All requirements have acceptance criteria
- Exit criteria:
  - [ ] Stakeholder review complete
  - [ ] No "vague language" findings open
  - [ ] Traceability: 100% of MUST requirements have ≥1 test scenario
  - [ ] Open questions resolved or explicitly deferred to design phase
- Open questions:
  - OQ-001: JD length threshold — SRS FR-001 nói "≥50 ký tự" nhưng cần validate với user liệu có đủ không
  - OQ-002: Context Pack switching — user có thể đổi VN↔Western trong cùng một session hay chỉ lúc tạo session?

## Phase: Architectural Design

- Status: Completed 2026-06-06
- Started: 2026-05-09
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

## Phase: Implementation (current)

- Status: Not started
- Entry criteria: Architectural Design exit criteria met (all design docs complete)
- Target deliverables:
  - [ ] NestJS server — 5 modules, all endpoints
  - [ ] Next.js client — 5 MVP routes
  - [ ] BullMQ workers — 4 processors (RewriteEval v1.1)
  - [ ] Supabase migrations — 11 tables, RLS policies
  - [ ] Test coverage >= 80% (unit + integration)
  - [ ] E2E tests for UC-02/03/04/05/06
