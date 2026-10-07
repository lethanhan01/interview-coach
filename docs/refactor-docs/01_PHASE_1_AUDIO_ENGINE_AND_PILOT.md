# TÀI LIỆU 01: PILOT PHASE 1 — KHỞI TẠO AI-SERVICE & AUDIO ENGINE (STT/TTS)
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: Khởi tạo `ai-service/`, Mở rộng `MediaModule` và `IAIGateway` trong `server/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md)  
> **Thư mục tài liệu chi tiết**: [01_PHASE_1_AUDIO_ENGINE/](01_PHASE_1_AUDIO_ENGINE/00_PHASE_1_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Đã phân rã thành bộ tài liệu chuyên sâu 5 tasks)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Trong chiến lược **Strangler Fig Pattern** và kiến trúc **Polyglot Hybrid Architecture**, Audio Engine (STT/TTS) được chọn làm **Pilot Project (Giai đoạn thử nghiệm đầu tiên)** nhằm thiết lập kênh kết nối an toàn tuyệt đối giữa NestJS Core và Python AI Microservice:

1. **Hoàn toàn Phi trạng thái (Stateless Compute)**:
   * Chuyển đổi giọng nói thành văn bản (STT) và tổng hợp giọng nói (TTS) chỉ nhận luồng bytes và trả về JSON/Audio stream, không khóa (lock) dữ liệu hay phụ thuộc vào bảng nghiệp vụ PostgreSQL.
2. **Khắc phục Triệt để Điểm nghẽn Trải nghiệm**:
   * Loại bỏ sự phụ thuộc chập chờn vào Web Speech API của trình duyệt.
   * Cắt giảm chi phí gọi API OpenAI Whisper trên đám mây ($0.006/phút) và triệt tiêu độ trễ mạng quốc tế.
3. **Quyền riêng tư Tuyệt đối (Privacy-First In-Memory Processing)**:
   * Toàn bộ dữ liệu âm thanh được giải mã và xử lý trực tiếp trên RAM (In-Memory Buffer qua PyAV). Tuyệt đối không ghi file đĩa cứng `/tmp` và không đẩy lên dịch vụ lưu trữ đám mây ngoài.
4. **Chuẩn hóa Trải nghiệm qua Two-Step Voice Flow**:
   * Tách bạch giai đoạn **Transcribe & Review** (ứng viên đọc lại transcript, sửa từ sai, xem WPM) và giai đoạn **Submit Turn** (chính thức ghi nhận vào lượt phỏng vấn và kích hoạt chấm điểm).
5. **Chi phí Rollback Bằng 0 (Zero-Risk Fallback)**:
   * Cô lập hoàn toàn qua `AIGatewayDispatcher` và Strict Feature Flags (`AI_STT_PROVIDER=python|openai`). Nếu Python service gặp sự cố, hệ thống tự động chuyển sang OpenAI Whisper hoặc Web Speech API trong $< 1\text{s}$.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn hoặc phân chia công việc cho các kỹ sư, vui lòng truy cập các tài liệu đặc tả độc lập theo từng task trong thư mục [01_PHASE_1_AUDIO_ENGINE/](01_PHASE_1_AUDIO_ENGINE/00_PHASE_1_OVERVIEW_AND_ARCHITECTURE.md):

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

## 3. CHỈ TIÊU NGHIỆM THU PHASE 1 (QUALITY GATES)

1. **Khởi tạo và Chạy Ổn định (Service Liveness & Readiness)**:
   * Endpoint `GET /healthz` trả HTTP 200 `{"status": "ok"}`.
   * Endpoint `GET /ready` trả HTTP 200 sau khi `faster-whisper` và `kokoro` nạp sẵn sàng vào bộ nhớ.
2. **Tuân thủ Hợp đồng Tuyệt đối (Zero Schema Drift)**:
   * 100% payload truyền qua wire JSON là `camelCase`.
   * Vượt qua 100% Contract Tests ở cả Pytest và Jest thông qua shared fixtures.
3. **Độ chính xác STT (Word Error Rate)**:
   * Đạt Word Error Rate (WER) $< 8\%$ trên bộ test audio kỹ thuật IT song ngữ Việt-Anh.
4. **Hiệu năng & Độ trễ**:
   * **GPU**: Audio 60s xử lý STT và bóc tách metrics $< 1.2$ giây.
   * **CPU**: Audio 60s xử lý $< 3.5$ giây.
   * **TTS Kokoro (EN)**: Real-Time Factor (RTF) $< 0.15$.
5. **Bộ nhớ RAM Ổn định**:
   * 500 requests liên tiếp không làm tăng baseline RAM của container vượt quá $+200\text{MB}$.
6. **Two-Step Flow Hoạt động Trơn tru**:
   * Client hoàn tất luồng Transcribe $\rightarrow$ Review/Edit $\rightarrow$ Submit Turn $\rightarrow$ Bảng `user_answers` lưu trọn vẹn `voiceMetricsJson`.
7. **Strict Toggle Thành công**:
   * Chuyển `AI_STT_PROVIDER=openai` trong `.env`, hệ thống chuyển hướng tự động sang OpenAI Whisper API không cần sửa đổi mã nguồn.
