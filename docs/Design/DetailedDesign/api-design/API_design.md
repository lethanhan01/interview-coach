# API Design — InterviewAI

NestJS backend REST API. Base URL: `https://api.interviewcoach.vn/v1`. Auth: Supabase JWT Bearer token.

## Contents

- [01_overview.md](01_overview.md) — Conventions, base URL, auth, error envelope, rate limits
- [02_auth.md](02_auth.md) — POST /auth/google, POST /auth/refresh, POST /auth/logout
- [03_session.md](03_session.md) — POST /sessions, GET /sessions/:id, PATCH /sessions/:id, GET /sessions
- [04_answer.md](04_answer.md) — POST /sessions/:id/answers, GET /sessions/:id/answers, SSE /sessions/:id/stream
- [05_report.md](05_report.md) — GET /sessions/:id/report, POST /sessions/:id/report/generate
- [06_rewrite.md](06_rewrite.md) — POST /answers/:id/rewrite, GET /answers/:id/rewrite

## Conventions

- Error envelope: `{ success: false, error: { code, message, details? } }`
- Success envelope: `{ success: true, data: T, meta?: { total, page, limit } }`
- HTTP status: 200/201/400/401/403/404/409/422/429/500
- SSE events: `question_ready`, `followup_ready`, `feedback_ready`, `session_ended`, `error`
- Reference HLD §7 cho full endpoint list — không duplicate ở đây