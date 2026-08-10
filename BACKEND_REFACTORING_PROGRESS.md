# Backend Refactoring Progress

**Master plan:** [BACKEND_REFACTORING_MASTER_PLAN.md](./BACKEND_REFACTORING_MASTER_PLAN.md)  
**Last updated:** 2026-08-10  
**Current phase:** Phase 2 complete — RF-011 is the next unblocked implementation task
**Overall status:** In progress

## Current snapshot

- RF-001, RF-007, RF-003, RF-005, RF-008 and RF-009 are complete. The Phase 0 baseline is in place; profile responses and session SSE streams now enforce their intended security boundaries; session/report workflow commands are recorded durably with their database transitions and are dispatched/recovered through the outbox.
- Product decisions on 2026-08-10 retain email verification as a future feature, defer audio transcription as a future feature, and permit duplicate active saved job descriptions with the same user/company/title. These supersede the earlier pending assumptions in the master plan.
- The earlier “Season 2” roadmap (Phase 0–10) was completed before this master plan was created. Its completed items are useful context and test coverage, but are **not** evidence that any RF-001–RF-017 task below is complete.
- Working tree was clean when this file was created, before adding this file.

## Next action

After reviewing RF-009, start **RF-011 — separate runtime roles and formalize queue operations**. In parallel, define the future email-verification feature and obtain the still-pending private-audio migration and rate-limit policies. Keep new work isolated from the unrelated working-tree changes currently affecting the full test baseline.

## Required decisions before dependent work

| Decision | Needed before | Current state |
| --- | --- | --- |
| Email verification is retained as a future product feature; decide its rollout and interim access behavior | RF-002 | Product policy confirmed; feature scope/design pending |
| Private-audio migration window and client compatibility contract | RF-004 | Pending approval; audio transcription (RF-010) is deferred |
| Rate limits for auth, session creation and audio upload | RF-006 | Pending traffic policy |
| Whether active saved job descriptions must be unique by user/company/title | RF-012 | Resolved: duplicates are allowed; do not add that unique index |

## RF task tracker

| ID | Phase | Status | Evidence / notes |
| --- | --- | --- | --- |
| RF-001 | 0 — safeguard | Complete | HTTP/profile regression characterization, public-audio contract, existing lifecycle/SSE/auth coverage, and PostgreSQL+Redis duplicate-dispatch test added; see log. |
| RF-007 | 0 — boundaries | Complete | Static CI boundary test added; Health controller no longer imports Prisma; Question module no longer re-exports child modules. |
| RF-002 | 1 — auth | Deferred — future feature | Retain the `emailVerified` requirement. A real verification feature, including its canonical runtime contract and rollout policy, must be scoped before changing the gate. |
| RF-003 | 1 — profile | Complete | Explicit public DTO/select/map now returns only profile fields used by the client; credential/internal fields are excluded and covered by unit + HTTP tests. Changes are uncommitted. |
| RF-004 | 1/3 — media | Blocked by private-audio migration decision | Audio currently uses a public URL as identity. |
| RF-005 | 1 — SSE | Complete | SSE controller now calls the existing session ownership helper before subscribing; owner, cross-user denial, missing-token and invalid-token coverage passes. Changes are uncommitted. |
| RF-006 | 1 — throttling | Blocked by rate policy | |
| RF-008 | 2 — outbox | Complete | Additive `workflow_outbox` schema and `WorkflowService` command writer now run inside the session creation/completion transaction. PostgreSQL integration coverage verifies rollback and concurrent idempotency. Changes are uncommitted. |
| RF-009 | 2 — dispatch/recovery | Complete | Outbox dispatcher atomically claims question/report commands, uses deterministic BullMQ job IDs, retries Redis failures with bounded backoff, and reclaims stale processing claims. PostgreSQL+Redis duplicate-dispatch coverage passes. Changes are uncommitted. |
| RF-010 | 3 — transcription | Deferred — future feature | Do not implement the queued-transcription migration in this refactor until the feature is approved and specified. |
| RF-011 | 3 — runtime roles | Ready to start | RF-009 is complete. |
| RF-012 | 4 — data invariants | Partially resolved | Duplicate active saved job descriptions are intentional; skip the proposed uniqueness constraint. Evaluate lifecycle invariants separately after RF-009. |
| RF-013 | 4 — correlation | Not started | RF-008 is preferred first. |
| RF-014 | 4 — operations | Blocked by RF-009 + RF-013 | |
| RF-015 | 4 — performance | Blocked by RF-011 + baseline | |
| RF-016 | 5 — decomposition | Blocked by RF-009 + RF-010 | |
| RF-017 | 5 — cleanup | Blocked by RF-002/003/004/009/010/012 and observation window | |

## Update rule

