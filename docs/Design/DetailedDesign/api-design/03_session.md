# API Design — Session Endpoints

References: [01_overview.md](./01_overview.md) | HLD §7.2 | ADR-006 | ADR-007

## Endpoint Summary

| Method | Path | Auth | MVP | Purpose |
|--------|------|------|-----|---------|
| POST | /api/v1/sessions | Bearer | Yes | Create session, enqueue QuestionGenerationJob |
| GET | /api/v1/sessions | Bearer | No (v1.1) | List sessions (UC-08, deferred) |
| GET | /api/v1/sessions/:id | Bearer | Yes | Get session detail |
| GET | /api/v1/sessions/:id/status | Bearer | Yes | Poll generation status |
| PATCH | /api/v1/sessions/:id/status | Bearer | Yes | Update session status (end early) |
| GET | /api/v1/sessions/:id/events | Bearer | Yes | SSE stream for real-time job events |

---

### POST /api/v1/sessions

**Auth**: Bearer
**MVP**: Yes

**Purpose**: Create a new interview session and enqueue QuestionGenerationJob.

**Request**
```json
{
  "job_description": "string (min 100 chars)",
  "session_type": "hr | technical | mixed",
  "context_pack": "VN | Western",
  "total_questions": 5
}
```
`total_questions` default: 5. Range: 3–10.

**Response**
201:
```json
{ "success": true, "data": { "session": { "id": "uuid", "status": "pending", "session_type": "hr", "context_pack": "VN", "current_question_index": 0, "total_questions": 5, "created_at": "2026-06-05T00:00:00Z" } } }
```

**Errors**
| Code | Status | When |
|------|--------|------|
| `JD_TOO_SHORT` | 422 | `job_description` < 100 characters (NFR AS-04) |
| `VALIDATION_ERROR` | 422 | `session_type` or `context_pack` value not in enum |
| `SESSION_LIMIT_EXCEEDED` | 429 | User created 10+ sessions in last 24h (NFR S-12) |

**Notes**
Session `status` is `pending` on creation. QuestionGenerationJob runs async with 15s timeout and 1 retry (ADR-007). Client polls `GET /sessions/:id/status` or subscribes to `GET /sessions/:id/events` to detect when status becomes `ready`.

---

### GET /api/v1/sessions

**Auth**: Bearer
**MVP**: No (v1.1)

> **v1.1:** This endpoint is deferred. UC-08 (session history) is not in MVP scope.

---

### GET /api/v1/sessions/:id

**Auth**: Bearer
**MVP**: Yes

**Purpose**: Get session detail.

**Request**
Path param: `id` (UUID)

**Response**
200:
```json
{ "success": true, "data": { "session": { "id": "uuid", "status": "active", "session_type": "technical", "context_pack": "VN", "job_description": "...", "current_question_index": 2, "total_questions": 5, "created_at": "2026-06-05T00:00:00Z", "updated_at": "2026-06-05T00:05:00Z" } } }
```

**Errors**
| Code | Status | When |
|------|--------|------|
| `NOT_FOUND` | 404 | Session does not exist |
| `FORBIDDEN` | 403 | Session belongs to another user |

---

### GET /api/v1/sessions/:id/status

**Auth**: Bearer
**MVP**: Yes

**Purpose**: Poll generation status — alternative to SSE for clients that do not support EventSource.

**Request**
Path param: `id` (UUID)

**Response**
200:
```json
{ "success": true, "data": { "session_id": "uuid", "status": "ready", "current_question_index": 0, "total_questions": 5 } }
```

**Errors**
| Code | Status | When |
|------|--------|------|
| `NOT_FOUND` | 404 | Session does not exist |
| `FORBIDDEN` | 403 | Session belongs to another user |

---

### PATCH /api/v1/sessions/:id/status

**Auth**: Bearer
**MVP**: Yes

**Purpose**: Update session status — allows user to end session early.

**Request**
Path param: `id` (UUID)
```json
{ "status": "completed" }
```
Valid transition: `active → completed` only.

**Response**
200:
```json
{ "success": true, "data": { "session": { "id": "uuid", "status": "completed", "updated_at": "2026-06-05T01:00:00Z" } } }
```

**Errors**
| Code | Status | When |
|------|--------|------|
| `NOT_FOUND` | 404 | Session does not exist |
| `FORBIDDEN` | 403 | Session belongs to another user |
| `VALIDATION_ERROR` | 422 | Status transition not allowed |

---

### GET /api/v1/sessions/:id/events

**Auth**: Bearer
**MVP**: Yes

**Purpose**: SSE stream — delivers real-time job completion events to the client.

**Request**
Path param: `id` (UUID)
```
Accept: text/event-stream
Last-Event-ID: <last-received-event-id>
```

**Response**
`Content-Type: text/event-stream`

Event shapes:
```
event: session.status
id: <uuid>
data: {"status":"ready","current_question_index":0,"total_questions":5}

event: turn.follow_up
id: <uuid>
data: {"turn_id":"uuid","follow_up_question":"Can you elaborate on that?"}

event: turn.feedback_ready
id: <uuid>
data: {"turn_id":"uuid","feedback_summary":"Good structure, add more specifics."}

event: report.ready
id: <uuid>
data: {"session_id":"uuid","report_id":"uuid"}

event: error
id: <uuid>
data: {"code":"INTERNAL_ERROR","message":"Question generation timed out."}
```

**Notes**
- Redis pub/sub channel: `sse:session:{session_id}` (ADR-006). All NestJS replicas subscribe — no sticky sessions required.
- Keep-alive: server emits `: keep-alive\n\n` every 15s (SSE comment, no event name).
- Client must send `Last-Event-ID` header on reconnect; server replays missed events from Redis stream if available.
- `rewrite.done` event exists but is v1.1 only.
