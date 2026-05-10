# Docs Navigation

Tra bảng dưới trước khi mở bất kỳ file nào. Mỗi tác vụ có một tập file tối thiểu.

## Phân loại file theo kích thước

| Nhóm | Ngưỡng | Cách đọc |
|------|--------|----------|
| S | < 100 dòng | Load toàn bộ tự do |
| M | 100–400 dòng | Load toàn bộ nếu tác vụ liên quan trực tiếp file đó |
| L | 400–999 dòng | Đọc theo section — dùng offset/limit hoặc Grep heading trước |
| XL | >= 1000 dòng | Luôn đọc theo section. Không load toàn bộ. |

## Tra nhanh theo tác vụ

| Tác vụ | File | Section / ghi chú |
|--------|------|-------------------|
| Hiểu sản phẩm tổng quan | Interview_AI_Coach_Design_Spec.md | Toàn bộ (L — 820 dòng) |
| Phase và trạng thái dự án | PHASES.md | Toàn bộ (S) |
| Tra thuật ngữ | glossary.md | Toàn bộ (M) |
| Yêu cầu UC cụ thể | SRS §4 UC-XX | Grep "## UC-XX" để lấy offset, rồi đọc theo section |
| SRS tổng quan (actors, env, UC diagram) | SRS | offset=0 limit=420 |
| NFR (usability/perf/security/AI) | SRS §4.1–4.8 | offset=1880 limit=150 |
| Architecture tổng thể | HLD §1–3 | offset=0 limit=510 |
| Data flows (5 luồng chính) | HLD §3 | offset=246 limit=262 |
| Cross-cutting: queue/SSE/rate limit | HLD §5 | offset=549 limit=165 |
| Endpoint inventory (~35 APIs) | HLD §7 | offset=772 limit=79 |
| Tech stack + C4 diagrams | SAD §1 | offset=0 limit=185 |
| Prompt architecture | SAD §2.1–2.2 | offset=185 limit=340 |
| AI output schema + fallback | SAD §2.3–2.4 | offset=522 limit=270 |
| Security architecture | SAD §6 | offset=1063 limit=60 |
| Business constraints + SLO | SAD §7 | offset=1122 limit=35 |
| ADR cụ thể | ADRs/ADR-XXX_*.md | Toàn bộ (S — 59–81 dòng mỗi file) |
| DB schema overview + conventions | database-design/01_overview.md | Toàn bộ (M) |
| ERD (15 tables, 17 relationships) | database-design/02_erd.md | Toàn bộ (M) |
| DDL: context_packs, question_bank, users | database-design/03_tables_auth.md | Toàn bộ (M) |
| DDL: interview_sessions, session_questions | database-design/04_tables_session.md | Toàn bộ (M) |
| DDL: answers, feedbacks, segments | database-design/05_tables_answer.md | Toàn bộ (M) |
| DDL: reverse_q, progress, placement, ai_log | database-design/06_tables_features.md | Toàn bộ (M) |
| Indexes, RLS policies, CHECK constraints | database-design/07_constraints.md | Toàn bộ (M) |
| DB design decisions (DD-01→DD-09) | database-design/08_design_decisions.md | Toàn bộ (M) |
| Session type HR/Behavioral | session_type_spec | Grep "## 1\." → offset ~66 limit 230 |
| Session type Technical | session_type_spec | Grep "## 2\." → offset ~294 limit 400 |
| Session type Mixed | session_type_spec | Grep "## 3\." → offset ~693 limit 155 |
| Anti-repeat, sizing, localization | session_type_spec | offset=847 limit=80 |
| Traceability UC→AC→US | RTM_InterviewAI.md | Toàn bộ (S) |
| User story cụ thể | user-stories/US-XXX_*.md | Toàn bộ (S — 33–40 dòng mỗi file) |
| Test strategy | test-plan/strategy.md | Toàn bộ (M) |
| Business process (9-phase flowchart) | RequirementAnalysis/Business_Requirements_Document.md | Toàn bộ (M) |

Offset là ước tính dựa trên TOC. Dùng Grep tìm heading trước nếu cần chính xác tuyệt đối.

## Cây thư mục

