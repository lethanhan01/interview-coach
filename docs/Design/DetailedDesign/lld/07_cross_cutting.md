# LLD — Cross-Cutting Concerns

Reference: [LLD_design.md](LLD_design.md) · [01_overview.md](01_overview.md) · ADR-006 · ADR-007

---

## 1. SseService

Wraps Redis Pub/Sub to decouple SSE emission (AIModule processors) from SSE subscription (SessionController).

```typescript
interface SseService {
  emit(channel: string, event: SseEventType, payload: unknown): Promise<void>;
  // Publishes to Redis channel: sse:session:{sessionId}
  // Called by BullMQ processors after job completion

  subscribe(channel: string): Observable<SseMessage>;
  // Returns Observable that emits on Redis message
  // Used by SessionController GET /sessions/:id/events
  // Observable completes when client disconnects
}

type SseEventType =
  | 'session.status'      // session ready/ended
  | 'turn.follow_up'      // follow-up question generated
  | 'turn.feedback_ready' // surgical feedback ready
  | 'report.ready'        // comprehensive report done
  | 'error';              // job failed after all retries

interface SseMessage {
  event: SseEventType;
  data: unknown;
  id?: string;            // event ID for client reconnect
}
```

Channel pattern: `sse:session:{sessionId}` (ADR-006).
All 5 event types defined in ADR-006 — do not add new types without updating ADR-006.

---

## 2. InterviewAIExceptionFilter

Global NestJS exception filter. Catches all exceptions and formats the standard error envelope.

```typescript
// @Catch() — catches all exception types
interface InterviewAIExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void;
  // Maps exception to { success: false, error: { code, message, details? } }
  // InterviewAIException: uses exception.errorCode + exception.statusCode
  // HttpException (other): code = 'HTTP_EXCEPTION', status = exception.getStatus()
  // Unknown Error: code = 'INTERNAL_SERVER_ERROR', status = 500 (no stack in response)
}
```

Registered globally in `AppModule` via `APP_FILTER` provider. See [01_overview.md §4](01_overview.md) for ErrorCode enum.

---

## 3. Guard Application Map

| Route group | Guard(s) | Notes |
|-------------|---------|-------|
| `POST /auth/refresh` | `RefreshGuard` | validates HttpOnly cookie |
| `POST /auth/logout` | `RefreshGuard` | validates HttpOnly cookie |
| `POST /sessions` | `JwtAuthGuard` | |
| `GET /sessions` | `JwtAuthGuard` | |
| `GET /sessions/:id` | `JwtAuthGuard` | + ownership check in service |
| `PATCH /sessions/:id` | `JwtAuthGuard` | + ownership check in service |
| `GET /sessions/:id/events` | `JwtAuthGuard` | SSE — ownership check in controller |
| `POST /sessions/:id/turns` | `JwtAuthGuard` | + session ownership via SessionService |
| `GET /sessions/:id/turns/:turnId` | `JwtAuthGuard` | |
| `GET /sessions/:id/report` | `JwtAuthGuard` | + ownership check in service |
| `/admin/*` | `JwtAuthGuard` + `RolesGuard` | v1.1 only |

---

## 4. Rate Limiting

```typescript
// ThrottlerModule config (applied globally, overridden per route)
const DEFAULT_THROTTLE = { ttl: 60_000, limit: 100 };   // 100 req/60s
const AI_THROTTLE      = { ttl: 60_000, limit: 10  };   // 10 req/60s (S-11)

// Routes with AI_THROTTLE override:
// POST /sessions          — triggers QuestionGenerationJob
// POST /sessions/:id/turns — triggers FollowUpJob + FeedbackJob
```

`@Throttle` decorator applied at controller method level for AI endpoints. Default throttle inherited at module level.

---

## 5. Request ID Propagation

```typescript
// RequestIdMiddleware (applied globally in AppModule)
// 1. Read X-Request-ID header, or generate UUID v4 if absent
// 2. Store in AsyncLocalStorage
// 3. Set X-Request-ID on response headers
// 4. All log entries include requestId field
```

---

## 6. Structured Logging

Fields on every log entry:

```typescript
interface LogEntry {
  timestamp: string;    // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  requestId: string;    // from X-Request-ID
  userId?: string;      // from req.user.id, if authenticated
  sessionId?: string;   // when applicable
  durationMs?: number;  // for request-level entries
  message: string;
  context?: unknown;    // extra structured data
}
```

Logger: NestJS built-in `Logger` with JSON transport in production. No `console.log` in application code.

---

## 7. Key References

- ADR-006 — SSE channel pattern, 5 event types, Redis Pub/Sub
- ADR-007 — BullMQ queue names, timeout/retry configuration
- HLD §9 — NFR S-11 (rate limit 10 req/min AI), S-12 (session daily limit)
- [01_overview.md §4](01_overview.md) — ErrorCode enum
- [02_auth_module.md](02_auth_module.md) — RefreshGuard, JwtAuthGuard
