# Interview Coach

InterviewAI là ứng dụng web luyện phỏng vấn xin việc dành cho sinh viên năm cuối và fresher CNTT Việt Nam (0–12 tháng kinh nghiệm). Người dùng paste Job Description vào hệ thống, trả lời câu hỏi bằng giọng nói hoặc text, nhận follow-up contextual từ AI, và xem "Surgical Feedback" — phản hồi highlight từng đoạn cụ thể trong câu trả lời kèm gợi ý cải thiện. Hệ thống hỗ trợ hai Context Pack (VN / Western) với rubric chấm điểm phù hợp văn hóa, lấp đầy khoảng trống thị trường khi toàn bộ công cụ luyện phỏng vấn hiện có chỉ hỗ trợ tiếng Anh với giá $25–$148/tháng — ngoài tầm với của đa số sinh viên Việt Nam.

## Active Phase

**Current**: Architectural Design  
**Started**: 2026-05-09  
**Target completion**: TBD (sau khi hoàn thành SAD v1.1, HLD, ADRs, UI/UX, DB, API, LLD)

**Phase snapshot (2026-05-10):** Requirements Analysis chưa exit chính thức (US 16 stories Draft, TC chưa viết) — user quyết định chuyển sang Architectural Design trước. SAD v1.1 xong. ADR-001 đến ADR-005 xong. HLD v1.0 xong (929 dòng, 10 sections). Parallel phase (UI/UX + DB + API) hiện unblocked — đây là ưu tiên tiếp theo.

**Architecture decision (confirmed 2026-05-09):** NestJS only backend (không dùng FastAPI). Xem ADR-005.

In this phase, you act as a **Software Architect** and **Technical Lead**. You produce design documents, diagrams, and ADRs — not production code.

### Session Log

**2026-05-06** — Setup session:
- Created this file (CLAUDE.md) — project meta-guide and behavioral contract
- Created [docs/PHASES.md](docs/PHASES.md) — phase transition tracker with entry/exit criteria
- Created [.claude/rules/docs-general.md](.claude/rules/docs-general.md) — markdown conventions, ID schemes (FR/NFR/US/TC/ADR)
- Created [.claude/rules/srs-format.md](.claude/rules/srs-format.md) — FR/NFR format template, IEEE 830 structure
- Created [.claude/rules/user-stories.md](.claude/rules/user-stories.md) — US format, INVEST checklist
- Created [.claude/rules/test-plan.md](.claude/rules/test-plan.md) — test strategy structure, TC format
- Created [.claude/commands/qa-review.md](.claude/commands/qa-review.md) — `/qa-review` slash command: 6-dimension QA review with severity tagging

**2026-05-06** — Requirements Analysis session:
- Filled all [TODO] markers in [docs/PHASES.md](docs/PHASES.md) — Discovery key decisions (8 items), open questions (A2–A5), entry criteria (7 items checked), OQ-001/OQ-002
- `/srs-audit` SRS v1.6 — 4 blockers, 10 should-fix, 3 minor (vague NFRs, P-11..P-15 gap, MoSCoW missing, P-04 inconsistency)
- `/qa-review` [docs/SRS/SRS_InterviewAI_Full.md](docs/SRS/SRS_InterviewAI_Full.md) — 17 findings (5 Blocker / 9 Should-fix / 3 Minor): recommend FIX BEFORE NEXT PHASE
- `/qa-review` [docs/SRS/RTM_InterviewAI.md](docs/SRS/RTM_InterviewAI.md) — 12 findings (2 Blocker / 7 Should-fix / 3 Minor): AS-05/AS-06 untestable; 8 security NFRs unmapped
- Created [docs/user-stories/README.md](docs/user-stories/README.md) — template + INVEST checklist + persona table + index
- Created [docs/glossary.md](docs/glossary.md) — 20 terms từ SRS §1.3 + Discovery, A–W
- Created [docs/test-plan/strategy.md](docs/test-plan/strategy.md) — test scope, pyramid, environments, risks, entry/exit criteria

