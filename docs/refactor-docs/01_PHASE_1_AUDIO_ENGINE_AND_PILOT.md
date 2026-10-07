# TÀI LIỆU 01: PILOT PHASE 1 — KHỞI TẠO AI-SERVICE & AUDIO ENGINE (STT/TTS)
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: Khởi tạo `ai-service/`, Mở rộng `MediaModule` và `IAIGateway` trong `server/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md)  
> **Thư mục tài liệu chi tiết**: [01_PHASE_1_AUDIO_ENGINE/](01_PHASE_1_AUDIO_ENGINE/00_PHASE_1_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.1.0 (Chuẩn hóa toàn diện chuỗi thực thi tuần tự & Thuật ngữ tiếng Anh kỹ thuật)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Trong chiến lược **Strangler Fig Pattern** và kiến trúc **Polyglot Hybrid Architecture**, Audio Engine (STT/TTS) được chọn làm **Pilot Project (Giai đoạn thử nghiệm đầu tiên)** nhằm thiết lập kênh kết nối an toàn tuyệt đối giữa NestJS Core Orchestrator và Python AI Microservice:

1. **Stateless Compute Tuyệt đối**:
   * Chuyển đổi giọng nói thành văn bản (STT) và tổng hợp giọng nói (TTS) chỉ nhận luồng bytes và trả về JSON/Audio stream; không khóa bảng (`Table Lock`) hay phụ thuộc vào Business Tables của PostgreSQL.
2. **Khắc phục Triệt để Điểm nghẽn Trải nghiệm**:
   * Loại bỏ sự phụ thuộc chập chờn vào Web Speech API của trình duyệt.
   * Cắt giảm chi phí gọi API OpenAI Whisper trên đám mây ($0.006/phút) và triệt tiêu Latency mạng quốc tế.
3. **Quyền riêng tư Tuyệt đối (Privacy-First In-Memory Processing)**:
   * Toàn bộ dữ liệu âm thanh được giải mã và xử lý trực tiếp trên RAM (In-Memory Buffer qua PyAV). Tuyệt đối không ghi file tạm ổ đĩa và không đẩy lên Cloud Storage bên ngoài.
4. **Chuẩn hóa Trải nghiệm qua Two-Step Voice Flow**:
   * Tách bạch giai đoạn **Transcribe & Review** (ứng viên đọc lại transcript, sửa từ sai, xem WPM) và giai đoạn **Submit Turn** (chính thức ghi nhận vào lượt phỏng vấn và kích hoạt chấm điểm).
5. **Chi phí Rollback Bằng 0 (Zero-Risk Fallback)**:
   * Cô lập hoàn toàn qua `AIGatewayDispatcher` và Strict Feature Flags (`AI_STT_PROVIDER=python|openai`). Nếu Python AI Service gặp sự cố, hệ thống tự động chuyển sang OpenAI Whisper Fallback trong $< 1\text{s}$.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn tuần tự, AI Agent bắt buộc thực thi lần lượt các tài liệu đặc tả độc lập theo từng task trong thư mục [01_PHASE_1_AUDIO_ENGINE/](01_PHASE_1_AUDIO_ENGINE/00_PHASE_1_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/01_PHASE_1_AUDIO_ENGINE/
├── 00_PHASE_1_OVERVIEW_AND_ARCHITECTURE.md         # Kiến trúc tổng thể, Topology & Quality Gate 1
├── 01_PYTHON_AI_SERVICE_SETUP_AND_CORE.md          # Task 1.1: Khởi tạo ai-service, uv, Docker CPU/GPU & Core
├── 02_STT_PIPELINE_FASTER_WHISPER_AND_METRICS.md   # Task 1.2: PyAV In-memory, Silero VAD, faster-whisper & Metrics
├── 03_TTS_PIPELINE_HYBRID_KOKORO_AND_EDGE_TTS.md   # Task 1.3: Hybrid TTS (Kokoro-82M EN & EdgeTTS VI Stream)
├── 04_CONTRACT_SPECIFICATION_AND_SCHEMA_TESTS.md   # Task 1.4: Wire Contract camelCase, Fixtures & Dual Contract Tests
└── 05_NESTJS_INTEGRATION_AND_TWO_STEP_FLOW.md      # Task 1.5: MediaModule, Two-Step Flow, Strict Toggle & Dispatcher
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **1.1** | [01_PYTHON_AI_SERVICE_SETUP_AND_CORE.md](01_PHASE_1_AUDIO_ENGINE/01_PYTHON_AI_SERVICE_SETUP_AND_CORE.md) | `ai-service/`, Dockerfile, `pyproject.toml` | FastAPI, `uv`, Pydantic Settings, Structlog, Docker CPU/GPU |
| **1.2** | [02_STT_PIPELINE_FASTER_WHISPER_AND_METRICS.md](01_PHASE_1_AUDIO_ENGINE/02_STT_PIPELINE_FASTER_WHISPER_AND_METRICS.md) | `ai-service/app/services/stt/` | PyAV, Silero VAD, `faster-whisper`, CTranslate2, WPM & Filler Words |
| **1.3** | [03_TTS_PIPELINE_HYBRID_KOKORO_AND_EDGE_TTS.md](01_PHASE_1_AUDIO_ENGINE/03_TTS_PIPELINE_HYBRID_KOKORO_AND_EDGE_TTS.md) | `ai-service/app/services/tts/` | Kokoro-82M (EN), `edge-tts` (VI), FastAPI StreamingResponse |
| **1.4** | [04_CONTRACT_SPECIFICATION_AND_SCHEMA_TESTS.md](01_PHASE_1_AUDIO_ENGINE/04_CONTRACT_SPECIFICATION_AND_SCHEMA_TESTS.md) | `contracts/fixtures/`, Pytest, Jest | Wire `camelCase`, Standard Error Envelope, Dual Contract Testing |
| **1.5** | [05_NESTJS_INTEGRATION_AND_TWO_STEP_FLOW.md](01_PHASE_1_AUDIO_ENGINE/05_NESTJS_INTEGRATION_AND_TWO_STEP_FLOW.md) | `server/src/modules/media/`, `@infra/ai/` | `MediaController`, `MediaFacade`, `AIGatewayDispatcher`, Strict Toggle |

---

## 3. KHUNG BÀN GIAO & LIÊN KẾT TUẦN TỰ (PHASE 1 EXECUTION & HANDOVER PROTOCOL)

### 3.1 Infrastructure Bootstrap Pre-requisites (Từ Phase 5)
Trước khi chạy Task 1.1 và Task 1.4, tham khảo cấu trúc hạ tầng đã được thiết kế tại Phase 5:
* **Docker & Compose**: Cấu hình template môi trường từ [Task 5.1 (Multi-stage Containers & Docker Compose)](05_PHASE_5_DEV_OPS_INFRA/01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md).
* **Wire Test Framework**: Cơ chế test fixtures từ [Task 5.2 (Shared Contract Testing Framework)](05_PHASE_5_DEV_OPS_INFRA/02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md).

### 3.2 Chuỗi Thực thi Tuần tự (Task Sequential Flow)
```
Task 1.1 (Setup Core) ──> Task 1.2 (STT Pipeline) ──> Task 1.3 (Hybrid TTS)
                                                             │
