# Phase 0 — Contract inventory

**Baseline:** `7817d629a337e836ebf14e1e5491f4de2e232dc3`  
**Nguồn:** controllers, DTO và queue/SSE producer trong `server/src/`. Đây là source-of-truth cho các test contract Phase 0; không phải đặc tả product mới.

## Quy ước

- Tất cả REST path bên dưới có prefix toàn cục (hiện cấu hình app) ngoài phần path do controller khai báo.
- `JWT` là `JwtAuthGuard`; SSE dùng `SseTokenGuard`.
- Status lỗi là các status đã được controller khai báo qua Swagger. Test HTTP phải xác nhận status/body thực tế khi tạo harness.
- Không đổi path, HTTP method, success status, DTO field, queue/job name, payload field, job option hoặc event payload trong các PR refactor.

## REST

| Bề mặt | Method + path | Auth | Success | Request / response cần khóa |
| --- | --- | --- | --- | --- |
| Session | `POST /sessions` | JWT | 201 | Body: `jobDescription` (>=100), `sessionType` (`hr`/`technical`/`mixed`), `contextPack` (`VN`/`Western`), `savedJobDescriptionId` UUID; optional `language`, `numQuestions` 3–45, `targetRoles[]`. Response là session tạo mới. |
| Session | `GET /sessions` | JWT | 200 | `{ sessions: SessionResponse[] }`; `SessionResponse`: `id`, `status`, `sessionType`, `contextPackId`, `savedJobDescriptionId?`, `numQuestions`, `jobDescription?`, `createdAt`, `updatedAt`. |
| Session | `GET /sessions/:id` | JWT | 200 | Session read model. Lỗi khai báo: 401/403/404. |
| Session | `GET /sessions/:id/status` | JWT | 200 | `{ status, numQuestions }`. |
| Session | `GET /sessions/:id/questions` | JWT | 200 | Danh sách question đã generate; phải giữ authorization check trước query. |
| Session | `GET /sessions/:id/feedback-progress` | JWT | 200 | Feedback progress read model. |
| Session | `PATCH /sessions/:id/status` | JWT | 200 | Body: `status` (`active`/`paused`/`canceled`/`completed`), optional `remainingSeconds` integer >=0, `autoSkipUnanswered` boolean. |
| Session SSE | `GET /sessions/:id/events` | SSE token | stream | `text/event-stream`, subscribe channel `sse:session:${id}`. |
| Turn | `POST /sessions/:sessionId/turns` | JWT | 201 | Body: `questionId`, `answerMode` (`text`/`voice`), optional `answerText`, `skipQuestion`, `audioFileUrl` HTTPS, duration/size. Response: `{ answerId, feedbackQueued, transcriptionPending }`. |
| Turn audio | `POST /sessions/:sessionId/turns/audio` | JWT | 201 | Multipart field `file`, max 10 MiB; returns current `AudioUploadResult` including upload/transcription metadata. |
| Report | `GET /sessions/:sessionId/report` | JWT | 200 or 202 pending | `ReportResponse`: `sessionId`, `reportQuality`, `overallScore`, `executiveSummary`, `competencyHeatmap`, `actionPlan`, `transcript[]`. 202 represents `REPORT_NOT_READY`. |
| Rubric | `GET /rubrics/:contextPackId?sessionType=` | JWT | 200 | `contextPackId`: `VN`/`Western`; optional session type; returns `{ contextPackId, sessionType, categories, hint }`. |
| Auth | `POST /auth/register` | none | 201 | `email`, password 12–128, `firstname`, `lastname`; sets auth cookie and returns `{ success: true, data: publicUser }`. |
| Auth | `POST /auth/login` | none | 200 | `email`, `password`; sets cookie, same response shape. |
| Auth | `POST /auth/logout` | none | 204 | Clears auth cookie. |
| Auth | `GET /auth/me` | JWT | 200 | `{ success: true, data: publicUser | null }`. |
| Auth | `POST /auth/change-password` | JWT | 200 | Rotates auth cookie; `{ success: true, data: publicUser }`. |
| Auth | `POST /auth/password-reset/request` | none | 204 | Body: email. |
| Auth | `POST /auth/password-reset/confirm` | none | 200 | email, code, new password; sets cookie and returns public user. |