**2026-05-06** — Blocker Fix session (7/7 blockers resolved):
- **SRS [SRS-B1]**: Thêm `| Priority |` vào 8 NFR tables; thêm `**Priority:**` field vào 11 UC headers — MoSCoW đầy đủ toàn tài liệu
- **SRS [SRS-B2/B3]**: P-01 → `< 2s (p95)`; P-02 → `< 300ms (p95)`; P-04 → `≤ 5s (p95)` consistent với AC-04-2/E-04-3; P-05 → `[Removed]` — threshold consolidated vào AC-04-4
- **SRS [SRS-B4]**: Thêm 5 stub rows P-11..P-15 `[Removed]` để lấp gap
- **SRS [SRS-B5]**: S-12 → `"≤ 10 phiên/24h, attempt thứ 11 bị reject với error message rõ ràng"`
- **SRS [RTM-B1]**: Thêm AC-04-9 vào UC-04 (verify AS-05 — anti-discrimination questions); AC-05-7 vào UC-05 (verify AS-06 — anti-discrimination feedback)
- **RTM [RTM-B1]**: Cập nhật row "An toàn nội dung AI" — thêm AC-04-9, AC-05-7 vào AC column
- **RTM [RTM-B2]**: Map 8 security NFRs: S-04 → UC-04/05/06/07/08; S-07/S-10/S-11 → UC-04/05; S-12 → UC-03; S-14 → UC-02; S-05/S-06 → new cross-cutting row; xóa P-05 khỏi UC-04 NFR column (P-05 đã removed)

**2026-05-08** — Style audit + SRS icon fix:
- Created [docs/style-audit.md](docs/style-audit.md) — scanned 20 files (docs/**/*.md, CLAUDE.md, .claude/rules/**/*.md) against style rules in ~/.claude/CLAUDE.md; found 200+ icon violations across 7 files, 0 corporate phrases, 0 AI tells in any file
- Fixed all icon violations in [docs/SRS/SRS_InterviewAI_Full.md](docs/SRS/SRS_InterviewAI_Full.md) — 36 lines changed, 0 emoji remaining
  - Zone A (L691–L815): flag icons in table header, button icon prefixes, completion marks
  - Zone B (L975–L1196): wireframe color tokens → RED/YELLOW/GREEN; popup section labels kept in Vietnamese (Vấn đề / Gợi ý / Nên nói); delta icon references removed
- Remaining icon violations: Discovery_Document.md (~50), Discovery_Document_Template.md (~50), Checklist_Discovery.md (27) — fix when next touched; CLAUDE.md, PHASES.md, srs-format.md: fixed 2026-05-09

**2026-05-09** — SRS phase descriptions + TOC session:
- Thêm section 2.5.4 "Mô tả chi tiết từng phase" vào [docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md](docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md) — 9 phase entries (lines 473–795), mỗi phase có: Mục tiêu, Actors, Đầu vào, Đầu ra/Artifacts, Luồng xử lý, Quy tắc nghiệp vụ, Use Case(s); nội dung derived 100% từ UC-01 đến UC-13 đã có trong SRS, không fabricate
- Viết lại toàn bộ MỤC LỤC trong SRS (lines 31–95): từ 5 top-level entries → TOC đầy đủ 4 cấp: section 1–5, subsections 1.x / 2.x / 4.x, sub-subsections 1.x.x / 2.x.x / 2.5.x, phase entries (Phase 1–9) và UC entries (UC-01 đến UC-13, UC-09, UC-10); anchor links GFM-compliant

**2026-05-08** — BRD alignment session:

- Thay section 2.5 trong [docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md](docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md) bằng nội dung Business Requirements Document — 9-phase flowchart (Mermaid), bảng mapping BRD Phase → UC (11 rows)
- Cập nhật UC-02: thêm `target_role_category`, `target_level`, `preferred_tech_stack`; thêm placement test prompt (bước 11); AC-02-5, AC-02-6
- Cập nhật UC-03: thêm 9 trường mới (`jd_source`, `jd_url`, `session_type`, `difficulty`, `persona`, `mode`, `duration_min`, `language`, `show_prep_card`); mở rộng Main Flow thành 6 bước; E-03-4/E-03-5; AC-03-6 đến AC-03-10
- Cập nhật UC-04: thêm Giai đoạn 0 (Opening Phase), silence detection (15s), 5 follow-up trigger rules, graceful timeout (30s), Reverse Questions ref UC-12, Closing Phase với self-evaluation; AF-04-E/F; AC-04-10 đến AC-04-15
- Cập nhật UC-05: thêm 5 bước tổng hợp Comprehensive Report (Executive Summary, Comm Analysis, Competency Heatmap, Reverse Q Eval, Action Plan); AC-05-8 đến AC-05-11
- Cập nhật UC-06: thêm Executive Summary section, Comm Analysis, Competency Heatmap, Reverse Questions Evaluation, Action Plan vào Main Flow (bước 2, 13–16); AF-06-D/E; AC-06-6 đến AC-06-9
- Thêm UC-11 (Bài test định vị, COULD), UC-12 (Giai đoạn phỏng vấn ngược, SHOULD), UC-13 (Dashboard tiến trình, SHOULD) — mỗi UC có full header table, input data, Main Flow, AF, EF, AC
- Cập nhật biểu đồ 2.3 và 2.4.1: thêm UC-11/12/13 với đúng include/extend relations

