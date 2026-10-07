# TÀI LIỆU 04: PHASE 4 — HẠ TẦNG VLLM TỰ HOST & FAST-PATH CONVERSATIONAL AGENT
# (MASTER BLUEPRINT & NAVIGATION INDEX CHO REAL-TIME FULL-DUPLEX INTERVIEW)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: Hạ tầng GPU / vLLM, Trợ lý Phỏng vấn Thời gian thực, WebSockets Duplex, Smart VAD & Barge-in  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [04_PHASE_4_VLLM_SCALING/](04_PHASE_4_VLLM_SCALING/00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Tái cấu trúc tích hợp Fast-Path Conversational Agent <900ms)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 4 giải quyết đồng thời hai bài toán bước ngoặt của nền tảng InterviewAI:
1. **Đột phá Tối ưu Chi phí Vận hành (TCO Optimization)**: Chuyển dịch từ việc tiêu tốn hàng nghìn USD chi phí API thương mại (GPT-4o) sang tự host mô hình mã nguồn mở hàng đầu thế giới **`Qwen 2.5 32B Instruct AWQ`** qua **vLLM** trên card đồ họa 24GB VRAM (AWS G5 / RunPod), cắt giảm **85% đến 92.4%** chi phí vận hành ở quy mô lớn.
2. **Nâng tầm Trải nghiệm Người dùng (Fast-Path Conversational Agent)**: Xóa bỏ hoàn toàn cơ chế hỏi-đáp ngắt quãng đơn điệu, thay thế bằng tương tác giọng nói hai chiều trực tiếp qua WebSockets Streaming, tích hợp Silero VAD bắt ngắt lời tự nhiên (Barge-in Latency $< 200\text{ms}$) và tác tử đàm thoại nhanh (**Fast-Path Agent**) với cơ chế **Speculative Zero-Hop Streaming** nạp sẵn ngữ cảnh rubric vào KV-Cache, đảm bảo Time-to-First-Audio $< 700\text{ms}$ (vượt chuẩn SLA $< 900\text{ms}$).

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn tuần tự, AI Agent bắt buộc thực thi lần lượt các tài liệu đặc tả độc lập theo từng task trong thư mục [04_PHASE_4_VLLM_SCALING/](04_PHASE_4_VLLM_SCALING/00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/04_PHASE_4_VLLM_SCALING/
├── 00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md             # Kiến trúc tổng thể, TCO & Fast-Path Agent Roadmap
├── 01_VLLM_CONTAINER_DEPLOYMENT_AND_QUANTIZATION.md    # Task 4.1: vLLM AWQ, GPU Sizing & PagedAttention
├── 02_NESTJS_GATEWAY_INTEGRATION_AND_SURGE_FAILOVER.md # Task 4.2: NestJS IAIGateway, Circuit Breaker & Failover
├── 03_FULL_DUPLEX_WEBSOCKET_AND_AUDIO_WORKLET.md       # Task 4.3: Binary Framing WebSocket & Client AudioWorklet
├── 04_SMART_VAD_BARGE_IN_AND_LATENCY_PIPELINE.md       # Task 4.4: Silero VAD, <200ms Barge-in & Cascading Abort
└── 05_ADAPTIVE_PROBING_AND_CONVERSATIONAL_ORCHESTRATION.md # Task 4.5: Fast-Path Conversational Agent, KV-Cache & Probing
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **4.1** | [01_VLLM_CONTAINER_DEPLOYMENT_AND_QUANTIZATION.md](04_PHASE_4_VLLM_SCALING/01_VLLM_CONTAINER_DEPLOYMENT_AND_QUANTIZATION.md) | Hạ tầng GPU, Docker | `vLLM`, Qwen 2.5 32B AWQ, PagedAttention, KV-Cache |
| **4.2** | [02_NESTJS_GATEWAY_INTEGRATION_AND_SURGE_FAILOVER.md](04_PHASE_4_VLLM_SCALING/02_NESTJS_GATEWAY_INTEGRATION_AND_SURGE_FAILOVER.md) | `server/src/infrastructure/ai/` | NestJS, `opossum` Circuit Breaker, Cloud Surge Failover |
| **4.3** | [03_FULL_DUPLEX_WEBSOCKET_AND_AUDIO_WORKLET.md](04_PHASE_4_VLLM_SCALING/03_FULL_DUPLEX_WEBSOCKET_AND_AUDIO_WORKLET.md) | `client/`, WebSocket Gateway | `AudioWorkletNode`, Binary Framing 5-bytes, FSM |
| **4.4** | [04_SMART_VAD_BARGE_IN_AND_LATENCY_PIPELINE.md](04_PHASE_4_VLLM_SCALING/04_SMART_VAD_BARGE_IN_AND_LATENCY_PIPELINE.md) | `ai-service/app/services/audio/` | Silero VAD ONNX, Multi-tier Cascading Abort (<200ms) |
| **4.5** | [05_ADAPTIVE_PROBING_AND_CONVERSATIONAL_ORCHESTRATION.md](04_PHASE_4_VLLM_SCALING/05_ADAPTIVE_PROBING_AND_CONVERSATIONAL_ORCHESTRATION.md) | `server/src/modules/interview-live/` | Fast-Path Agent, Speculative Zero-Hop, Pre-fetched KV-Cache, Strict Budget |

---

## 3. KHUNG BÀN GIAO & LIÊN KẾT TUẦN TỰ (PHASE 4 EXECUTION & HANDOVER PROTOCOL)

### 3.1 Tiền đề Bàn giao Nhận từ Phase 3 (Incoming Handover)
* Pipeline đánh giá câu trả lời kết hợp Multi-Agent Fact-Checking đã hoàn thiện và chạy ổn định qua BullMQ Outbox Worker.
* Đã vượt qua toàn bộ tiêu chí của **Quality Gate 3**.

### 3.2 Chuỗi Thực thi Tuần tự (Task Sequential Flow)
```
Task 4.1 (vLLM Deployment) ──> Task 4.2 (Gateway & Failover) ──> Task 4.3 (Full-Duplex WS)
                                                                           │
Task 4.5 (Fast-Path Agent) <── Task 4.4 (Smart VAD Barge-in) <─────────────┘
```

### 3.3 Handover Sang Phase 5 (Phase 4 -> Phase 5 Transition)
* **Điều kiện hoàn thành Phase 4**: Vượt qua toàn bộ tiêu chí của **Quality Gate 4**.
* **Đầu ra bàn giao**: Cụm suy luận vLLM và WebSocket Full-Duplex Gateway tích hợp Fast-Path Conversational Agent hoạt động hoàn chỉnh ở môi trường Dev.
* **Tài liệu chuyển tiếp**: Bắt đầu Phase 5 tại [05_DEV_OPS_INFRA_AND_DISASTER_RECOVERY.md](05_DEV_OPS_INFRA_AND_DISASTER_RECOVERY.md) (Task 5.1: Polyglot Monorepo & Multi-stage Containers).

---

## 4. CHỈ TIÊU NGHIỆM THU PHASE 4 (QUALITY GATE 4)

1. **Độ Trễ Đàm Thoại Toàn Trình (Time-to-First-Audio)**: Từ khi ứng viên dứt lời đến khi nghe thấy tiếng AI phản hồi $< 800\text{ ms}$ (P95) và $< 700\text{ ms}$ (Average).
2. **Độ Nhạy Ngắt Lời (Barge-in Latency)**: Dừng phát loa và giải phóng tài nguyên tính toán trong vòng $< 200\text{ ms}$ sau khi ứng viên cất lời.
3. **Hiệu Năng & Ổn Định GPU**: Cụm vLLM chịu tải ổn định $\ge 30$ lượt suy luận song song với tốc độ sinh token $\ge 25\text{ tokens/giây/luồng}$.
4. **Bảo Vệ Dự Phòng (Cloud Surge Failover)**: Khi vLLM quá tải hoặc gặp sự cố, hệ thống tự động chuyển mạch sang OpenAI Cloud Fallback trong $< 1.5\text{s}$ mà không làm đứt đoạn phiên phỏng vấn.
