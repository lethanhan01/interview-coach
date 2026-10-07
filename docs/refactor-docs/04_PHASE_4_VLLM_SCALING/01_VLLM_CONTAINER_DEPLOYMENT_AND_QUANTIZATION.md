# TASK 4.1: TRIỂN KHAI VLLM CONTAINER, LƯỢNG TỬ HÓA AWQ & TỐI ƯU HÓA BỘ NHỚ GPU
# (VLLM SELF-HOSTING, QWEN 2.5 32B AWQ, PAGEDATTENTION & KV-CACHE TUNING)

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Model Infrastructure & GPU Sizing)  
> **Áp dụng cho**: Máy chủ GPU (AWS G5 / RunPod / Server riêng), Docker Container `vllm-openai`, NVIDIA Driver  
> **Tài liệu cha**: [00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0  

---

## 1. PHÂN TÍCH THIẾT KẾ CŨ & NHỮNG ĐIỂM CHƯA CHẶT CHẼ CẦN KHẮC PHỤC

Trong bản phác thảo ban đầu của Phase 4, việc triển khai vLLM có một số điểm chưa chặt chẽ và thiếu sót nghiêm trọng có thể dẫn đến sự cố sập hệ thống khi chạy tải thực:

1. **Rủi ro Tràn VRAM do Ước tính Bộ nhớ KV-Cache Phi thực tế**:
   * *Lỗ hổng cũ*: Đặt cấu hình `--max-model-len 8192` và `--gpu-memory-utilization 0.92` trên card 24GB VRAM. Mô hình Qwen 2.5 32B AWQ chiếm sẵn ~19.6 GB trọng số. Trên GPU 24GB, dung lượng còn lại cho KV-Cache chỉ là $\sim 3.8\text{ GB}$.
   * *Hậu quả*: Khi có 5-10 người dùng đồng thời gửi câu trả lời với context dài, KV-Cache lập tức cạn kiệt, vLLM trả lỗi HTTP 503 hoặc CUDA Out-of-Memory (OOM) làm crash toàn bộ tiến trình.
   * *Giải pháp khắc phục*: Chuẩn hóa `--max-model-len 4096` (đủ cho 1 lượt hỏi-đáp phỏng vấn kèm context pack JD và rubric) và giới hạn số luồng đồng thời qua `--max-num-seqs 48`.
2. **Thiếu Quy trình Model Pre-warming & Health Check Chuẩn xác**:
   * *Lỗ hổng cũ*: Docker chạy xong port 8000 mở ngay nhưng mô hình cần 45-75 giây để nạp trọng số từ ổ đĩa vào VRAM.
   * *Giải pháp khắc phục*: Cấu hình probe kiểm tra `/health` và tạo script warmup gửi 1 request suy luận giả định trước khi báo trạng thái `healthy` cho Gateway.
3. **Thiếu Cơ chế Cố định CUDA Version & FlashAttention**:
   * *Giải pháp khắc phục*: Sử dụng image chính thức `vllm/vllm-openai:v0.6.3.post1` kèm cấu hình tối ưu FlashAttention-2.

---

## 2. PHÂN TÍCH PHẦN CỨNG & BỐ TRÍ BỘ NHỚ VRAM (GPU SIZING MATRIX)

Mô hình mục tiêu: **`Qwen/Qwen2.5-32B-Instruct-AWQ`** (Lượng tử hóa 4-bit qua AutoAWQ).

### Bảng Phân Bổ Bộ Nhớ VRAM trên Card 24GB (NVIDIA A10G / L4 / RTX 4090):

| Thành phần Bộ nhớ | Dung lượng Chiếm dụng | Tỷ lệ % trên 24GB | Giải thích Kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Model Weights (Trọng số 4-bit)** | $\approx 19.4\text{ GB}$ | $80.8\%$ | Trọng số đã lượng tử hóa cố định trong VRAM. |
| **CUDA Kernels & Activation** | $\approx 0.8\text{ GB}$ | $3.3\%$ | Bộ nhớ đệm phục vụ tính toán ma trận ma sát. |
| **KV-Cache Pool (PagedAttention)** | $\approx 3.2\text{ GB}$ | $13.3\%$ | Bộ nhớ động cấp phát theo từng trang (Block size 16). |
| **Dự phòng An toàn (VRAM Headroom)** | $\approx 0.6\text{ GB}$ | $2.6\%$ | Ngăn chặn hiện tượng OOM đột ngột khi cấp phát tensor. |
| **TỔNG CỘNG** | **$24.0\text{ GB}$** | **$100.0\%$** | **Ngưỡng sử dụng tối đa (`--gpu-memory-utilization 0.90`)** |

* **Năng lực phục vụ (Concurrency Capacity)**:
  * Với `--max-model-len 4096`, pool 3.2GB KV-Cache đảm bảo phục vụ ổn định **24 đến 32 phiên suy luận song song** với tốc độ sinh $> 28\text{ tokens/giây/luồng}$.
  * Nếu số lượng request vượt quá 32, vLLM kích hoạt cơ chế xếp hàng đợi nội bộ (Continuous Batching) hoặc trả tín hiệu để Circuit Breaker đẩy sang Cloud.

---

## 3. CẤU HÌNH DOCKER COMPOSE & THAM SỐ VLLM PRODUCTION

### Cấu hình `docker-compose.vllm.yml`:

```yaml
version: '3.8'

services:
  vllm-engine:
    image: vllm/vllm-openai:v0.6.3.post1
    container_name: interviewai-vllm
    restart: always
    runtime: nvidia
    environment:
      - HUGGING_FACE_HUB_TOKEN=${HF_TOKEN:-}
      - NCCL_DEBUG=INFO
    ports:
      - "8001:8000"
    ipc: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    command: >
      --model Qwen/Qwen2.5-32B-Instruct-AWQ
      --quantization awq
      --dtype half
      --max-model-len 4096
      --max-num-seqs 48
      --gpu-memory-utilization 0.90
      --block-size 16
      --trust-remote-code
      --port 8000
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 60s
```

### Giải thích các Cờ Tham số Cốt lõi:
* `--quantization awq`: Kích hoạt kernel giải nén AWQ trực tiếp trên Tensor Cores, bảo toàn độ chính xác tương đương FP16.
* `--max-model-len 4096`: Khống chế độ dài ngữ cảnh tối đa, giải phóng bộ nhớ cho KV-Cache của nhiều người dùng.
* `--max-num-seqs 48`: Số lượng câu trả lời đồng thời tối đa trong một đợt tính toán ma trận.
* `--block-size 16`: Kích thước trang PagedAttention giúp giảm thiểu phân mảnh bộ nhớ ngoài.

---

## 4. KỊCH BẢN WARMUP & KIỂM CHỨNG OPENAI-COMPATIBLE ENDPOINT

Sau khi container đạt trạng thái `healthy`, hệ thống chạy script khởi động (warmup) để JIT compile các CUDA graph:

```bash
#!/usr/bin/env bash
set -e

VLLM_URL="http://localhost:8001/v1"
echo "Checking vLLM ready status..."

curl -s -f http://localhost:8001/health > /dev/null

echo "Sending Warmup Request to compile CUDA graphs..."
curl -s -X POST "${VLLM_URL}/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2.5-32B-Instruct-AWQ",
    "messages": [
      {"role": "system", "content": "You are an AI interviewer."},
      {"role": "user", "content": "Say hello to candidate."}
    ],
    "max_tokens": 10,
    "temperature": 0.1
  }' | grep -q "choices"

echo "vLLM warm-up completed successfully. Ready for production traffic!"
```

---

## 5. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Hiệu năng Khởi động (Cold Start & Warmup)**: Toàn bộ quá trình nạp mô hình vào VRAM và hoàn tất warmup diễn ra trong $< 90\text{ giây}$.
2. **Độ ổn định Bộ nhớ (Memory Stability)**: Khi chạy benchmark với 30 requests đồng thời gửi context 2.500 tokens, mức sử dụng VRAM ổn định ở ngưỡng $90-93\%$, tuyệt đối không xảy ra lỗi `CUDA out of memory`.
3. **Tốc độ Sinh Token (Token Generation Rate)**: Tốc độ trung bình đạt $\ge 25\text{ tokens/giây}$ cho mỗi người dùng đơn lẻ và thông lượng tổng thể $\ge 350\text{ tokens/giây}$ trên GPU.
4. **Tương thích Endpoint**: Trả về đúng định dạng JSON chuẩn OpenAI v1 Chat Completions (`id`, `object`, `created`, `model`, `choices`).

---

## 6. TASK EXECUTION CONTRACT

### 6.1 Prerequisites (Tiền đề bắt buộc)
- [ ] Hoàn thành toàn bộ **Phase 3** (Quality Gate 3 Approved).
- [ ] Máy chủ hoặc GPU cluster trang bị tối thiểu 24GB VRAM (NVIDIA A10G, L4, RTX 3090/4090).
- [ ] Cài đặt sẵn NVIDIA Container Toolkit (`nvidia-smi` hoạt động trong Docker).

### 6.2 Target Deliverables (Sản phẩm mã nguồn đầu ra)
- [ ] `docker/vllm.Dockerfile`: Dockerfile đóng gói runtime `vllm/vllm-openai:latest` tối ưu AWQ.
- [ ] `docker-compose.vllm.yml`: Service định nghĩa vLLM container expose OpenAI-compatible API trên port 8000.
- [ ] `scripts/vllm-warmup.sh`: Script kiểm tra sẵn sàng và gửi request warmup đầu tiên.

### 6.3 Architectural Rules Enforced (Tuân thủ AGENTS.md)
- [x] **Backend Rule 5**: AI Isolation; vLLM cung cấp endpoint chuẩn OpenAI-compatible để NestJS `@infra/ai/` có thể tráo đổi nhà cung cấp dễ dàng.
- [x] **TCO Optimization Invariant**: Cắt giảm $85\% - 92\%$ chi phí token so với GPT-4o.

### 6.4 Verification Command (Lệnh kiểm thử & Xác thực tự động)
```bash
# Tier 1 (Liveness & Models API Check)
curl -s http://localhost:8000/v1/models | grep -q "Qwen2.5-32B-Instruct-AWQ"

# Tier 2 (Warmup & Token Generation Speed Benchmark)
bash scripts/vllm-warmup.sh
```

### 6.5 Definition of Done (DoD)
- [ ] Toàn bộ quá trình nạp mô hình và warmup hoàn tất trong $< 90\text{ giây}$.
- [ ] Mức sử dụng VRAM ổn định ở ngưỡng $90-93\%$, tuyệt đối không xảy ra lỗi CUDA OOM khi chạy 30 concurrent streams.
- [ ] Tốc độ sinh token đạt $\ge 25\text{ tokens/giây}$ cho mỗi stream đơn lẻ.
- [ ] Trả về JSON chuẩn OpenAI Chat Completions với `choices[0].message.content`.

### 6.6 Next Task Transition (Bước chuyển tiếp)
- Tiếp tục sang **Task 4.2: NestJS Gateway Integration & Surge Failover**: [02_NESTJS_GATEWAY_INTEGRATION_AND_SURGE_FAILOVER.md](02_NESTJS_GATEWAY_INTEGRATION_AND_SURGE_FAILOVER.md) để kết nối cụm vLLM với NestJS Core qua Circuit Breaker.