**2026-05-09** — Icon fix + User Stories session:
- Fixed icon violations: CLAUDE.md (0 actual — violations đã removed qua prior session edits), PHASES.md (3 fixed), .claude/rules/srs-format.md (4 fixed: ❌/✅ → BAD:/GOOD:)
- Updated docs/style-audit.md: CLAUDE.md count corrected to 0, PHASES.md và srs-format.md marked fixed
- Created 13 User Story files (US-001 → US-013) tại docs/RequirementAnalysis/user-stories/
- Updated README.md index table: 13 rows, all Status=Draft
- UC-05 không có story riêng (backend-only; value captured bởi US-011 và US-012)
- INVEST flags: US-010 (Small concern — Beacon API), US-013 (Small concern — 2 phases); xem Notes trong từng file

**2026-05-09** — SRS scope cleanup + conflict resolution session:

- UC-06 bước 5 & 7: xóa ASCII art layout (22+20 dòng) → thay bằng bullet list các thành phần bắt buộc (header / annotated transcript / model answer / nút hành động; popup fields: severity label, vấn đề, gợi ý, nên nói)
- UC-07 Giai đoạn 4 bước 11: xóa ASCII art layout so sánh 2 cột (16 dòng) → thay bằng bullet list (cột trái, cột phải, delta score badge); bước 12 (Delta Score badge states) giữ nguyên
- Audit Section 2.5 đối chiếu toàn bộ UC-01 đến UC-13: phát hiện 2 xung đột thực sự, 6 điểm khác mức độ chi tiết (không phải conflict)
- Fix conflict #1 (Section 2.5.4 Phase 4 line 634): câu tự giới thiệu cố định đồng bộ với UC-04 canonical — `"Em hãy tự giới thiệu về bản thân và lý do em ứng tuyển vào vị trí này tại [Tên công ty]."`
- Fix conflict #2 (Section 2.5.3 bảng mapping): thêm row `Sau Phase 8 — Rewrite & Compare (tùy chọn)` → UC-07; bảng nay đủ 13 UC

**2026-05-09** — US coverage + RTM + SRS should-fix session:
- Created US-014 (UC-11 Placement Test, COULD), US-015 (UC-12 Reverse Questions, SHOULD), US-016 (UC-13 Dashboard, SHOULD) tại [docs/RequirementAnalysis/user-stories/](docs/RequirementAnalysis/user-stories/)
- Updated README.md index: 16 rows (US-001 → US-016)
- INVEST Small flag: US-016 (cover 4 sub-features — có thể tách US-016a/016b khi sprint planning)
- Updated [docs/RequirementAnalysis/SRS/RTM_InterviewAI.md](docs/RequirementAnalysis/SRS/RTM_InterviewAI.md): thêm cột `User Stories` vào §1, điền US-IDs cho tất cả 10 UC rows; thêm 3 rows mới UC-11/12/13; thêm 2 notes vào §3 (UC-09/10 Discovery note + TC column reminder)
- Fixed 7 SRS should-fix NFRs (U-01, U-12, S-11, S-13, AS-04, Q-03, Q-07): thêm measurable criterion vào mỗi Yêu cầu cell — SRS now 0 named should-fix remaining

**2026-05-09** — Architectural Design initiation session:
- Lên kế hoạch design phase (plan file tại `.claude/plans/`): SAD audit → HLD → Parallel (UI/UX + DB + API) → LLD
- Tạo [.claude/plans/technical-analysis.md](.claude/plans/technical-analysis.md) — NestJS vs FastAPI analysis + SAD vs SRS conflict matrix (0 conflicts found, 8 gaps trong SAD được liệt kê)
- Quyết định kiến trúc: **NestJS only** (bỏ FastAPI service riêng) — lý do: OpenAI API-only scope, không cần Python ecosystem, giảm deployment complexity cho prototype
- Updated [docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md](docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md) → v1.1:
  - Section 1.1: NestJS-only architecture, C4 Context diagram (Mermaid), C4 Container diagram (Mermaid), Sequence diagram UC-04
  - Section 1.2: Tech stack bỏ FastAPI/Python/LangChain/pdfplumber; thêm openai SDK + pdf-parse (npm)
  - Section 1.3: Update rationale cho NestJS (AI pipeline)
  - Section 2.2.6, 2.3.2, 2.3.3, 2.4.2, 2.4.3: Python code → TypeScript/Zod
  - Section 5.1: Repo structure update (single backend/ directory)
  - Section 6 (mới): Kiến trúc Bảo mật — S-11/S-12/S-13 enforcement, JWT lifecycle, Supabase RLS policies
  - Section 7 (mới): Ràng buộc Nghiệp vụ & SLO — P-01/P-02/P-04 latency, P-16→P-21 content limits
