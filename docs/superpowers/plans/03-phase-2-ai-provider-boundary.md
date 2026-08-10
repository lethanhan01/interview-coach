# Phase 2 — Cô lập OpenAI/provider boundary

**Mục tiêu:** feature logic không biết OpenAI SDK; giữ nguyên resilience và hành vi AI hiện tại qua facade tương thích.

## Current state và ràng buộc

`src/ai/openai.gateway.ts` vừa tạo chat/audio client, chọn model/timeout, retry/quota/rate-limit, repair structured JSON/truncation và transcribe. Tất cả model selection, AbortSignal timeout, quota cooldown, retry 429, repair/logging hiện tại là contract behavior cần giữ.

## Nhiệm vụ

- [x] Characterize tests cho chat completion và transcription trên `OpenAIGateway`: task model, timeout, 429/quota, invalid/embedded/fenced JSON, trailing comma/single quote, truncation retry, empty response.
- [x] Extract `OpenAIChatClient` chỉ chứa OpenAI chat SDK/protocol invocation.
- [x] Extract `OpenAITranscriptionClient` chỉ chứa OpenAI audio SDK/protocol invocation.
- [x] Giữ shared provider policy trong facade; không tách `RetryPolicy`/JSON parser vì không có reuse độc lập.
- [x] Giữ `OpenAIGateway` delegate để caller không phải migrate đồng thời.
- [x] Chưa có caller cần boundary token; không thêm `StructuredLlmClient`/`SpeechToText` trước thời điểm cần thiết.
- [x] Prompt building, Zod schemas, fallback semantic và scoring vẫn ở feature caller.
- [x] Không migrate consumer hoặc xóa facade trong phase này vì chưa có importer nào cần thay đổi.

## Không làm

- Không thêm multi-provider factory, config registry hay một port riêng cho Question/Feedback/Report chỉ để đổi tên method.
- Không đổi default model/config/env variable và không đổi prompt version.

## Exit criteria

- Không còn OpenAI SDK import ngoài provider infrastructure/facade.
- Gateway unit tests + consumer integration tests pass, output/error semantics như baseline.
- A changed caller can be reverted về facade bằng một import/DI binding, không ảnh hưởng queue contract.
