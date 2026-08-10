# Phase 6 — Reporting workflow

**Mục tiêu:** làm rõ report read/query, readiness coordination và generation workflow, vẫn để Reporting là context riêng tiêu thụ Assessment.

## Current state và ràng buộc

`ReportService` vừa assemble response, count feedback progress, enqueue deduplicated report và decide readiness. `ComprehensiveReportProcessor` trong AI tạo nhiều report records, complete session và publish `report.ready`.

Giữ report type/version selection, report quality semantics, `report-${sessionId}` dedup/retry/delay, session completion/overall score update và API response exactness.

## Nhiệm vụ

- [x] Split nội bộ `ReportService` thành read/progress facade, request generation và readiness policy methods.
- [x] Extract `GenerateComprehensiveReport`: build projection, prompt/input validation, persist all report records, calculate overall score, mark session completed, emit event.
- [x] Move report processor/DTO vào Reporting with exactly one consumer for `comprehensive-report`.
- [x] Keep readiness direct in-process callback first; không phát sinh circular dependency nên không cần `FeedbackCompleted` notification.
- [x] Giữ tên thư mục `report`; physical rename không phải deliverable độc lập.
- [x] Delete old AI processor/provider exports sau khi consumer, controller và integration tests pass.

## Test bắt buộc

- Report unavailable/pending/partial/full; skipped answer model answer handling; latest report version selection.
- Feedback completes before and after session completes; duplicate feedback/report job; failed job retry; no answer.
- Session state/overall score and `report.ready` payload exactly.

## Exit criteria

- Reporting owns report worker/readiness/query behavior without a cycle to Assessment.
- No duplicate report enqueue under replay/race tests.
- REST report and queue/SSE contracts pass.