- Created [docs/Design/ArchitecturalDesign/ADRs/ADR-001_nextjs-app-router.md](docs/Design/ArchitecturalDesign/ADRs/ADR-001_nextjs-app-router.md)
- TODO còn lại: ADR-002 đến ADR-005, HLD, UI/UX Design, Database Design, API Design, LLD

**2026-05-10** — ADRs + HLD session:
- Git cleanup: stage rename `docs/interview_ai_coach_session_type_spec.md` → `docs/Design/ArchitecturalDesign/interview_ai_coach_session_type_spec.md` (intentional move, git detect 100% rename); commit staged CLAUDE.MD + SAD changes + ADR-001
- Created [docs/Design/ArchitecturalDesign/ADRs/ADR-002_nestjs-backend-framework.md](docs/Design/ArchitecturalDesign/ADRs/ADR-002_nestjs-backend-framework.md) — NestJS vs Express vs Fastify; Decision: NestJS (Guards/DI/Module system cho AI pipeline)
- Created [docs/Design/ArchitecturalDesign/ADRs/ADR-003_supabase-database-auth.md](docs/Design/ArchitecturalDesign/ADRs/ADR-003_supabase-database-auth.md) — Supabase vs self-hosted; Decision: Supabase (Auth + RLS out of box, 1-day setup)
- Created [docs/Design/ArchitecturalDesign/ADRs/ADR-004_openai-gpt4o-ai-model.md](docs/Design/ArchitecturalDesign/ADRs/ADR-004_openai-gpt4o-ai-model.md) — OpenAI vs Gemini vs Claude vs local; Decision: GPT-4o (JSON mode, Vietnamese quality, openai npm SDK)
- Created [docs/Design/ArchitecturalDesign/ADRs/ADR-005_nestjs-only-ai-pipeline.md](docs/Design/ArchitecturalDesign/ADRs/ADR-005_nestjs-only-ai-pipeline.md) — FastAPI vs NestJS-only; Decision: NestJS-only (orchestration logic, không cần Python libs, 1 Dockerfile)
- Created [docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md](docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md) — 929 dòng, 10 sections: component inventory (6 NestJS modules + 11 Next.js routes + infra), 5 data flows (Auth/SessionSetup/InterviewTurn/ReportGen/Rewrite), UC×Component mapping, 5 cross-cutting concerns (rate limit/Bull Queue/SSE/error handling/validation), AI pipeline architecture (3-layer prompt/4 prompts/3 pipelines/trigger evaluation), ~35 API endpoints inventory, security mapping, SLO-component mapping, appendix với 4 open questions cho LLD

## Phase Roadmap

| Phase | Status | Key Deliverables | Location |
|-------|--------|------------------|----------|
| Discovery | Done | Problem statement, stakeholders | docs/Discovery_Docs/ |
| Requirements Analysis | In-transition (US Draft, TC pending) | SRS, user stories, glossary, RTM, test plan outline | docs/RequirementAnalysis/ |
| Architectural Design | Active | SAD v1.1, HLD, ADRs | docs/Design/ArchitecturalDesign/ |
| Detailed Design | Active (parallel với AD) | DB Design, API Design, UI/UX Design, LLD | docs/Design/DetailedDesign/, docs/Design/UIUXDesign/ |
| Database Design | Planned | Schema, ERD, RLS strategy | docs/Design/DetailedDesign/database_design.md |
| UI/UX Design | Planned | User flows, wireframes, design system | docs/Design/UIUXDesign/ |
| Implementation | Planned | Code | apps/ |
| Integration | Planned | Integration tests, deployment config | apps/, infra/ |
| V&V / Testing | Planned | E2E tests, test reports | tests/, docs/test-reports/ |

Phase transition log: see docs/PHASES.md

## Rules Index

Rules chi tiết: @.claude/rules/testing.md, @.claude/rules/api.md, @.claude/rules/db.md, @.claude/rules/security.md

_(ui.md chưa tạo — client/ chưa có FE. Tạo khi bắt đầu UI/UX phase.)_

## Available Personas (Slash Commands)

- `/ba-interview <topic>` — Conduct structured BA interview to elicit requirements
- `/qa-review <file>` — QA review across 6 dimensions: testability, completeness, ambiguity, consistency, traceability, priority & scope. Output: Blocker / Should-fix / Minor findings + recommendation (BLOCK / FIX BEFORE NEXT PHASE / OK)
- `/srs-audit` — Audit current SRS against IEEE 830 / quality criteria
- `/wrap-phase <phase>` — Generate phase output summary, prepare handoff to next phase

## Documentation Map

