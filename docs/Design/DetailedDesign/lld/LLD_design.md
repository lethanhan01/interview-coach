# LLD — InterviewAI (Low-Level Design)

| Phiên bản | 1.0 | Ngày | 2026-06-06 | Trạng thái | Draft |
|-----------|-----|------|------------|-----------|-------|

Tài liệu này là stub index — nội dung chi tiết trong các files con theo module.

## Phạm vi

5 NestJS modules (MVP): class interfaces, method signatures, DTOs, BullMQ job contracts,
sequence diagrams cho 3 complex flows, cross-cutting concerns.
Không bao gồm code implementation — xem docs/PHASES.md (Implementation phase).

## Files con

| File | Nội dung |
|------|---------|
| [01_overview.md](01_overview.md) | Module dependency graph, naming conventions, DTO rules, error hierarchy |
| [02_auth_module.md](02_auth_module.md) | AuthModule: JwtStrategy, AuthService, guards, DTOs |
| [03_session_module.md](03_session_module.md) | SessionModule: SessionService, QuestionComposerService, QuestionGenerationJob |
| [04_turn_module.md](04_turn_module.md) | TurnModule: TurnService, WhisperService, VoiceMetrics, FollowUpJob, FeedbackJob |
| [05_ai_module.md](05_ai_module.md) | AIModule: OpenAIGateway, PromptBuilder, 3 Pipelines, ZodValidator, 5 Processors |
| [06_report_module.md](06_report_module.md) | ReportModule: ReportService, ComprehensiveReportBuilder, ComprehensiveReportJob |
| [07_cross_cutting.md](07_cross_cutting.md) | SseService, ExceptionFilter, guards map, rate limiting, logging |

## Tài liệu liên quan

- [HLD](../ArchitecturalDesign/HLD_InterviewAI_v1.0.md) — component inventory, data flows, BullMQ specs
- [SAD](../ArchitecturalDesign/SAD_InterviewAI_v1.0.md) — AI pipeline 3-layer prompt architecture
- [API Design](api-design/) — endpoint specs, request/response DTOs
- [Database Design](database-design/) — schema, DDL, RLS
- [MVP Scope](../MVP_Scope.md) — UC-02/03/04/05/06, 11 tables, 5 routes in scope
