# Interview Coach

InterviewAI là ứng dụng web luyện phỏng vấn xin việc dành cho sinh viên năm cuối và fresher CNTT Việt Nam (0–12 tháng kinh nghiệm). Người dùng paste Job Description vào hệ thống, trả lời câu hỏi bằng giọng nói hoặc text, nhận follow-up contextual từ AI, và xem "Surgical Feedback" — phản hồi highlight từng đoạn cụ thể trong câu trả lời kèm gợi ý cải thiện. Hệ thống hỗ trợ hai Context Pack (VN / Western) với rubric chấm điểm phù hợp văn hóa, lấp đầy khoảng trống thị trường khi toàn bộ công cụ luyện phỏng vấn hiện có chỉ hỗ trợ tiếng Anh với giá $25–$148/tháng — ngoài tầm với của đa số sinh viên Việt Nam.

## Active Phase

**Current**: Requirements Analysis  
**Started**: 2026-05-06  
**Target completion**: 2026-05-20 (ước tính — trước khi bắt đầu Architectural Design)

In this phase, you act as a **Business Analyst (BA)** and **QA Engineer**, not a developer. You produce documentation, not code.

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

## Phase Roadmap

| Phase | Status | Key Deliverables | Location |
|-------|--------|------------------|----------|
| Discovery | Done | Problem statement, stakeholders | docs/Discovery_Docs/ |
| Requirements Analysis | Active | SRS, user stories, glossary, traceability matrix, test plan outline | docs/SRS/, docs/user-stories/, docs/glossary.md, docs/traceability-matrix.md, docs/test-plan/ |
| Architectural Design | Next | Architecture overview, ADRs, component diagrams | docs/architecture/ |
| Detailed Design | Planned | Per-component design, API contracts | docs/design/ |
| Database Design | Planned | Schema, ERD, RLS strategy | docs/design/database.md |
| UI/UX Design | Planned | User flows, wireframes, design system | docs/ui/ |
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
| SRS (full) | Updated — scope-clean, 2.5 conflicts resolved | 0 Blocker — ASCII art removed từ UC-06/07; Section 2.5 nhất quán với UC-04 và UC-07 đã mapped; 10 should-fix cũ chưa xử lý | docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md |
| SRS Checklist | Done | Chưa audit | docs/SRS/Checklist_SRS.md |
| Requirements Traceability Matrix | Blockers resolved | 0 Blocker — should-fix còn lại chưa xử lý | docs/SRS/RTM_InterviewAI.md |
| Software Architecture Document | Done | Chưa audit | docs/SAD/SAD_InterviewAI_v1.0.md |
| Database Design | Empty | Intentionally deferred | docs/design/database_design.md |
| API Spec | Empty | Intentionally deferred | docs/design/API_spec.md |
| Glossary | Done | Chưa audit | docs/glossary.md |
| User Stories | 13 stories — Draft | US-001→US-013; UC-01/03/03b/04/06/07 covered; INVEST flagged: US-010 (Small), US-013 (Small); UC-05 không có story (backend-only) | docs/RequirementAnalysis/user-stories/ |
| Test Plan (strategy) | Done | Chưa audit | docs/test-plan/strategy.md |
| Phase Transition Log | Done | Đã fill hết TODO | docs/PHASES.md |
| Architecture ADRs | Planned | — | docs/architecture/ |
| UI/UX Design | Planned | — | docs/ui/ |
| Style Audit Report | Done | SRS fixed; PHASES.md + srs-format.md fixed; 3 files pending (Discovery docs — fix khi next touched) | docs/style-audit.md |

## Next Steps

> **Thứ tự bắt buộc:** SRS ổn định → User Stories → RTM update → Test Cases.
> **Trạng thái hiện tại (2026-05-09):** US-001→US-013 đã tạo (Draft). Bước tiếp theo: cập nhật RTM và viết US cho SHOULD UCs còn lại.

### Làm ngay (MUST)

**[1] Hoàn thiện RTM** — unblocked sau khi US-001→US-013 có:
- Thêm cột "User Stories" vào RTM §1 — map US-ID vào từng UC row
- Thêm rows cho UC-11/UC-12/UC-13 (thêm từ BRD alignment session, chưa có trong RTM)
- Ghi chú UC-09/UC-10: không trace về Discovery insight (author confirmed)
- Ghi chú vào §3 Maintenance Notes: khi có TC, thêm cột TC vào RTM

### Làm song song hoặc ngay sau (SHOULD)

**[2] Viết User Stories cho SHOULD UCs còn lại** — UC-11 (Placement Test), UC-12 (Reverse Questions), UC-13 (Dashboard tiến trình)
- Dùng template [docs/RequirementAnalysis/user-stories/README.md](docs/RequirementAnalysis/user-stories/README.md)
- Mỗi story qua INVEST check; cập nhật README.md index
- US-010 và US-013 có INVEST Small flag — xem xét tách nếu cần

**[3] Should-fix trong SRS** (10 findings còn lại từ /qa-review 2026-05-06):
- U-01, U-12: thêm measurable criterion
- S-11, S-13: thêm con số cụ thể
- AS-04: thêm "< 100 ký tự" vào chính NFR text
- Q-03, Q-07: thêm AC dựa trên usability test hoặc survey

**[4] Icon violations — files còn lại** (dựa trên [docs/style-audit.md](docs/style-audit.md)):
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