| Doc | Status | Chất lượng | Path |
|-----|--------|-----------|------|
| Discovery Document | Done | Chưa audit | docs/Discovery_Docs/Discovery_Document.md |
| Discovery Checklist | Done | Chưa audit | docs/Discovery_Docs/Checklist_Discovery.md |
| SRS (full) | Updated — scope-clean, 2.5 conflicts resolved, 7 NFR should-fix done | 0 Blocker, 0 named should-fix remaining — U-01/U-12/S-11/S-13/AS-04/Q-03/Q-07 đã thêm measurable criterion | docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md |
| SRS Checklist | Done | Chưa audit | docs/SRS/Checklist_SRS.md |
| Requirements Traceability Matrix | Updated — User Stories column added, UC-11/12/13 rows added | 0 Blocker — cột User Stories đầy đủ; §3 có note UC-09/10 + TC reminder | docs/RequirementAnalysis/SRS/RTM_InterviewAI.md |
| Software Architecture Document | Updated → v1.1 | NestJS-only arch, C4 diagrams, Security §6, Business Constraints §7, TypeScript validators | docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md |
| Architecture Decision Records | Done — ADR-001→005 Accepted | ADR-001: Next.js App Router; ADR-002: NestJS; ADR-003: Supabase; ADR-004: GPT-4o; ADR-005: NestJS-only pipeline | docs/Design/ArchitecturalDesign/ADRs/ |
| High-Level Design | Done — v1.0, 929 dòng | 10 sections: 6 NestJS modules, 11 Next.js routes, 5 data flows (Mermaid), UC×Component mapping, 5 cross-cutting concerns, AI pipeline architecture, ~35 endpoints, 4 open questions cho LLD | docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md |
| UI/UX Design | Pending | Chưa tạo | docs/Design/UIUXDesign/UIUX_InterviewAI_v1.0.md |
| Database Design | Pending | Chưa fill | docs/Design/DetailedDesign/database_design.md |
| API Design (Detailed) | Pending | Chưa tạo | docs/Design/DetailedDesign/API_spec.md |
| Low-Level Design | Pending | Chưa tạo | docs/Design/DetailedDesign/LLD_InterviewAI_v1.0.md |
| Technical Analysis | Done | NestJS vs FastAPI + SAD vs SRS conflict matrix | .claude/plans/technical-analysis.md |
| Glossary | Done | Chưa audit | docs/glossary.md |
| User Stories | 16 stories — Draft | US-001→US-016; UC-01/03/03b/04/06/07/11/12/13 covered; INVEST flagged: US-010 (Small), US-013 (Small), US-016 (Small); UC-02/08 chưa có story; UC-05 không có story (backend-only) | docs/RequirementAnalysis/user-stories/ |
| Test Plan (strategy) | Done | Chưa audit | docs/test-plan/strategy.md |
| Phase Transition Log | Done | Đã fill hết TODO | docs/PHASES.md |
| Style Audit Report | Done | SRS fixed; PHASES.md + srs-format.md fixed; 3 files pending (Discovery docs — fix khi next touched) | docs/style-audit.md |

## Next Steps

> **Thứ tự bắt buộc (Architectural Design):** ADRs → HLD → Parallel (UI/UX + DB + API) → LLD.
> **Trạng thái hiện tại (2026-05-10):** SAD v1.1 xong. ADR-001→005 xong. HLD v1.0 xong. Parallel phase hiện unblocked.

### Làm ngay (MUST)

**[1] ADR-001→005** — DONE (committed 2026-05-09/10)

**[2] HLD** — DONE (committed 2026-05-10): [HLD_InterviewAI_v1.0.md](docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md)

**[3] Parallel: UI/UX + Database Design + API Design** — UNBLOCKED, ưu tiên hiện tại:

- [docs/Design/UIUXDesign/UIUX_InterviewAI_v1.0.md](docs/Design/UIUXDesign/UIUX_InterviewAI_v1.0.md) — sitemap, user flows (UC-01/03/04/06/07/12/13), screen inventory (11 routes), design system tokens
- [docs/Design/DetailedDesign/database_design.md](docs/Design/DetailedDesign/database_design.md) — ER diagram, DDL (~13 bảng từ HLD §2), RLS policies, indexes. Cần resolve open question pgvector scope trước khi viết schema (xem HLD §10.3 OQ-4)
- [docs/Design/DetailedDesign/API_spec.md](docs/Design/DetailedDesign/API_spec.md) — full request/response schema cho ~35 endpoints từ HLD §7, DTOs, error codes, rate limit headers

**[4] LLD** — sau khi cả 3 parallel docs confirm:

