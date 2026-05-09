# ADR-002: NestJS as Backend Framework

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-002 |
| **Ngày** | 09/05/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

InterviewAI cần backend framework cho Node.js/TypeScript để xử lý:

- JWT validation và auth middleware cho mọi endpoint
- Rate limiting per user (S-11: 60 req/phút) và session limit (S-12: 10 session/24h)
- AI pipeline orchestration: SessionOrchestrator, QuestionSelector, RubricEvaluator
- File upload (CV/JD parsing) và validation
- Session state management (UC-04: silence detection, follow-up trigger evaluation)

Các lựa chọn được cân nhắc:

- NestJS (TypeScript-first, DI container, Guards/Interceptors/Pipes)
- Express (minimal, flexible, large ecosystem)
- Fastify (performance-focused, schema-based validation, TypeScript support)

## Decision

**Chọn NestJS.**

Lý do:

1. **Guards cho auth và rate limit**: S-11/S-12/S-13 enforcement implement thành `JwtAuthGuard`, `RateLimitGuard`, `SessionLimitGuard` — decorator-based, apply per controller hoặc per route. Express/Fastify đòi middleware chain thủ công với logic phân tán.

2. **DI container cho AI pipeline**: 3 pipeline (HR, Technical, Mixed) theo session type spec §5.6 phải implement như pipeline riêng biệt. NestJS DI cho phép `HrSessionService`, `TechnicalSessionService`, `MixedSessionService` inject `QuestionBankService` và `RubricEvaluatorService` mà không coupling trực tiếp. Express không có DI native.

3. **Module system**: `SessionModule`, `AIModule`, `FeedbackModule`, `AuthModule` tổ chức theo bounded context — phù hợp với scope từng nhóm feature trong SRS UC-03/04/05/06.

4. **Pipes cho validation**: Zod hoặc `class-validator` tích hợp qua `ValidationPipe` — validate toàn bộ request DTO tại entry point trước khi vào service layer.

5. **Interceptors cho logging và response transform**: request/response logging uniform, consistent error response shape — không cần replicate qua từng route handler.

6. **Monorepo type sharing**: cùng TypeScript ecosystem với Next.js frontend (ADR-001) — shared types package cho session DTOs, rubric schemas, question taxonomy interfaces.

Tại sao không chọn Express:

- Không có DI native → AI pipeline orchestration phức tạp, khó test độc lập
- Middleware chain không có lifecycle hooks (onModuleInit cho warm-up AI connections)
- Flexible là lợi thế khi team có kinh nghiệm và biết rõ cần gì — prototype scope được lợi nhiều hơn từ structure của NestJS

Tại sao không chọn Fastify:

- Schema validation dùng JSON Schema thay vì TypeScript types — type-safe kém hơn `class-validator` + `class-transformer`
- Không có DI native — cùng vấn đề với Express cho AI pipeline
- Plugin ecosystem nhỏ hơn cho enterprise patterns (auth, OpenAPI gen)

## Consequences

**Positive:**

- Guards/Pipes/Interceptors → S-11/S-12/S-13 implementation tách biệt, testable độc lập
- Module structure → 3 session pipelines tổ chức theo session type, thêm session type mới = thêm module
- DI → AI services mock được trong unit test không cần HTTP stub

**Negative:**

- Learning curve: decorator-heavy syntax, DI container — unfamiliar với dev background Express thuần
- Bootstrap overhead: NestJS khởi động chậm hơn Express/Fastify (~100-200ms) — không ảnh hưởng production (warm server), nhưng không phù hợp deploy dưới dạng serverless function cold start
- Abstraction layers: debug đôi khi phức tạp hơn khi lỗi xảy ra trong DI lifecycle hoặc interceptor chain
