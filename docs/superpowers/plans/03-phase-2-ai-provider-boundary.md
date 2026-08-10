# Phase 2 — Cô lập OpenAI/provider boundary

**Mục tiêu:** feature logic không biết OpenAI SDK; giữ nguyên resilience và hành vi AI hiện tại qua facade tương thích.

## Current state và ràng buộc

`src/ai/openai.gateway.ts` vừa tạo chat/audio client, chọn model/timeout, retry/quota/rate-limit, repair structured JSON/truncation và transcribe. Tất cả model selection, AbortSignal timeout, quota cooldown, retry 429, repair/logging hiện tại là contract behavior cần giữ.

## Nhiệm vụ

- [ ] Characterize tests cho chat completion và transcription trên `OpenAIGateway`: task model, timeout, 429/quota, invalid/embedded/fenced JSON, trailing comma/single quote, truncation retry, empty response.
- [ ] Extract `OpenAIChatClient` chỉ chứa OpenAI chat SDK/protocol invocation.
- [ ] Extract `OpenAITranscriptionClient` chỉ chứa OpenAI audio SDK/protocol invocation.
- [ ] Move shared provider policy vào facade hoặc shared helper nhỏ; chỉ tách `RetryPolicy`/JSON parser thành class nếu chat và audio thật sự dùng chung hoặc test độc lập cần nó.
- [ ] Giữ `OpenAIGateway` delegate để caller không phải migrate đồng thời.
- [ ] Khi caller đầu tiên cần boundary, introduce token/type nhỏ `StructuredLlmClient` và `SpeechToText`; adapter implement token đó.
- [ ] Đảm bảo prompt building, Zod schemas, fallback semantic và scoring không bị chuyển vào generic provider client.
- [ ] Migrate một consumer một lần, xóa facade chỉ khi search xác nhận không còn import.

## Không làm

- Không thêm multi-provider factory, config registry hay một port riêng cho Question/Feedback/Report chỉ để đổi tên method.
- Không đổi default model/config/env variable và không đổi prompt version.

## Exit criteria

- Không còn OpenAI SDK import ngoài provider infrastructure/facade.
- Gateway unit tests + consumer integration tests pass, output/error semantics như baseline.
- A changed caller can be reverted về facade bằng một import/DI binding, không ảnh hưởng queue contract.
