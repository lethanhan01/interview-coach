# Backend Refactoring Checklist

Use this after approval. Do not start a task until its prerequisite and rollback plan are ready.

## Phase 0 — Safety Net

- [ ] **RF-001 — Characterization tests**
  - Prerequisite: none.
  - DoD: CI covers auth/session/report/profile/SSE/audio/outbox-retry critical behavior without a real AI provider.

- [ ] **RF-007 — Boundary rules and narrow exports**
  - Prerequisite: none.
  - DoD: CI rejects controller-to-Prisma/Queue and cross-feature internal imports; module bootstrap passes.

## Phase 1 — P0 Security and Correctness

- [ ] **RF-002 — Canonical auth user contract**
  - Prerequisite: RF-001; approve removal of unsupported email-verification gate.
  - DoD: no `req.user.emailVerified`; owner can access completed history/report.

- [ ] **RF-003 — Public profile projection**
  - Prerequisite: RF-001.
  - DoD: profile response has no password hash/token/internal fields.

- [ ] **RF-004 — Private audio object reference (expand)**
  - Prerequisite: RF-001; approved storage migration/compatibility window.
  - DoD: new audio is private; key is persisted; signed reads work; legacy path remains gated temporarily.

- [ ] **RF-005 — SSE ownership authorization**
  - Prerequisite: RF-001.
  - DoD: non-owner cannot subscribe to a session channel.

- [ ] **RF-006 — Targeted throttling**
  - Prerequisite: RF-001; approved rate policy.
  - DoD: auth/create/upload endpoints reject abusive bursts and allow normal traffic.

## Phase 2 — Durable Workflow

- [ ] **RF-008 — Transactional outbox contract**
  - Prerequisite: RF-001, RF-007.
  - DoD: session/report mutations atomically create one idempotent command.

- [ ] **RF-009 — Dispatcher and reconciler**
  - Prerequisite: RF-008.
  - DoD: crash/Redis outage drills recover question/report work exactly once effectively; replay runbook exists.

## Phase 3 — Async Media and Runtime Roles

- [ ] **RF-010 — Queued transcription**
  - Prerequisite: RF-004, RF-008.
  - DoD: upload HTTP call never waits for transcription; retries/fallbacks preserve answer/report behavior.

- [ ] **RF-011 — API/worker roles and queue policy**
  - Prerequisite: RF-009.
  - DoD: API registers no processors; queues have timeout, retention, retry and replay policy.

## Phase 4 — Data and Operations

- [ ] **RF-012 — Selective data invariants**
  - Prerequisite: duplicate inventory and product decision; RF-009 before lifecycle constraint.
  - DoD: only approved invariant is enforced through backward-compatible migration and verification query.

- [ ] **RF-013 — Correlation and structured logs**
  - Prerequisite: RF-008 preferred.
  - DoD: processor start/success/failure logs include correlation, job, session and workflow IDs with sensitive fields redacted.

- [ ] **RF-014 — Metrics, error operations and audit**
  - Prerequisite: RF-009, RF-013.
  - DoD: dashboard/alert answers queue depth, oldest command, provider error rate and workflow traceability.

- [ ] **RF-015 — Measured performance improvements**
  - Prerequisite: RF-011 and a recorded baseline.
  - DoD: each accepted optimization has a before/after metric and compatibility test.

## Phase 5 — Cleanup

- [ ] **RF-016 — Decomposition decision gate**
  - Prerequisite: RF-009, RF-010.
  - DoD: only independently changing responsibility is extracted, or the risk is explicitly accepted.

- [ ] **RF-017 — Remove compatibility paths**
  - Prerequisite: RF-002, RF-003, RF-004, RF-009, RF-010, RF-012; agreed zero-legacy-data observation window.
  - DoD: no direct post-commit queue path/public audio URL/temporary compatibility flag remains; migration verification and rollback tag recorded.
