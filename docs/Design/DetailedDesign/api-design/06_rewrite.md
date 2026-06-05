# API Design — Rewrite (v1.1)

Reference: [HLD §7.4](../../ArchitecturalDesign/HLD_InterviewAI_v1.0.md) · [ADR-007](../../ArchitecturalDesign/ADRs/ADR-007_bullmq-job-queue.md)

UC-07 (Answer Rewrite) is deferred to v1.1. All three endpoints below are placeholders — no request/response schemas are defined until v1.1 planning.

## Endpoint Inventory

| Method | Path | Auth | Use Case |
|--------|------|------|----------|
| GET | `/api/v1/sessions/:id/answers/:answerId/rewrite-context` | Bearer | UC-07 — init |
| POST | `/api/v1/sessions/:id/answers/:answerId/rewrites` | Bearer | UC-07 — submit |
| GET | `/api/v1/sessions/:id/answers/:answerId/rewrites` | Bearer | UC-07 — list |

---

## GET /api/v1/sessions/:id/answers/:answerId/rewrite-context

> **v1.1:** UC-07 is deferred. This endpoint is not implemented in MVP.

Returns the original transcript and surgical feedback score for a given answer, giving the user context before writing a rewrite. Triggers the rewrite workflow.

Path params: `id` (session UUID), `answerId` (answer/turn UUID).

---

## POST /api/v1/sessions/:id/answers/:answerId/rewrites

> **v1.1:** UC-07 is deferred. This endpoint is not implemented in MVP.

Accepts the user's rewritten answer text and enqueues `RewriteEvalJob` (timeout 15s, retry 0 — ADR-007). The job compares the rewrite against the original rubric and emits `rewrite.done` SSE event when complete.

Path params: `id` (session UUID), `answerId` (answer/turn UUID).

---

## GET /api/v1/sessions/:id/answers/:answerId/rewrites

> **v1.1:** UC-07 is deferred. This endpoint is not implemented in MVP.

Returns all rewrite attempts for a given answer, ordered by submission time. Includes eval score per attempt to let the user track improvement.

Path params: `id` (session UUID), `answerId` (answer/turn UUID).

---

## SSE event for rewrite completion

When `RewriteEvalJob` finishes, it publishes to `sse:session:{session_id}`. The SSE stream at `GET /api/v1/sessions/:id/events` emits:

```
event: rewrite.done
data: {"rewrite_id": "uuid", "score": 82, "delta": +14}
```

This is the only rewrite-related SSE event type. See [01_overview.md §7](./01_overview.md) for full SSE channel specification.
