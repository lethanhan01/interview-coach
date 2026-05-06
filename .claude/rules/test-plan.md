---
paths:
  - "docs/test-plan/**/*.md"
---

## Test Strategy Document Structure
Every strategy doc must cover these sections:
1. **Scope** — what is in/out of test scope for this phase
2. **Approach** — testing philosophy and methodology
3. **Levels** — unit, integration, E2E (see pyramid below)
4. **Environments** — local, staging, production; data strategy per env
5. **Tools** — test framework, assertion library, reporting (fill in Implementation phase)
6. **Roles** — who writes, who reviews, who signs off
7. **Risks** — what could undermine test coverage; mitigations

## Test Case Format
Each TC must have:
- **ID**: TC-XXX
- **Linked to**: FR-XXX / US-XXX
- **Preconditions**: system state before test runs
- **Steps**: numbered, one action per step
- **Expected result**: observable, specific outcome
- **Type**: positive / negative / boundary
- **Automation status**: manual / automated / TBD

## Test Pyramid Guidance
- **Unit** (most): pure logic, no I/O, fast — aim for broad coverage
- **Integration** (some): service boundaries, DB queries, external API contracts
- **E2E** (few): critical happy paths only — slow, expensive, fragile

Don't write E2E tests for scenarios already covered by unit or integration tests.

## Non-Functional Test Approach
- **Performance**: define load profile (concurrent users, RPS) before writing scenarios
- **Security**: OWASP Top 10 checklist; auth boundary tests per endpoint
- **Accessibility**: WCAG 2.1 AA for UI-facing flows (UI/UX phase)

## Traceability Rule
- Every FR with priority MUST must have ≥1 TC before phase exit.
- Reference docs/traceability-matrix.md — keep it in sync when adding TCs.

## Don't
- Don't write test code yet — this phase produces scenarios only (Given/When/Then prose).
- Don't assign automation status until Implementation phase tooling is decided.
- Don't create TCs for WON'T requirements.
