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
- `/qa-review` [docs/SRS/SRS_InterviewAI_Full.md](docs/SRS/SRS_InterviewAI_Full.md) — 17 findings (5🔴 9🟡 3🟢): recommend FIX BEFORE NEXT PHASE
- `/qa-review` [docs/SRS/RTM_InterviewAI.md](docs/SRS/RTM_InterviewAI.md) — 12 findings (2🔴 7🟡 3🟢): AS-05/AS-06 untestable; 8 security NFRs unmapped
- Created [docs/user-stories/README.md](docs/user-stories/README.md) — template + INVEST checklist + persona table + index
- Created [docs/glossary.md](docs/glossary.md) — 20 terms từ SRS §1.3 + Discovery, A–W
- Created [docs/test-plan/strategy.md](docs/test-plan/strategy.md) — test scope, pyramid, environments, risks, entry/exit criteria

## Phase Roadmap

| Phase | Status | Key Deliverables | Location |
|-------|--------|------------------|----------|
| Discovery | ✅ Done | Problem statement, stakeholders | docs/Discovery_Docs/ |
| Requirements Analysis | 🚧 Active | SRS, user stories, glossary, traceability matrix, test plan outline | docs/SRS/, docs/user-stories/, docs/glossary.md, docs/traceability-matrix.md, docs/test-plan/ |
| Architectural Design | ⏭️ Next | Architecture overview, ADRs, component diagrams | docs/architecture/ |
| Detailed Design | ⏭️ | Per-component design, API contracts | docs/design/ |
| Database Design | ⏭️ | Schema, ERD, RLS strategy | docs/design/database.md |
| UI/UX Design | ⏭️ | User flows, wireframes, design system | docs/ui/ |
| Implementation | ⏭️ | Code | apps/ |
| Integration | ⏭️ | Integration tests, deployment config | apps/, infra/ |
| V&V / Testing | ⏭️ | E2E tests, test reports | tests/, docs/test-reports/ |

Phase transition log: see docs/PHASES.md

## Available Personas (Slash Commands)

- `/ba-interview <topic>` — Conduct structured BA interview to elicit requirements
- `/qa-review <file>` — QA review across 6 dimensions: testability, completeness, ambiguity, consistency, traceability, priority & scope. Output: 🔴 Blocker / 🟡 Should-fix / 🟢 Minor findings + recommendation (BLOCK / FIX BEFORE NEXT PHASE / OK)
- `/srs-audit` — Audit current SRS against IEEE 830 / quality criteria
- `/wrap-phase <phase>` — Generate phase output summary, prepare handoff to next phase

## Documentation Map

| Doc | Status | Chất lượng | Path |
|-----|--------|-----------|------|
| Discovery Document | ✅ Done | Chưa audit | docs/Discovery_Docs/Discovery_Document.md |
| Discovery Checklist | ✅ Done | Chưa audit | docs/Discovery_Docs/Checklist_Discovery.md |
| SRS (full) | ⚠️ Needs fix | 5🔴 17 findings — FIX BEFORE NEXT PHASE | docs/SRS/SRS_InterviewAI_Full.md |
| SRS Checklist | ✅ Done | Chưa audit | docs/SRS/Checklist_SRS.md |
| Requirements Traceability Matrix | ⚠️ Needs fix | 2🔴 12 findings — FIX BEFORE NEXT PHASE | docs/SRS/RTM_InterviewAI.md |
| Software Architecture Document | ✅ Done | Chưa audit | docs/SAD/SAD_InterviewAI_v1.0.md |
| Database Design | ⬜ Empty | Intentionally deferred | docs/design/database_design.md |
| API Spec | ⬜ Empty | Intentionally deferred | docs/design/API_spec.md |
| Glossary | ✅ Done | Chưa audit | docs/glossary.md |
| User Stories | 🚧 Template ready | Chưa có story nào | docs/user-stories/ |
| Test Plan (strategy) | ✅ Done | Chưa audit | docs/test-plan/strategy.md |
| Phase Transition Log | ✅ Done | Đã fill hết TODO | docs/PHASES.md |
| Architecture ADRs | ⏭️ Planned | — | docs/architecture/ |
| UI/UX Design | ⏭️ Planned | — | docs/ui/ |

## Next Steps

> **Thứ tự bắt buộc:** SRS phải ổn định → mới viết User Stories → mới viết Test Cases.