For every completed slice, update its row with the commit/PR, files changed, validation commands and result, contract/migration impact, rollback path, and one concrete next action. Mark a task complete only after its definition of done in the master plan is met.

## Execution log

### 2026-08-10 — RF-001 characterization safety net

- Status: Complete.
- Changed: added a PostgreSQL+Redis integration test for concurrent report dispatch; enabled the integration test environment; characterized the legacy public-audio URL response; added an HTTP regression test that currently records profile credential exposure as an expected failing condition.
- Contract/migration impact: test-only. No production behavior, API, queue payload, schema, or migration changed.
- Validation: `npm run build` — pass; `npm test -- --runInBand` — pass (47 suites, 407 tests); `npm run test:integration -- --runInBand` — pass (2 suites, 2 tests); `npm run test:e2e -- --runInBand` — pass (1 suite, 2 tests); `git diff --check` — pass.
- Known regression: the profile secrecy test uses `it.failing` because the current endpoint still returns `passwordHash` and `tokenVersion`. Convert it to a regular passing contract test in RF-003.
- Rollback: revert the four test/config changes; no runtime or data rollback is required.
- Next action: wait for confirmation, then start RF-007.

### 2026-08-10 — RF-007 boundary rules and narrow exports

- Status: Complete; changes are in the working tree and not yet committed.
- Changed: added `server/src/architecture/feature-boundaries.spec.ts`; moved the database/Redis health check from `HealthController` to `HealthService`; removed `QuestionModule` re-exports of `QuestionBankModule` and `QuestionCriteriaModule`; made `TurnModule` import `QuestionCriteriaModule` directly.
- Contract/migration impact: no API, queue payload, schema, or data migration change. The health endpoint response remains unchanged.
- Validation: `npx eslint "src/**/*.ts" --ignore-pattern "**/*.spec.ts"` — pass; `npm run build` — pass; `npm test -- --runInBand` — pass (48 suites, 409 tests); `npm run test:integration -- --runInBand` — pass (2 suites, 2 tests); `npm run test:e2e -- --runInBand` — pass (1 suite, 2 tests); `git diff --check` — pass.
- Boundary rule: CI now rejects controller imports of Prisma, BullMQ/Queue, OpenAI, or Supabase, and rejects new nested cross-feature relative imports. The test documents the small approved legacy contract list that still lacks dedicated public entry points.
- Rollback: revert the architecture test, health-service extraction, and Question/Turn module import changes together; no data or deployment rollback is required.
- Next action: wait for confirmation, then start RF-003. RF-002 remains blocked until the email-verification policy is approved.

### 2026-08-10 — RF-003 public profile projection

- Status: Complete; changes are in the working tree and not yet committed.
- Changed: added explicit Swagger response DTOs for the public profile contract; changed `UserService.getProfile()` to Prisma-select and map only `id`, `email`, `firstname`, `lastname`, and the client-used profile fields; documented the contract; converted the RF-001 HTTP secrecy regression from `it.failing` to a passing test; strengthened unit coverage against accidental secret/internal-field return.
- Contract/migration impact: intentional security response contraction for `GET/PATCH /profile`: removes `passwordHash`, `tokenVersion`, role/status/timestamps, profile record identifiers, and other internal relations. The checked client contract uses only the retained fields. No schema or data migration.
- Validation: `npx eslint "src/**/*.ts" --ignore-pattern "**/*.spec.ts"` — pass; `npm run build` — pass; `npm test -- --runInBand` — pass (48 suites, 409 tests); `npm run test:integration -- --runInBand` — pass (2 suites, 2 tests); `npm run test:e2e -- --runInBand` — pass (1 suite, 2 tests); `git diff --check` — pass.
- Rollback: revert the User service/DTO/controller/test/documentation changes; no DB or deployment rollback is required.
- Next action: start RF-005 — apply the existing session ownership check to SSE subscriptions and extend the cross-user HTTP/SSE tests.

### 2026-08-10 — RF-005 SSE ownership authorization

- Status: Complete; changes are in the working tree and not yet committed.
- Changed: made the session SSE controller verify ownership through the existing `SessionService.findById()` helper before subscribing, and documented the resulting 401/403/404 responses. Added controller coverage that denies a failed ownership check without subscribing and HTTP coverage for cross-user, missing-token and invalid-token denial.
- Contract/migration impact: no schema, queue, storage or data migration. `GET /sessions/:id/events` now returns the same ownership denial as the Session API instead of opening another user's channel.
- Validation: `npx jest src/session/session.controller.spec.ts --runInBand` — pass (9 tests); `npm run build` — pass; `npm run test:e2e -- --runInBand` — pass (1 suite, 2 tests); `git diff --check` — pass. Full `npm test -- --runInBand` currently has 5 unrelated failures in uncommitted `FeedbackProcessor` changes (`tx.userAnswer.findUnique` is absent from their test doubles), and `npx eslint "src/**/*.ts" --ignore-pattern "**/*.spec.ts"` currently has 2 unrelated unused-catch-variable errors in uncommitted `QuestionBankService` changes. Integration tests pass (2 suites, 2 tests).
- Rollback: revert the controller/test changes; no DB or deployment rollback is required.
- Next action: obtain the pending product decisions for RF-002/RF-004/RF-006; if work proceeds without them, begin RF-008 in an isolated change after reconciling the unrelated working-tree changes.

