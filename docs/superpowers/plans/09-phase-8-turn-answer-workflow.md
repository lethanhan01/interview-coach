# Phase 8 — Turn/answer workflow decomposition

**Mục tiêu:** làm tách bạch text answer, voice answer, skip và transcription retry; giữ shared authorization/idempotency ở một chỗ.

## Current state và ràng buộc

`TurnService` xử lý upload authorization, text/voice/skip, activate session, upsert/dedup answer, edited/retry voice transcription và enqueue feedback. It imports `AiModule` chỉ để dùng provider exposure hiện có.

Giữ unique/upsert semantics theo session/question, job IDs `feedback-${answerId}`/`transcription-${answerId}`, feedback/transcription queue payload, status activation và response DTO.

## Nhiệm vụ

- [ ] Extract shared loader/guard for session owner, eligible status and question membership; no copy-paste across use cases.
- [ ] Extract `SubmitTextAnswer` and shared feedback job builder.
- [ ] Extract `SubmitVoiceAnswer`, preserving transcript-provided vs queued transcription paths.
- [ ] Extract `SkipQuestion`, including repeat skip and feedback exclusion semantics.
- [ ] Extract `RetryTranscription`, including done/failed behavior and deterministic job ID.
- [ ] Change Turn module dependency from `AiModule` to Interview/Assessment/Question explicit dependencies as prior phases permit.
- [ ] Keep `TurnService` facade until controller contract has migrated; then remove it and unused providers.

## Test bắt buộc

- Replay/concurrent submit for same question; text/voice validation; edited voice; transcript done vs failed retry; skipped and existing answers.
- Feedback/transcription jobs exact payload/options and no duplicate enqueue.
- REST status/body and authorization across all paths.

## Exit criteria

- Turn has no dependency on the legacy AI business module.
- Each route path has direct unit/integration contract coverage.
- No change to dedup, upsert, queue or activation behavior.
