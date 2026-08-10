# Phase 7 — Session lifecycle decomposition

**Mục tiêu:** giảm `SessionService` theo cohesive behavior, không đổi controller/API và không đổi lifecycle semantics.

## Current state và ràng buộc

`SessionService` làm creation limit, rubric lookup, saved JD ownership, persistence, question enqueue, queries, activation, transitions, auto-skip, report enqueue/rollback. Status được lưu string; phase này không đổi enum/schema.

## Nhiệm vụ

- [ ] Extract pure `SessionLifecyclePolicy` (allowed transition + precondition), driven by Phase 0 characterization table.
- [ ] Extract `CreateInterviewSession`: creation limit, saved-JD check, active rubric lookup, persistence, question enqueue and compensation to `error` on enqueue failure.
- [ ] Extract read paths only when independently useful: `GetInterviewSession`, `ListInterviewSessions`, `GetSessionQuestions`.
- [ ] Extract `CompleteInterviewSession` and `ChangeInterviewSessionStatus`: answered rule, auto-skip transaction, `completing`, readiness enqueue and rollback to active on failure.
- [ ] Retain a thin `SessionService` facade until controllers/callers are migrated; remove it after no importer remains.
- [ ] Check question worker race against active/canceled/error session and report enqueue race against completing session.

## Không làm

- Không đổi values status, không force state-machine library, không đổi duration/remaining-seconds semantics.
- Không làm controller inject a class per endpoint nếu feature facade còn nhỏ và rõ ràng.

## Test bắt buộc và exit criteria

- Full transition table, owner check, creation limit, no questions/incomplete completion, auto-skip, queue failure compensation.
- Existing session endpoints/status/questions and report readiness pass unchanged.
- Constructor dependencies become focused; old service deleted only after facade no longer adds compatibility value.
