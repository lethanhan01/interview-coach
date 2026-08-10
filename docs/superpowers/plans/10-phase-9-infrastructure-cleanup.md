# Phase 9 — Infrastructure placement và cross-context cleanup

**Mục tiêu:** phản ánh ownership đã được chứng minh vào tree/module imports; xóa façade cũ và giải quyết dependency cycle, không làm folder move thuần túy trước đó.

## Nhiệm vụ

- [ ] Move Redis `SseService` implementation tới `infrastructure/realtime/redis`; expose narrow publish/subscribe contract, preserve Observable behavior.
- [ ] Move Prisma connection, timezone, connection error helpers tới `infrastructure/database/prisma` sau Rubric split; maintain existing global provider behavior until explicit module migration done.
- [ ] Centralize BullMQ registration/constants only if it eliminates real duplication while feature retains processor ownership; do not hide queue ownership in giant infra module.
- [ ] Audit static imports and Nest module graph for cycles, duplicate processor registrations, dead exports and legacy `AiModule` imports.
- [ ] For each cross-context side effect, record direct-call or notification decision, idempotency key and retry/failure semantics in progress log/ADR.
- [ ] Delete compatibility facades only after search confirms zero caller and all relevant tests pass.
- [ ] Run a mechanical move as separate PR from semantic extraction, update path imports and check no production behavior changes.

## Contract checks

- SSE exact channel/events/payload and unsubscribe behavior.
- Redis/BullMQ startup configuration and worker enablement behavior.
- Prisma connect/retry/timezone/database error mapping.
- Build, full test suite and module dependency audit.

## Exit criteria

- No business-owned `AiModule`, no business catalog exported by Prisma, no circular module dependency, no duplicate worker consumer.
- Tree reflects Question, Interview, Assessment, Reporting and infrastructure ownership.
- All temporary facade/alias/dead provider deletions are evidence-backed and merged separately where practical.
