# Database Design — InterviewAI v1.0

Engine: PostgreSQL 15 qua Supabase. 15 tables, 0 pgvector columns trong v1.

Source canonical: [HLD v1.0](../ArchitecturalDesign/HLD_InterviewAI_v1.0.md) §2/§3/§6/§7,
[ADR-003](../ArchitecturalDesign/ADRs/ADR-003_supabase-database-auth.md) (Supabase),
SRS UC-02→UC-13, NFR P-16→P-21 / S-01→S-14.

## Tài liệu con

| File | Nội dung |
| ------ | ---------- |
| [01_overview.md](01_overview.md) | Tech stack, conventions, table inventory |
| [02_erd.md](02_erd.md) | Entity Relationship Diagram (Mermaid) |
| [03_tables_auth.md](03_tables_auth.md) | context_packs, question_bank, users, user_profiles |
| [04_tables_session.md](04_tables_session.md) | interview_sessions, session_questions |
| [05_tables_answer.md](05_tables_answer.md) | user_answers, follow_up_questions, ai_feedbacks, annotated_segments, rewrite_answers |
| [06_tables_features.md](06_tables_features.md) | reverse_questions, progress_snapshots, placement_test_answers, ai_quality_log |
| [07_constraints.md](07_constraints.md) | Indexes, RLS policies, check constraints |
| [08_design_decisions.md](08_design_decisions.md) | Design decisions, seed data notes |