### 🔴 Làm ngay (unblock US và TC)

**[1] Fix SRS blockers** — 5 findings từ `/qa-review` 2026-05-06:
- Thêm MoSCoW priority vào tất cả UC headers và NFR rows (systematic — toàn bộ tài liệu)
- Fix P-01, P-02, P-05: thêm ngưỡng số cụ thể hoặc xóa NFR và declare rằng threshold sống trong UC ACs
- Fix P-04: chọn 1 con số (5s hoặc 10s), nhất quán hóa với AC-04-2 và E-04-3
- Giải thích P-11..P-15 gap: ghi "Removed" hoặc renumber P-16..P-21 → P-11..P-16
- Fix S-12: thêm threshold cụ thể (ví dụ "≤ 10 sessions/user/ngày")

**[2] Fix RTM blockers** — 2 findings từ `/qa-review` RTM 2026-05-06:
- Thêm AC cho AS-05 và AS-06 vào UC-04 hoặc UC-05, rồi cập nhật RTM AC column
- Thêm 8 security NFRs vào RTM: S-04 → UC-04/05/06/07/08; S-05/S-06 → hàng cross-cutting; S-07 → UC-04; S-10/S-11/S-12/S-14 → UC tương ứng

### 🟡 Làm sau khi blockers xong

**[3] Viết User Stories** — MUST UCs trước: UC-01, UC-03, UC-04, UC-05, UC-06, UC-07
- Dùng template [docs/user-stories/README.md](docs/user-stories/README.md)
- Mỗi story phải qua INVEST check trước khi commit
- Update index table trong README.md và cột US trong RTM

**[4] Hoàn thiện RTM** — sau khi US có:
- Thêm cột "User Stories" vào RTM §1
- Ghi chú UC-09/UC-10: không trace về Discovery insight (author confirmed)
- Ghi chú vào §3 Maintenance Notes: khi có TC, thêm cột TC vào RTM

**[5] Should-fix trong SRS** (10 findings còn lại) — sau blockers:
- U-01, U-12: thêm measurable criterion
- S-11, S-13: thêm con số cụ thể
- AS-04: thêm "< 100 ký tự" vào chính NFR text
- Q-03, Q-07: thêm AC dựa trên usability test hoặc survey

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| SAD already exists (docs/SAD/) | Covers tech stack, AI pipeline, prompt engineering in depth. Don't duplicate in SRS — cross-reference instead. |
| SRS v1.6 uses custom format (UC-based, not FR-XXX) | SRS predates the FR-XXX rule. UC format đủ cho prototype scope. Reformatting dần — new/changed requirements dùng FR-XXX, existing không buộc phải đổi ngay. |
| database_design.md and API_spec.md are empty | Intentionally left for Detailed Design phase. Don't fill during Requirements Analysis — requirements drive design, not the reverse. |
| Rules in .claude/rules/ (not CLAUDE.md) | Scoped rules by file path are more targeted than one monolithic instruction file. CLAUDE.md stays as project context; rules files stay as format enforcement. |
| Audit SRS trước khi viết User Stories | US phải reference FR/UC cụ thể. Nếu UC còn lỗi format hoặc thiếu AC, US viết ra sẽ phải sửa lại — tốn công gấp đôi. Sequence đúng: fix SRS → US → TC. |
| Performance threshold sống trong UC ACs, không nhất thiết duplicate vào NFR | AC-04-2 (≤5s), AC-05-1 (≤8s), AC-06-1 (≤500ms) đã có số cụ thể. NFR P-01/P-02/P-05 vague là blocker cần fix — chọn 1 trong 2: backfill số vào NFR hoặc xóa NFR và để ACs là nguồn sự thật duy nhất. Tránh duplicate số ở 2 chỗ gây inconsistency. |
| TC chưa viết — intentionally deferred | SRS còn 5 blocker findings. Viết TC bây giờ sẽ phải sửa lại khi SRS thay đổi. TC sẽ được viết sau khi blockers fix xong và US được ký off. |
| AS-05/AS-06 là blocker thực sự | Hai safety requirements không có AC nào verify — đây là gap nghiêm trọng nhất trong RTM vì chúng liên quan đến AI bias và discrimination. Phải có AC và kiểm tra thực tế trước launch. |

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
