# Phase 5 — Assessment và feedback ownership

**Mục tiêu:** rubric snapshot, evaluation, weighted score, feedback persistence và feedback worker có owner Assessment rõ ràng.

## Current state và ràng buộc

`BasePipelineService` thực hiện question và evaluate flow. `FeedbackProcessor` đang ở AI, tự persist feedback/annotations, fallback, SSE progress/ready và gọi ReportService. Context pack/dimension matcher/sanitizer/fallback feedback phân tán trong AI.

Không đổi allowed criterion/dimension IDs, weight calculation, segment repair/sanitization, feedback fallback wording, prompt version hoặc write shape `AiFeedback`/`AnnotatedSegment`.

## Nhiệm vụ

- [ ] Move rubric read/context responsibility, dimension matcher, feedback segment sanitizer, fallback feedback vào `assessment/` theo import slice.
- [ ] Review cultural/prompt notes: chỉ tách khỏi rubric snapshot khi lifecycle khác thật; giữ data together nếu cùng versioning.
- [ ] Extract `EvaluateAnswer` from BasePipeline/FeedbackProcessor: resolve allowed dimensions, construct semantic prompt input, validate, weighted score, sanitize and return persistence-ready result.
- [ ] Extract feedback persistence transaction and fallback decision in application service; worker chỉ call use case/retry/emit event.
- [ ] Move `FeedbackProcessor` and payload DTO to Assessment with one queue consumer.
- [ ] Keep direct Report readiness call initially; defer event notification until Reporting split proves direct dependency is cyclic/problematic.
- [ ] Remove BasePipeline inheritance only after question generation no longer needs common behavior; do not create replacement base class.

## Test bắt buộc

- Valid evaluation weighted score; invalid/out-of-scope dimension; malformed segment repair; no annotations.
- Provider failure retry then fallback; persistence upsert/idempotency; skipped answers excluded.
- `turn.feedback_ready` and `session.feedback_progress` payload, readiness call timing and report duplicate prevention.

## Exit criteria

- Assessment is sole owner feedback worker and rubric evaluation logic.
- All score/fallback/segment output equals characterization tests.
- `AiModule` has no feedback business provider/processor remaining.