Task 1.5 (NestJS Integration) <── Task 1.4 (Wire Contract Tests) <──┘
```

### 3.3 Handover Sang Phase 2 (Phase 1 -> Phase 2 Transition)
* **Điều kiện hoàn thành Phase 1**: Vượt qua toàn bộ tiêu chí của **Quality Gate 1**.
* **Đầu ra bàn giao**: `ai-service` lắng nghe tại port 8000, `MediaFacade` mở rộng phương thức `transcribeAudio()` và `synthesizeSpeech()`, `AIGatewayDispatcher` định tuyến thành công qua ENV toggle.
* **Tài liệu chuyển tiếp**: Bắt đầu Phase 2 tại [02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md) (Task 2.1: Kích hoạt `pgvector`).

---

## 4. CHỈ TIÊU NGHIỆM THU PHASE 1 (QUALITY GATE 1)

1. **Khởi tạo và Chạy Ổn định (Service Liveness & Readiness)**:
   * Endpoint `GET /healthz` trả HTTP 200 `{"status": "ok"}`.
   * Endpoint `GET /ready` trả HTTP 200 sau khi `faster-whisper` và `kokoro` nạp sẵn sàng vào bộ nhớ.
2. **Tuân thủ Hợp đồng Tuyệt đối (Zero Schema Drift)**:
   * 100% payload truyền qua wire JSON là `camelCase`.
   * Vượt qua 100% Contract Tests ở cả Pytest và Jest thông qua shared fixtures tại `contracts/fixtures/`.
3. **Độ chính xác STT (Word Error Rate)**:
   * Đạt Word Error Rate (WER) $< 8\%$ trên bộ test audio kỹ thuật IT song ngữ Việt-Anh.
4. **Hiệu năng & Latency**:
   * **GPU**: Audio 60s xử lý STT và bóc tách metrics $< 1.2$ giây.
   * **CPU**: Audio 60s xử lý $< 3.5$ giây.
   * **TTS Kokoro (EN)**: Real-Time Factor (RTF) $< 0.15$.
5. **Bộ nhớ RAM Ổn định**:
   * 500 requests liên tiếp không làm tăng baseline RAM của container vượt quá $+200\text{MB}$.
6. **Two-Step Flow Hoạt động Trơn tru**:
   * Client hoàn tất luồng Transcribe $\rightarrow$ Review/Edit $\rightarrow$ Submit Turn $\rightarrow$ Bảng `user_answers` lưu trọn vẹn `voiceMetricsJson`.
7. **Strict Toggle Thành công**:
   * Chuyển `AI_STT_PROVIDER=openai` trong `.env`, hệ thống chuyển hướng tự động sang OpenAI Whisper Fallback không cần sửa đổi mã nguồn.