- File: [docs/Design/DetailedDesign/LLD_InterviewAI_v1.0.md](docs/Design/DetailedDesign/LLD_InterviewAI_v1.0.md)
- Nội dung: NestJS module/service breakdown, Next.js page/component detail, key algorithms (silence detection, annotation render, trigger evaluation), error handling detail
- Cần resolve 3 open questions từ HLD §10.3 trước khi viết: SSE sticky session trên Railway, Bull vs BullMQ, polling vs SSE pattern nhất quán

### Làm khi next touched (LOW)

**[5] Icon violations — files còn lại** (dựa trên [docs/style-audit.md](docs/style-audit.md)):
- docs/Discovery_Docs/Checklist_Discovery.md: 27 violations — fix khi next touched
- docs/Discovery_Docs/Discovery_Document.md: ~50 violations — fix khi next touched
- docs/Discovery_Docs/Discovery_Document_Template.md: ~50 violations — fix khi next touched

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| SAD already exists (docs/SAD/) | Covers tech stack, AI pipeline, prompt engineering in depth. Don't duplicate in SRS — cross-reference instead. |
| SRS v1.6 uses custom format (UC-based, not FR-XXX) | SRS predates the FR-XXX rule. UC format đủ cho prototype scope. Reformatting dần — new/changed requirements dùng FR-XXX, existing không buộc phải đổi ngay. |
| database_design.md and API_spec.md are empty | Intentionally left for Detailed Design phase. Don't fill during Requirements Analysis — requirements drive design, not the reverse. |
| Rules in .claude/rules/ (not CLAUDE.md) | Scoped rules by file path are more targeted than one monolithic instruction file. CLAUDE.md stays as project context; rules files stay as format enforcement. |
| Audit SRS trước khi viết User Stories | US phải reference FR/UC cụ thể. Nếu UC còn lỗi format hoặc thiếu AC, US viết ra sẽ phải sửa lại — tốn công gấp đôi. Sequence đúng: fix SRS → US → TC. |
| Performance threshold sống trong UC ACs, không nhất thiết duplicate vào NFR | AC-04-2 (≤5s), AC-05-1 (≤8s), AC-06-1 (≤500ms) đã có số cụ thể. NFR P-01/P-02/P-05 vague là blocker cần fix — chọn 1 trong 2: backfill số vào NFR hoặc xóa NFR và để ACs là nguồn sự thật duy nhất. Tránh duplicate số ở 2 chỗ gây inconsistency. |
| TC chưa viết — intentionally deferred | SRS blockers đã fix. TC sẽ được viết sau khi US được ký off — viết TC khi US chưa ổn định vẫn gây double-rework. |
| AS-05/AS-06 là blocker thực sự | Hai safety requirements không có AC nào verify — gap nghiêm trọng nhất vì liên quan AI bias và discrimination. Đã fix: AC-04-9 (test 20 JDs, 0 câu hỏi phân biệt) và AC-05-7 (test 20 transcripts, 0 feedback phân biệt). |
| P-01/P-02 threshold: < 2s / < 300ms | Không có AC backup cho P-01/P-02 → phải backfill số vào NFR (không thể xóa NFR). Dùng standard web perf benchmarks: 2s page load (p95), 300ms CRUD (p95). Điều chỉnh khi có dữ liệu benchmark thực từ staging. |
| P-05 xóa khỏi SRS | Threshold của P-05 đã được cover bởi AC-04-4 (toàn bộ Phase 3+4 ≤ 12s). Duplicate threshold ở 2 chỗ gây risk inconsistency. Xóa NFR, giữ AC làm single source of truth. |
| S-12 threshold: 10 phiên/24h | Prototype cần limit để ngăn lạm dụng API cost. 10 sessions/24h = đủ cho 1–2 buổi luyện tập nghiêm túc/ngày mà không abuse. Có thể nâng khi cần qua config. |
| Style: color tokens trong SRS wireframe dùng RED/YELLOW/GREEN, không phải severity labels | Các màu trong wireframe mang nghĩa UI color (good/warning/critical), không phải severity status. Generic mapping không áp dụng được cho context này — dùng riêng cho status markers (CLAUDE.md, PHASES.md). |
| Style: popup labels trong SRS giữ tiếng Việt | Doc viết bằng tiếng Việt. Đổi "Vấn đề:" → "Issue:" sẽ không nhất quán với phần còn lại. Chỉ xóa icon prefix, giữ nguyên label gốc. |
| Style: box-drawing chars (┌ ┐ └ ┘ │) trong ASCII diagram không phải violation | Các ký tự này phục vụ mục đích cấu trúc (diagram), không phải decoration. Rule "no decorative symbols" không áp dụng. Giữ nguyên trong SAD và test-plan. |
| Section 2.5.4 chèn vào chương 2, không tạo chương riêng | Mô tả quy trình nghiệp vụ thuộc phạm vi "tổng quan hệ thống" (chương 2). Tạo chương 6 mới sẽ phá vỡ cấu trúc IEEE 830 và làm lệch số chương các tài liệu cross-reference. |
| MỤC LỤC viết lại đầy đủ 4 cấp (xuống đến ####) | TOC cũ chỉ có 5 top-level entries, bỏ sót 30+ subsections. TOC mới cover 1.x.x, 2.x.x, Phase 1–9, UC-01 đến UC-13. Anchor links theo GFM convention (lowercase, loại bỏ ký tự đặc biệt, space → hyphen). |
| ASCII art layout trong UC descriptions → field list | Chi tiết rendering giao diện thuộc giai đoạn UI/UX Design, không phải Requirements Analysis. Đưa ASCII art vào SRS tạo risk xung đột khi UI/UX được thiết kế thực tế. Field list (thành phần bắt buộc + tên field schema) đủ để spec behavior và viết AC. |
| Canonical cho câu tự giới thiệu là UC-04 | UC là spec chi tiết — nguồn sự thật. Section 2.5 là business overview — phải sync theo UC, không ngược lại. Khi hai nguồn mâu thuẫn, fix ở overview để khớp với spec. |
| UC-07 đặt ở "Sau Phase 8" trong bảng mapping 2.5.3 | UC-07 là optional loop triggered từ Phase 8 — không phải phase độc lập, không có số thứ tự phase trong BRD. Nhãn "Sau Phase 8 — Rewrite & Compare (tùy chọn)" phản ánh đúng vị trí trong flowchart (sau RewriteDecision node) mà không phá vỡ numbering scheme của 9 phases. |
| UC-05 không có User Story riêng | UC-05 là backend-only process (trigger tự động sau UC-04, không có Candidate interaction). Viết story cho UC-05 sẽ vi phạm quy tắc "đừng viết technical task là user story". Value của UC-05 được capture đầy đủ bởi US-011 (annotated transcript) và US-012 (comprehensive report). |
| User Stories đặt tại docs/RequirementAnalysis/user-stories/ | Đây là path thực tế của thư mục (agent confirm khi đọc README). Các references cũ trong session log 2026-05-06 dùng docs/user-stories/ là path template chưa chính xác — không cần sửa trong session log (historical), nhưng mọi reference mới phải dùng path đúng. |
| US-010 và US-013 có INVEST Small flag | US-010 (session resilience): Beacon API + server-side timeout là non-trivial — có thể tách thành 2 tickets nếu cần. US-013 (rewrite & compare): cover 2 phases (submit + compare) — có thể tách US-013a/013b. Để nguyên là 1 story cho requirements clarity; tách khi sprint planning nếu cần. |
| US-016 có INVEST Small flag | US-016 (progress dashboard): cover 4 sub-features (chart, streak, recommendation, replay) — có thể tách US-016a (chart + streak) và US-016b (recommendation + replay). Cùng pattern với US-013; giữ nguyên 1 story cho requirements clarity. |
| S-11 threshold: 60 requests/phút per user | 1 req/sec là ceiling tự nhiên cho 1 user dùng bình thường trong interview session (mỗi turn = 1 AI call). Threshold này ngăn abuse loop (bot gọi liên tục) mà không block legitimate use. Điều chỉnh khi có monitoring data thực từ staging. |
| S-13 threshold: 5 failed OAuth redirects / 10 phút → block 15 phút | Google OAuth tự handle password retry — S-13 nhắm vào bot redirect loop. 5 failures trong 10 phút là bất thường với human user; 15 phút block đủ để dừng automated abuse mà không lock out người dùng thật quá lâu. Standard pattern cho OAuth abuse prevention. |
| Usability thresholds: SUS ≥ 70, task completion ≥ 80%, Q-03 ≥ 80% rating ≥ 4 | SUS 70 = "Good" trên industry scale (Bangor et al. 2008); 80% task completion là standard threshold cho usability testing prototype. Các số này cho phép fail fast nếu UX quá phức tạp — không cần đạt SUS 90 cho prototype scope. |
| NestJS only (không dùng FastAPI) | SRS không có requirement nào đòi local LLM inference hoặc Python-specific ML library. openai npm SDK đủ để gọi OpenAI API với full TypeScript types. pdf-parse (Node.js) đủ cho CV text extraction. Dùng 1 service thay vì 2 giảm: 1 Dockerfile, 1 deployment pipeline, 0 inter-service HTTP overhead (~10–30ms per AI call). Điều kiện để revise: nếu cần local inference (llama.cpp/vLLM) hoặc Python-only libs (pdfplumber, sentence-transformers) → tách AIModule ra FastAPI microservice khi đó. Xem ADR-005. |
| Session type spec đặt tại docs/Design/ArchitecturalDesign/ | File đặc tả 3 loại session (HR/Technical/Mixed) là input trực tiếp cho thiết kế AI pipeline — thuộc Architectural Design, không phải Requirements Analysis. Move từ docs/ root sang docs/Design/ArchitecturalDesign/ để gần với HLD và ADR-005 là các tài liệu reference nó. Git rename 100% similarity, history preserved. |
| SSE thay vì WebSocket cho real-time events | HLD có 5 event types (session.status, turn.follow_up, turn.feedback_ready, report.ready, rewrite.done) — tất cả đều server→client unidirectional. SSE đủ, đơn giản hơn WebSocket, NestJS hỗ trợ native qua @Sse() decorator + Observable. WebSocket cần socket.io và stateful connection — không justify cho use case này. Open question: SSE cần sticky session trên Railway load balancer — resolve khi viết LLD. |
| 3 AI pipeline là Strategy pattern riêng biệt, không phải 1 pipeline với flag | HR/Technical/Mixed có trigger set, rubric, sequencing logic khác nhau đáng kể (xem session type spec §5.6). 1 pipeline với flag gây branching phức tạp, khó test, dễ regression khi thêm session type mới. Strategy pattern: thêm session type mới = thêm 1 class implement PipelineStrategy interface, không sửa code hiện tại. |
| 5 Bull jobs tách riêng với timeout + fallback khác nhau | QuestionGenerationJob (15s, retry 1, fallback seed), FollowUpJob (8s, 0 retry, fallback skip), FeedbackJob (15s, retry 1, fallback text), RewriteEvalJob (15s, 0 retry, fallback no comparison), ComprehensiveReportJob (30s, retry 1, fallback partial report). Timeout khác nhau vì SLO khác nhau; retry 0 cho FollowUp và Rewrite vì fallback an toàn hơn retry (tránh double-charge OpenAI). |
| 4 open questions từ HLD defer sang LLD | (1) SSE sticky session trên Railway — cần check Railway docs trước khi implement; (2) Bull vs BullMQ upgrade — BullMQ TypeScript support tốt hơn nhưng cần migration effort; (3) polling vs SSE nhất quán — hiện tại Session Setup dùng polling, các flow khác dùng SSE; (4) pgvector scope — SAD mention text-embedding-3-small nhưng không có UC nào explicit cần semantic search. Không resolve sớm để không over-engineer schema. |

## Behavioral Guidelines (Documentation Mode)

### 1. Don't Solution, Surface
- This phase is about WHAT and WHY, not HOW.
- If user asks for a solution, ask: "What problem are we solving? What does success look like?"
- Document the need, not the implementation.

### 2. Probe Vague Language
- Words to challenge: "fast", "user-friendly", "intuitive", "scalable", "secure", "just", "simply", "easy"
- Replace with measurable criteria. "Fast" → "p95 response < 800ms".
- If a stakeholder uses vague language, surface it for clarification.

### 3. Every Requirement Must Be Testable
- For each requirement, the test is: "How would I verify this in QA?"
- If you can't write an acceptance criterion, the requirement isn't ready.
- Non-functional requirements need measurable thresholds.

### 4. Surface Assumptions and Conflicts
- State assumptions explicitly in docs (use "Assumption:" prefix).
- When two requirements conflict, flag it — don't silently resolve.
- When a requirement implies others (dependencies), make them explicit.

### 5. Distinguish Need vs Want vs Wish
- Use MoSCoW (Must / Should / Could / Won't) for every functional requirement.
- "Must" = MVP can't ship without it.
- Don't let scope creep into "Must" silently.

### 6. Traceability Discipline
- Every requirement has: ID, source (stakeholder/discovery/regulation), priority, status, related test cases.
- Update docs/traceability-matrix.md when adding/changing requirements.

### 7. Don't Fabricate
- Don't invent stakeholders, regulations, user types, or metrics.
- If discovery doesn't say it, ask before adding it.
- "I assume users want X" is fine. "Users want X" without source is not.

### 8. Surgical Edits to Docs
- Don't restructure existing docs uninvited.
- When adding requirements, append or insert in the right section. Don't reorganize.
- Match existing tone and format.

### 9. Verify Before Done
- After editing a doc, output the diff and check: did I create new requirement IDs that conflict? Did I update traceability matrix? Did I introduce new vague terms?

### 10. Honest Reporting
- If a topic wasn't covered in interview, say "Not yet elicited" instead of inferring.
- If you compressed/paraphrased a stakeholder quote, mark it as paraphrase.
