# API Design — Overview

Reference: [HLD §7](../../ArchitecturalDesign/HLD_InterviewAI_v1.0.md) · [ADR-002](../../ArchitecturalDesign/ADRs/ADR-002_nestjs-backend-framework.md) · [ADR-003](../../ArchitecturalDesign/ADRs/ADR-003_supabase-database-auth.md) · [ADR-006](../../ArchitecturalDesign/ADRs/ADR-006_sse-redis-pubsub.md)

## 1. Base URL

```
Production:  https://api.interviewcoach.vn/api/v1
Development: http://localhost:3000/api/v1
```

All endpoints are prefixed with `/api/v1`.

## 2. Authentication

Two token types:

- **Access token**: Supabase JWT, short-lived (1h). Sent as `Authorization: Bearer <token>` header on every protected request.
- **Refresh token**: Long-lived. Stored in `HttpOnly; Secure; SameSite=Strict` cookie. Used exclusively at `POST /auth/refresh`.

Auth levels referenced in endpoint tables (files 02–06):

| Level | Credential | Notes |
|-------|-----------|-------|
| No | — | Public endpoint |
| Bearer | `Authorization: Bearer <jwt>` | Standard protected routes |
| HttpOnly Cookie | Cookie header (browser-managed) | POST /auth/refresh only |
| Bearer + Admin | Bearer + role check | Admin routes (v1.1) |

`JwtAuthGuard` (NestJS) verifies token signature and expiry. Supabase RLS enforces data ownership at DB layer — NestJS does not add manual `WHERE user_id = ?` filters.

## 3. Response Envelope

All responses use a consistent envelope:

```typescript
// Success
{ success: true, data: T, meta?: { total: number, page: number, limit: number } }

// Error
{ success: false, error: { code: string, message: string, details?: unknown } }
```

`meta` is present only on paginated list responses. `details` is present only when the server can provide structured validation context (e.g., which field failed).

## 4. HTTP Status Codes

| Code | When used |
|------|-----------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (resource created) |
| 400 | Malformed request or missing required field |
| 401 | Missing or invalid JWT |
| 403 | Valid JWT but insufficient permission (wrong user or non-admin role) |
| 404 | Resource does not exist |
| 409 | Conflict (e.g., duplicate resource) |
| 422 | Validation error — field value fails business rule |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

## 5. Error Codes

Standard error codes used across all endpoints. The `code` field in the error envelope is always one of:

| Code | Status | Trigger |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or expired JWT |
| `FORBIDDEN` | 403 | Authenticated but not authorized for this resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Field value fails business rule (generic) |
| `JD_TOO_SHORT` | 422 | JD input < 100 characters (NFR AS-04) |
| `AUDIO_TOO_LONG` | 422 | Audio answer > 5 minutes (NFR P-17) |
| `SESSION_LIMIT_EXCEEDED` | 429 | Max 10 sessions/24h per user (NFR S-12) |
| `RATE_LIMIT_EXCEEDED` | 429 | Per-user rate limit hit (NFR S-11) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## 6. Rate Limiting

Two limits enforced (NFR S-11, S-12):

- **Global per-user**: 60 requests / 60 seconds. Enforced via `@Throttle(60, 60)` applied globally to AI-touching controllers (ADR-002).
- **Session creation**: max 10 new sessions / 24h per user. Application-layer `SELECT COUNT` check in `SessionService.create()` before INSERT.

Every response from rate-limited routes includes:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1718000000
Retry-After: 15
```

`Retry-After` is present only on 429 responses. Value is seconds until reset.

On 429 (S-11):

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Quá nhiều yêu cầu. Vui lòng chờ 1 phút."
  }
}
```

On 429 (S-12, session creation only):

```json
{
  "success": false,
  "error": {
    "code": "SESSION_LIMIT_EXCEEDED",
    "message": "Bạn đã tạo 10 phiên hôm nay. Thử lại sau 24 giờ."
  }
}
```

## 7. SSE (Server-Sent Events)

`GET /api/v1/sessions/:id/events` returns `Content-Type: text/event-stream`. Auth: Bearer.

Five event types (HLD §5.3, ADR-006):

| Event | Emitted when |
|-------|-------------|
| `session.status` | QuestionGenerationJob completes or fails |
| `turn.follow_up` | FollowUpJob completes |
| `turn.feedback_ready` | FeedbackJob completes |
| `report.ready` | ComprehensiveReportJob completes |
| `rewrite.done` | RewriteEvalJob completes (v1.1) |

Redis pub/sub channel per session: `sse:session:{session_id}`. All NestJS replicas subscribe via ioredis — no sticky session required on Railway. `SseService` maintains `Map<session_id, Subject<MessageEvent>>`; on Redis message, it looks up the subject and calls `next()`.

Client must send `Last-Event-ID` header for reconnect support.

## 8. Content Types

| Direction | Content-Type |
|-----------|-------------|
| JSON request body | `application/json` |
| Audio upload | `multipart/form-data` |
| SSE stream | `text/event-stream` |
| JSON response | `application/json` |

## 9. Versioning

Current version: `v1`. Version is in the URL path (`/api/v1/...`). No header-based or query-param versioning.

Breaking changes require a new path version (`/api/v2/...`), not a flag or negotiation header.

v1.1 endpoints (deferred) are noted per file as `> v1.1:` blocks. They share the same conventions defined here.