```
docs/
├── README.md                                         S     file này — navigation doc
├── PHASES.md                                         S     Done — phase roadmap + transition log
├── glossary.md                                       M     Done — 20+ thuật ngữ từ SRS
├── style-audit.md                                    M     Done — icon/style compliance scan
├── Interview_AI_Coach_Design_Spec.md                 L     Done — product design spec tổng quan
│
├── RequirementAnalysis/
│   ├── Business_Requirements_Document.md             M     Done — 9-phase flowchart + UC mapping
│   ├── SRS/
│   │   ├── SRS_InterviewAI_Full.md                  XL    Done — 13 UCs, 8 NFR tables, 9 business phases
│   │   ├── RTM_InterviewAI.md                        S     Done — UC→AC→US traceability matrix
│   │   └── Checklist_SRS.md                          M     Done — QA checklist vs IEEE 830
│   ├── discovery-docs/
│   │   ├── Discovery_Document.md                     XL    Done — problem statement, stakeholders, competitive analysis
│   │   ├── Discovery_Document_Template.md            XL    Reference — template (ít dùng)
│   │   └── Checklist_Discovery.md                    L     Done — discovery checklist
│   └── user-stories/
│       ├── README.md                                  M     Done — template + INVEST + persona table
│       └── US-001→US-016_*.md                        S     Draft — 16 stories, 33–40 dòng mỗi file
│
├── Design/
│   ├── ArchitecturalDesign/
│   │   ├── SAD_InterviewAI_v1.0.md                  XL    Done — NestJS arch, C4, prompts, security (PLANNED SPLIT → SAD/)
│   │   ├── HLD_InterviewAI_v1.0.md                   L     Done — 10 sections, 5 data flows, ~35 endpoints
│   │   ├── interview_ai_coach_session_type_spec.md   L     Done — 3 session types (PLANNED SPLIT → session-types/)
│   │   └── ADRs/
│   │       └── ADR-001→007_*.md                      S     Done — 7 decisions, tất cả Accepted
│   └── DetailedDesign/
│       ├── database-design/
│       │   ├── database_design.md                    S     Done — stub index + links
│       │   ├── 01_overview.md                        M     Done — tech stack, conventions, 15-table inventory
│       │   ├── 02_erd.md                             M     Done — Mermaid ERD, 17 relationships
│       │   ├── 03_tables_auth.md                     M     Done — DDL: context_packs, question_bank, users, profiles
│       │   ├── 04_tables_session.md                  M     Done — DDL: interview_sessions, session_questions
│       │   ├── 05_tables_answer.md                   M     Done — DDL: answers, follow_ups, rewrites, feedbacks, segments
│       │   ├── 06_tables_features.md                 M     Done — DDL: reverse_q, progress, placement, ai_log
│       │   ├── 07_constraints.md                     M     Done — 17 indexes, RLS per table, CHECK constraints
│       │   └── 08_design_decisions.md                M     Done — DD-01→DD-09 với rationale + seed SQL
│       ├── api-design/                                      Pending — ~35 endpoints, DTOs, error codes
│       └── uiux-design/                                     Pending — sitemap, flows, wireframes, design tokens
│
└── test-plan/
    └── strategy.md                                   M     Done — test scope, pyramid, environments
```

## Trình tự đọc theo vai trò

Mới vào dự án:
PHASES.md → glossary.md → SRS offset=0 limit=420 → HLD offset=0 limit=510

Thiết kế backend module (NestJS):
HLD offset=74 limit=172 → database-design/01_overview.md → DB files đúng nhóm bảng

Thiết kế AI pipeline:
SAD offset=185 limit=340 → SAD offset=522 limit=270 → session_type_spec (section đúng loại session)

Thiết kế API endpoint:
HLD offset=772 limit=79 → api-design/ (khi available)

Viết test cases:
RTM_InterviewAI.md → user-stories/US-XXX.md → test-plan/strategy.md

Review architecture decision:
ADRs/ADR-XXX_*.md → CLAUDE.md §"Key Decisions"

## Trạng thái tài liệu

| Tài liệu | Status | Chú thích |
|----------|--------|-----------|
| SRS_InterviewAI_Full.md | Done | 0 Blocker, 0 named should-fix |
| RTM_InterviewAI.md | Done | UC-11/12/13 added, User Stories column filled |
| Business_Requirements_Document.md | Done | 9-phase flowchart |
| SAD_InterviewAI_v1.0.md | Done | v1.1 — NestJS-only, C4 diagrams, security §6, SLO §7 |
| HLD_InterviewAI_v1.0.md | Done | OQ-1→4 resolved; SSE+Redis, BullMQ |
| ADR-001→007 | Done | Tất cả Accepted |
| interview_ai_coach_session_type_spec.md | Done | 3 session types (HR/Technical/Mixed) |
| database-design/ (9 files) | Done | 15 tables, DDL + RLS + 17 indexes + DD-01→DD-09 |
| User Stories US-001→016 | Draft | INVEST flags: US-010/013/016 (Small) |
| test-plan/strategy.md | Done | Chưa audit |
| api-design/ | Pending | Chưa tạo |
| uiux-design/ | Pending | Chưa tạo |
| LLD_InterviewAI_v1.0.md | Pending | Chưa tạo |

## Maintenance

Khi thêm hoặc sửa tài liệu: cập nhật §"Cây thư mục", §"Tra nhanh", và §"Trạng thái" trong file này.
Quy tắc đầy đủ: `.claude/rules/doc-generation.md`.
Kiểm tra nhất quán sau mỗi lần tạo doc mới: `/doc-checker <file-path>`.
