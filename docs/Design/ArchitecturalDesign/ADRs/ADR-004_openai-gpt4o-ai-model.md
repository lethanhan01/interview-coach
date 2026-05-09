# ADR-004: OpenAI GPT-4o as Primary AI Model

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-004 |
| **Ngày** | 09/05/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

InterviewAI AI pipeline thực hiện 5 loại task LLM:

1. **Question generation**: sinh câu hỏi contextual từ JD + CV + taxonomy filter + session type (HR/Technical/Mixed)
2. **Follow-up trigger evaluation**: đánh giá transcript partial, quyết định trigger nào active (T1-T8, S1-S2 theo session type spec §1.8, §2.8, §3.6)
3. **Rubric scoring**: chấm điểm transcript theo D1-D6 (behavioral) hoặc TD1-TD5 (technical) — output phải là structured JSON
4. **Surgical Feedback annotation**: map feedback tới span cụ thể trong transcript — output JSON với position offsets
5. **Comprehensive Report generation**: tổng hợp toàn session (UC-05) — Executive Summary, Comm Analysis, Competency Heatmap, Action Plan

Constraint chung: output nhiều task (3, 4) phải là valid JSON có thể parse trực tiếp, không cần retry hay repair logic. Ngôn ngữ output: tiếng Việt chất lượng phỏng vấn professional cho fresher/sinh viên CNTT VN.

Các lựa chọn được cân nhắc:

- OpenAI GPT-4o
- Google Gemini 1.5 Pro / 2.0 Flash
- Anthropic Claude 3.5 Sonnet
- Local models: Llama 3, Mistral, Gemma (self-hosted)

## Decision

**Chọn OpenAI GPT-4o.**

Lý do:

1. **JSON mode (`response_format: { type: "json_object" }`)**: đảm bảo output là valid JSON trong mọi trường hợp — critical cho rubric scoring pipeline và annotation engine. Không cần regex repair hoặc retry-on-parse-error logic.

2. **Vietnamese quality**: GPT-4o sinh tiếng Việt tự nhiên ở register phỏng vấn professional — câu hỏi, follow-up, feedback annotation dùng "anh/chị – em" đúng context, thuật ngữ kỹ thuật mix tiếng Anh hợp lý (theo §5.5 session type spec).

3. **Function calling / tool use**: cho dynamic question generation với structured parameters (`taxonomy_filter`, `difficulty`, `time_budget`, `exclude_ids`) — response guaranteed conform schema.

4. **Context window 128k tokens**: đủ để inject JD + CV + full session transcript (~15-30k tokens) + rubric definitions + system prompt trong 1 call cho Comprehensive Report (UC-05). Không cần chunking phức tạp.

5. **openai npm SDK**: TypeScript-first, streaming support (`stream: true` cho real-time follow-up display), built-in retry với exponential backoff, type-safe response objects — native cho NestJS stack (ADR-002, ADR-005).

Tại sao không Gemini:

- TypeScript SDK ít mature hơn Python SDK; breaking changes thường hơn trong năm qua
- `response_mime_type: "application/json"` ít reliable hơn OpenAI JSON mode trong production (dựa trên community reports, không phải benchmark chính thức)
- Vietnamese register phỏng vấn professional chưa được verify thực tế như GPT-4o

Tại sao không Claude (Anthropic):

- Không có JSON mode tương đương — force structured output cần tool use (phức tạp hơn, thêm token overhead)
- Cost cao hơn ở cùng performance tier cho high-volume structured output
- SDK TypeScript có nhưng JSON mode workflow kém streamlined hơn OpenAI

Tại sao không local models:

- Vietnamese quality: Llama 3 / Mistral ở mức fresher CNTT VN kém OpenAI đáng kể — feedback annotation thiếu tự nhiên, gây giảm product value
- Infrastructure: GPU server ngoài phạm vi prototype (cost + ops)
- Latency: CPU inference > 2s/response cho model 7B+ — vi phạm AC-04-2 (≤ 5s first question) và AC-05-1 (≤ 8s feedback report)

## Consequences

**Positive:**

- JSON mode → rubric pipeline không cần fallback JSON repair — simplify error handling
- Vietnamese quality → feedback tự nhiên, annotation đúng ngữ cảnh — ảnh hưởng trực tiếp đến perceived product quality
- openai npm SDK mature → ít thời gian debug thư viện, focus vào prompt engineering

**Negative:**

- **Cost per session**: GPT-4o pricing ~$5/1M input + $15/1M output tokens. Session trung bình ~40-60k tokens (JD + CV + transcript + rubric + report). Estimate: $0.25-$0.75/session. Cần cost monitoring và session limit (S-12: 10 sessions/24h) để control burn rate khi prototype có nhiều user.
- **API dependency**: OpenAI outage → InterviewAI offline. Cần circuit breaker pattern trong `AIModule` và user-facing error message rõ ràng (không crash silently).
- **Model deprecation**: GPT-4o sẽ bị thay thế — model name phải ở trong config (`AI_MODEL=gpt-4o`), không hardcode trong service code. Migration sang model mới = đổi 1 env var + kiểm tra output format.
- **Rate limit**: OpenAI API có tier-based rate limit (tokens per minute). Prototype tier (Tier 1): 30,000 TPM — đủ cho ~10-15 concurrent sessions. Cần queue hoặc upgrade tier khi scale.