`publicUser` is exactly `id`, `email`, `role`, `status`, `firstname`, `lastname`. Cookie options are `httpOnly`, `sameSite=lax`, root path and `secure` only in production.

## Queue

| Queue / job name | Producer → consumer | Payload fields | Deterministic job ID | Retry/backoff |
| --- | --- | --- | --- | --- |
| `question-generation` / `question-generation` | `SessionService` → `QuestionGenerationProcessor` | `sessionId`, `sessionType`, `jobDescriptionText`, `targetRoles`, `contextPack`, `rubricVersionId`, `language`, `totalQuestions`, `durationMin` | **Không có `jobId`**; không có dedup ở producer hiện tại. | 2 attempts; fixed 2000 ms. |
| `feedback` / `feedback` | `TurnService` or `TranscriptionProcessor` → `FeedbackProcessor` | `sessionId`, `turnId`, `answerId`, optional `questionId`, `questionText`, optional `questionCategory`, `competencyDomains`, `answerText`, `contextPack`, `sessionType`, optional `language` | `feedback-${answerId}` | 2 attempts; fixed 2000 ms. |
| `transcription` / `transcription` | `TurnService` → `TranscriptionProcessor` | `sessionId`, `answerId`, `audioFileUrl`, optional `audioDurationSeconds`, optional `audioSizeBytes`, `contextPack`, `sessionType`, optional `language` | `transcription-${answerId}` | 2 attempts; fixed 3000 ms. |
| `comprehensive-report` / `comprehensive-report` | `ReportService` → `ComprehensiveReportProcessor` | `sessionId`, `sessionType`, `contextPack`, optional `language`, `turnIds` | `report-${sessionId}` | 3 attempts; fixed 3000 ms; producer may set queue delay for readiness retry. |

## SSE

All events publish to `sse:session:${sessionId}`.

| Event | Producer | Payload fields |
| --- | --- | --- |
| `session.status` | Question generation worker | `{ status: 'active' | 'error', sessionId }` |
| `turn.feedback_ready` | Feedback worker | `{ answerId, hasAnnotations }` |
| `turn.transcription_ready` | Transcription worker | `{ answerId }` |
| `session.feedback_progress` | Feedback worker | Exact `ReportService.getFeedbackProgress(sessionId)` projection; characterize its keys before moving reporting code. |
| `report.ready` | Report worker | `{ sessionId }` |

## Lifecycle and security invariants to characterize next

- Stored session status includes `generating`, compatibility `ready`, `active`, `paused`, `completing`, `completed`, `error`, `canceled`. HTTP update accepts only `active`, `paused`, `canceled`, `completed`.
- A new session queues question generation; queue failure marks the session `error`.
- `question-generation` không có dedup/job ID ở baseline. Không thêm `question-${sessionId}` trong refactor; mọi thay đổi dedup phải là contract/product change riêng.
- Completion can auto-skip unanswered turns and must compensate if report enqueue fails.
- Audio upload validates file MIME/size; transcription validates the queued download URL separately (HTTPS/allow-list/no redirect/IP protections). Both checks remain required.
- Text/edited voice answers queue feedback; audio-only voice answers queue transcription, which then queues feedback. Skipped answers do not queue feedback.

## Source references

- REST: `session/session.controller.ts`, `turn/turn.controller.ts`, `report/report.controller.ts`, `ai/rubric.controller.ts`, `auth/auth.controller.ts`.
- Queue: `common/constants/queue.constants.ts`, `session/session.service.ts`, `turn/turn.service.ts`, `report/report.service.ts`, `ai/processors/*`.
- SSE: `session/session.controller.ts`, `ai/processors/*`.