### 2026-08-10 — RF-008 transactional workflow outbox schema and command contract

- Status: Complete; changes are in the working tree and not yet committed.
- Changed: added the additive `workflow_outbox` Prisma model and SQL table/indexes; added the small `WorkflowService` transaction command writer with stable per-command/session idempotency keys; made session creation and transition to `completing` record question/report commands in the same transaction as their session state. Existing direct queue publishing remains as the temporary RF-009 cutover path.
- Contract/migration impact: additive database schema only; no HTTP, client, or queue-payload contract removal. The local PostgreSQL integration database was synchronized with the additive schema using `prisma db push`; production migration remains the checked-in SQL change and has not been applied by this work.
- Validation: `npm test -- --runInBand workflow/workflow.service.spec.ts session/session.service.spec.ts` — pass (2 suites, 40 tests); `npm run test:integration -- --runInBand` — pass (3 suites, 3 tests), including PostgreSQL rollback and concurrent idempotency coverage; `npm run build` — pass; scoped ESLint for workflow/session production files — pass; `git diff --check` — pass. Full `npm test -- --runInBand` has 5 unrelated existing failures in uncommitted FeedbackProcessor work (`tx.userAnswer.findUnique` is absent from test doubles); 47 suites / 406 tests pass.
- Rollback: the table is additive. Disable the future dispatcher/cutover path and retain existing direct queue publishing; retain outbox records for recovery and do not drop the table in rollback.
- Next action: start RF-009 — add a dispatcher/reconciler that claims due commands safely, sends deterministic BullMQ jobs, and leaves Redis failures retryable.

### 2026-08-10 — Product decisions recorded

- Email verification remains a product requirement and will be developed as a future feature. Do not remove the `emailVerified` gate as originally proposed; the feature needs a separate implementation/rollout decision, including what access is expected before a user is verified.
- Audio transcription is a future feature. Defer RF-010; retain the private-audio migration decision as a separate open item for RF-004.
- A user may keep multiple active saved job descriptions with the same company and title. Do not deduplicate existing rows or add the proposed partial unique index; only separately approved lifecycle constraints remain in RF-012 scope.

### 2026-08-10 — RF-009 outbox dispatch and recovery

- Status: Complete; changes are in the working tree and not yet committed.
- Changed: added `WorkflowDispatcher`, registered it with the existing question/report queues, and moved session creation/completion and report-readiness dispatch away from direct `Queue.add()` calls. It atomically claims due commands, publishes deterministic `workflow-<outbox-id>` jobs, records completion, retries Redis/queue errors with bounded exponential backoff, marks terminal failure after five attempts, and reclaims `processing` claims older than five minutes. Report commands remain pending until every non-skipped answer has feedback.
- Contract/migration impact: no new schema or HTTP/client contract. Uses the additive RF-008 table. Question/report queue jobs now carry a deterministic outbox-derived job ID; their payload shapes remain compatible. Audio/feedback/transcription queues are unchanged.
- Validation: scoped production ESLint — pass; `npm run build` — pass; scoped Jest (`workflow`, `session`, `report`) — pass (4 suites, 71 tests); `npm run test:integration -- --runInBand` — pass (3 suites, 3 tests), including PostgreSQL+Redis duplicate dispatch; `npm run test:e2e -- --runInBand` — pass (1 suite, 2 tests); `git diff --check` — pass. Full `npm test -- --runInBand` has the same 5 unrelated `FeedbackProcessor` test-double failures (`tx.userAnswer.findUnique` absent); 48 suites / 407 tests pass. Full production ESLint has the same 2 unrelated unused catch variables in `QuestionBankService`.
- Operator replay: inspect a failed command, then run `UPDATE workflow_outbox SET state = 'pending', attempts = 0, available_at = now(), error_summary = NULL WHERE id = '<workflow-command-uuid>' AND state = 'failed';`. The dispatcher polls every 30 seconds; deterministic job IDs make a replay safe after a crash between queue submission and outbox completion marking.
- Rollback: deploy the previous direct-dispatch release; retain the additive outbox table and its records. Do not delete commands during rollback; they remain available for forensic inspection or controlled replay.
- Next action: review/commit RF-009, then begin RF-011 — API-only/worker-only runtime roles and queue operations.
