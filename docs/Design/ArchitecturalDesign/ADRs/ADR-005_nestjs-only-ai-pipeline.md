# ADR-005: NestJS-only AI Pipeline (No Separate FastAPI Service)

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-005 |
| **Ngày** | 09/05/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

SAD v1.0 (thiết kế ban đầu) có kiến trúc 3 service:

```
Next.js (frontend) → NestJS (API gateway) → FastAPI (Python AI pipeline)
```

Lý do ban đầu chọn FastAPI: AI/ML pipeline truyền thống dùng Python ecosystem — LangChain, pdfplumber, sentence-transformers, HuggingFace Transformers. Tuy nhiên, sau khi phân tích chi tiết SRS và session type spec, các requirement cụ thể của InterviewAI AI pipeline là:

- Gọi OpenAI API với structured prompts (question generation, rubric scoring, annotation, report)
- Extract plain text từ CV file (PDF)
- Orchestrate session flow theo 3 pipeline riêng biệt: HR/Behavioral, Technical Knowledge, Mixed Interview (§5.6 session type spec)
- Anti-repeat logic, sequencing, trigger evaluation (T1-T8, S1-S2)

Không có requirement nào trong SRS hoặc session type spec đòi:

- Local LLM inference (llama.cpp, vLLM, Ollama)
- Python-specific ML libraries (sentence-transformers, HuggingFace fine-tune, scikit-learn)
- Audio processing (Whisper local — SRS dùng OpenAI Whisper API hoặc browser STT)

Các lựa chọn:

- **Option A**: Giữ FastAPI service riêng (Python) communicate qua HTTP/gRPC với NestJS
- **Option B**: Implement toàn bộ AI pipeline trong NestJS `AIModule`, dùng `openai` npm SDK và `pdf-parse` (npm)

## Decision

**Chọn Option B: NestJS-only, bỏ FastAPI service.**

Lý do:

1. **openai npm SDK đủ tính năng**: streaming (`stream: true`), function calling, JSON mode, file uploads — không thiếu feature nào so với Python SDK cho OpenAI API calls thuần.

2. **pdf-parse (npm) đủ cho CV extraction**: InterviewAI cần extract plain text từ CV PDF để inject vào prompt. `pdf-parse` xử lý PDF text layer — không cần `pdfplumber` Python cho use case này.

3. **AI pipeline là orchestration, không phải inference**: 3 pipeline (HR, Technical, Mixed) theo §5.6 session type spec là control flow logic phức tạp (sequencing, trigger evaluation, rubric aggregation) — không phải ML computation. TypeScript phù hợp ngang Python cho loại logic này.

4. **Giảm deployment complexity**:
   - 1 Dockerfile thay vì 2
   - 1 deployment pipeline (CI/CD) thay vì 2
   - 0 inter-service HTTP overhead (~10-30ms/call eliminated — ảnh hưởng AC-04-2 latency budget ≤ 5s)
   - 0 service discovery / load balancer config giữa NestJS và FastAPI

5. **Type safety end-to-end**: Rubric schemas (D1-D6, TD1-TD5), question taxonomy, session DTOs dùng chung TypeScript interfaces giữa `AIModule` services. FastAPI + NestJS = 2 type systems riêng, cần OpenAPI spec sync để không drift.

6. **DI cho AI services**: `HrPipelineService`, `TechnicalPipelineService`, `MixedPipelineService` inject vào nhau qua NestJS DI — mock được trong unit test không cần HTTP stub server.

Điều kiện để revise quyết định này (phải thỏa ít nhất 1):

- Cần local LLM inference (llama.cpp, vLLM) thay thế hoặc bổ sung OpenAI API → tách `AIModule` ra FastAPI microservice
- Cần Python-only libs: `sentence-transformers` cho embedding-based question dedup, `pdfplumber` cho CV với layout phức tạp, HuggingFace fine-tuned model → tách
- AI pipeline trở thành CPU/memory bottleneck cần scale độc lập với API layer → tách và scale riêng (BullMQ queue trong NestJS là bước trung gian trước khi tách service)

## Consequences

**Positive:**

- 1 codebase, 1 deployment, 1 type system — reduce ops overhead cho prototype (1-2 devs)
- Eliminated inter-service latency — AI pipeline call là function call trong process, không phải HTTP
- 3 pipeline strategy (HR/Technical/Mixed) implement như NestJS Strategy pattern — `PipelineStrategy` interface, inject strategy theo `session_type` — extensible khi thêm session type mới (ví dụ System Design session)
- Tất cả AI services testable qua NestJS testing module với mock providers

**Negative:**

- **Coupling AI pipeline với HTTP lifecycle**: OpenAI streaming response cần xử lý bằng async generator + SSE (Server-Sent Events) trong NestJS — không trivial nhưng đã có pattern chuẩn với `@nestjs/` và `rxjs`
- **Node.js event loop**: Nếu rubric aggregation hoặc annotation rendering trở thành CPU-intensive (unlikely ở prototype scale), cần `worker_threads` để tránh block. Python với `asyncio` xử lý CPU task tự nhiên hơn qua subprocess.
- **Lock-in decision cost**: Nếu sau này cần tách FastAPI, migrate phức tạp hơn là đã có FastAPI từ đầu — đây là trade-off chấp nhận được cho prototype scope nhưng cần document rõ điều kiện revise.
