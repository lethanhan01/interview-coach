# Backend Refactoring Progress

**Master plan:** [BACKEND_REFACTORING_MASTER_PLAN.md](./BACKEND_REFACTORING_MASTER_PLAN.md)  
**Last updated:** 2026-08-10  
**Current phase:** Phase 0 — awaiting confirmation to start RF-007  
**Overall status:** In progress

## Current snapshot

- The current master plan is explicitly planning-only; no RF task is marked complete in its checklist.
- The earlier “Season 2” roadmap (Phase 0–10) was completed before this master plan was created. Its completed items are useful context and test coverage, but are **not** evidence that any RF-001–RF-017 task below is complete.
- Working tree was clean when this file was created, before adding this file.

## Next action

After confirmation, start **RF-007 — boundary rules and narrow exports**. It may proceed before the Phase 1 fixes and is required before RF-008.

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
| RF-007 | 0 — boundaries | Not started | Can proceed alongside RF-001; prerequisite for RF-008. |
| RF-002 | 1 — auth | Blocked by RF-001 + policy | Remove phantom `emailVerified` contract only after approval. |
| RF-003 | 1 — profile | Blocked by RF-001 | Profile currently returns Prisma `User`. |
| RF-004 | 1/3 — media | Blocked by RF-001 + migration decision | Audio currently uses a public URL as identity. |
| RF-005 | 1 — SSE | Blocked by RF-001 | Current SSE route has token auth but no session-owner check. |
| RF-006 | 1 — throttling | Blocked by RF-001 + rate policy | |
| RF-008 | 2 — outbox | Blocked by RF-001 + RF-007 | Session creation currently commits DB state before queue publish. |
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
