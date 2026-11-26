# Bản đồ Kiến trúc Hệ thống Intervia (Master Architecture Map)
> **Intervia Living Architecture Hub (`docs/architecture/`)** — Cổng thông tin kiến trúc chính thức, tài liệu tham chiếu kỹ thuật và hướng dẫn Onboarding cho toàn bộ nền tảng Intervia.

---

## 1. Giới thiệu & Mục đích

Thư mục `docs/architecture/` là **Single Source of Truth** về mặt kiến trúc và thiết kế kỹ thuật của hệ thống Intervia. Tất cả tài liệu ở đây được duy trì liên tục bám sát mã nguồn thực tế của dự án (*Living Architecture Documentation*), thay thế cho các tài liệu kế hoạch ban đầu đã hoàn thành.

Mọi tài liệu trong thư mục này được tổ chức và quản trị theo quy chuẩn kỹ thuật nghiêm ngặt tại:
👉 **[Quy chuẩn Quản trị & Cấu trúc Tài liệu (CONVENTIONS.md)](CONVENTIONS.md)**

---

## 2. Ma trận Trạng thái Phân hệ Kiến trúc (Subsystems Matrix)

Bảng tổng hợp các phân hệ kiến trúc và trạng thái tài liệu hiện hành:

| Phân hệ / Thư mục | Mô tả Trọng tâm | Trạng thái | Lộ trình Tương ứng |
| :--- | :--- | :---: | :--- |
| **[overview/](overview/README.md)** | Kiến trúc Tổng thể: Pragmatic Polyglot, Strangler Fig & Topology | 🟢 **Active** | Core Architecture |
| **[audio-engine/](audio-engine/README.md)** | Audio Engine: STT faster-whisper, Hybrid TTS, DSP & NestJS Media | 🟢 **Active** | Phase 1 (Hoàn thành) |
| **[rag-search/](rag-search/README.md)** | Hybrid Semantic Search: pgvector, BGE Embeddings, Question Bank | 🟡 *Planned* | Phase 2 (Đang chuẩn bị) |
| **[assessment-engine/](assessment-engine/README.md)** | Deep Assessment: Đánh giá rubric đa chiều, SFIA Scoring Engine | 🟡 *Planned* | Phase 3 |
| **[llm-runtime/](llm-runtime/README.md)** | Inference Scaling: vLLM Serving, Self-Hosted LLM Inference | 🟡 *Planned* | Phase 4 |
| **[infra-devops/](infra-devops/README.md)** | Infrastructure: Docker, GitHub Actions Matrix, DR & Observability | 🟡 *Planned* | Phase 5 |
| **[backend-core/](backend-core/README.md)** | Core Backend: NestJS Modular Monolith, Prisma, ACID & BullMQ | 🟡 *Planned* | Server Core |
| **[adrs/](adrs/README.md)** | Architectural Decision Records: Quyết định kiến trúc quan trọng | 🟢 **Active** | Toàn hệ thống |

---

## 3. Lộ trình Đọc Tài liệu dành cho Kỹ sư Mới (Onboarding Reading Path)

Tùy theo vai trò kỹ thuật khi tham gia dự án, các thành viên mới nên tiếp cận tài liệu theo thứ tự sau:

### 3.1 Dành cho Toàn bộ Kỹ sư (All Engineers)
1. **[Tổng quan Toàn hệ thống (overview/README.md)](overview/README.md)**: Hiểu bức tranh toàn cảnh, triết lý Polyglot và sơ đồ phân tầng Next.js $\leftrightarrow$ NestJS $\leftrightarrow$ Python AI Service.
2. **[Quy chuẩn Tài liệu (CONVENTIONS.md)](CONVENTIONS.md)**: Hiểu cách tra cứu và cập nhật tài liệu kiến trúc.

### 3.2 Dành cho AI & Audio Engineers
1. **[Audio Engine Master Guide (audio-engine/README.md)](audio-engine/README.md)**: Đọc phần *Developer Onboarding Quickstart* để thiết lập môi trường `uv`, khởi động `ai-service` và test nhanh bằng `curl`.
2. **[FastAPI Runtime Core (audio-engine/python-ai-service-runtime.md)](audio-engine/python-ai-service-runtime.md)**: Nắm vững cơ chế Lifespan, cấu hình Pydantic, và bảo mật `x-internal-secret`.
3. **[STT Pipeline & Voice Metrics (audio-engine/stt-pipeline.md)](audio-engine/stt-pipeline.md)**: Hiểu luồng PyAV In-Memory DSP, Silero VAD, faster-whisper và cách trích xuất WPM/Filler words.
4. **[Hybrid TTS Pipeline (audio-engine/tts-pipeline.md)](audio-engine/tts-pipeline.md)**: Hiểu kiến trúc kết hợp Kokoro-82M (EN) và Microsoft Edge TTS (VI).
5. **[Contract Specification & Testing (audio-engine/contracts-and-testing.md)](audio-engine/contracts-and-testing.md)**: Nắm vững quy chuẩn wire `camelCase` và cách chạy contract test chống schema drift.

### 3.3 Dành cho Backend (NestJS) Engineers
1. **[Backend Integration Flow (audio-engine/nestjs-integration-flow.md)](audio-engine/nestjs-integration-flow.md)**: Tìm hiểu `MediaController`, `MediaFacade`, `PythonAiClient`, luồng Two-Step Voice Intake và cơ chế Strict Toggle.
2. **[Backend Conventions (`server/CONVENTIONS.md`)](../../server/CONVENTIONS.md)**: Nắm vững kiến trúc 3 lớp, Clean Architecture và các quy tắc kiểm thử backend.

---

## 4. Liên kết Tham chiếu Hữu ích
- [Hướng dẫn Khởi chạy Hệ thống Toàn diện (RUNNING_GUIDE.md)](../RUNNING_GUIDE.md)
- [Quy chuẩn Kiến trúc Backend (server/CONVENTIONS.md)](../../server/CONVENTIONS.md)
- [Lộ trình Refactor Dài hạn (refactor-docs/00_OVERVIEW_STRATEGIC_BLUEPRINT.md)](../refactor-docs/00_OVERVIEW_STRATEGIC_BLUEPRINT.md)
