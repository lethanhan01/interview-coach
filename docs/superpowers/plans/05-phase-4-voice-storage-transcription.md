# Phase 4 — Voice, storage và transcription

**Mục tiêu:** tách storage artifact, speech provider và interview orchestration mà không thay API voice hiện có.

## Current state và ràng buộc

`AudioStorageService.uploadInterviewAudio()` upload Supabase rồi gọi `WhisperService.transcribe()`. `WhisperService` download URL, enforce allowed HTTPS host/no-IP/no-redirect/MIME/stream limit rồi gọi `OpenAIGateway`. `TranscriptionProcessor` ở AI có path queue riêng. Vì vậy có hai supported path: upload đồng bộ trả transcript và queued transcription/retry sau submit.

Không bỏ validation download dù upload đã validate; queue có thể nhận URL không tin cậy và đây là SSRF boundary.

## Nhiệm vụ

- [ ] Define `AudioObjectStorage` adapter: upload -> immutable object URL/metadata, không import STT.
- [ ] Giữ/tạo `UploadAndTranscribeAnswerAudio` orchestration service để endpoint audio giữ response `audioFileUrl`, size, transcript, duration.
- [ ] Move Whisper behavior vào `SpeechToText` OpenAI adapter/compatibility facade; retain all URL and streaming validations.
- [ ] Đưa `VoiceMetricsService`, transcription job DTO/processor về Interview ownership.
- [ ] Extract `TranscribeAnswer`: load URL -> STT -> persist transcript/metrics -> enqueue feedback, hoặc fallback/failed behavior -> emit event.
- [ ] Preserve `transcription-${answerId}` job ID, attempts/backoff, feedback payload, retry behavior và `turn.transcription_ready` payload.
- [ ] Verify storage object naming/bucket/public URL contract unchanged before considering signed URL product work.

## Test bắt buộc

- Upload happy path; invalid/missing file, MIME, >10 MB, storage error.
- Disallowed protocol/credentials/IP/host, redirect, bad response/MIME/oversized stream/no body.
- Immediate transcript path và queue/retry path; transcription success/failure feedback behavior/event exactness.

## Exit criteria

- Storage không import speech; speech không import Session/Turn business service.
- Interview owns transcription worker; no duplicate worker registration.
- Security tests và voice REST/queue/SSE contracts pass.
