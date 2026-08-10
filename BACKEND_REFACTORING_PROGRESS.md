# Backend Refactoring Progress

**Master plan:** [BACKEND_REFACTORING_MASTER_PLAN.md](./BACKEND_REFACTORING_MASTER_PLAN.md)  
**Last updated:** 2026-08-10  
**Current phase:** Phase 1 — RF-007 complete; awaiting confirmation for the next task
**Overall status:** In progress

## Current snapshot

- RF-001 and RF-007 are complete. The Phase 0 safety and dependency baseline is now in place.
- The earlier “Season 2” roadmap (Phase 0–10) was completed before this master plan was created. Its completed items are useful context and test coverage, but are **not** evidence that any RF-001–RF-017 task below is complete.
- Working tree was clean when this file was created, before adding this file.

## Next action

After confirmation, start **RF-003 — public profile projection**, the next unblocked P0 security task. RF-002 remains pending the email-verification policy decision; RF-005 may follow RF-003.

## Required decisions before dependent work

| Decision | Needed before | Current state |
| --- | --- | --- |
| Removing the unsupported email-verification gate is the intended product policy | RF-002 | Pending approval |
| Private-audio migration window and client compatibility contract | RF-004 / RF-010 | Pending approval |
| Rate limits for auth, session creation and audio upload | RF-006 | Pending traffic policy |
| Whether active saved job descriptions must be unique by user/company/title | RF-012 | Pending product decision and data inventory |

## RF task tracker

| ID | Phase | Status | Evidence / notes |
| --- | --- | --- | --- |
| RF-001 | 0 — safeguard | Complete | HTTP/profile regression characterization, public-audio contract, existing lifecycle/SSE/auth coverage, and PostgreSQL+Redis duplicate-dispatch test added; see log. |
| RF-007 | 0 — boundaries | Complete | Static CI boundary test added; Health controller no longer imports Prisma; Question module no longer re-exports child modules. |
| RF-002 | 1 — auth | Blocked by policy | Remove phantom `emailVerified` contract only after approval. |
| RF-003 | 1 — profile | Not started | Prerequisite met; profile currently returns Prisma `User`. |
| RF-004 | 1/3 — media | Blocked by RF-001 + migration decision | Audio currently uses a public URL as identity. |
| RF-005 | 1 — SSE | Not started | Prerequisite met; current SSE route has token auth but no session-owner check. |
| RF-006 | 1 — throttling | Blocked by rate policy | |
| RF-008 | 2 — outbox | Not started | Prerequisites met; session creation currently commits DB state before queue publish. |
| RF-009 | 2 — dispatch/recovery | Blocked by RF-008 | |
| RF-010 | 3 — transcription | Blocked by RF-004 + RF-008 | |
| RF-011 | 3 — runtime roles | Blocked by RF-009 | |
| RF-012 | 4 — data invariants | Pending decision | |
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
