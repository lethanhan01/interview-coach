# TASK 5.4: SỔ TAY ỨNG PHÓ SỰ CỐ KHẨN CẤP (DISASTER RECOVERY RUNBOOKS) & CIRCUIT BREAKERS
# (P1/P2 PRODUCTION INCIDENTS, COPY-PASTE CLI PROCEDURES, RECOVERY VERIFICATION & CHAOS DRILLS)

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Site Reliability Engineering & Incident Management)  
> **Áp dụng cho**: Đội ngũ On-Call / DevOps, SRE Runbooks, Production Incidents P1/P2  
> **Tài liệu cha**: [00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0  

---

## 1. PHÂN TÍCH THIẾT KẾ CŨ & NHỮNG ĐIỂM CHƯA CHẶT CHẼ CẦN KHẮC PHỤC

Bản thảo Runbook ban đầu bộc lộ **3 thiếu sót nghiêm trọng trong thực tế ứng cứu sự cố**:

1. **Thiếu Lệnh Thực Thi Cụ Thể (Lệnh Copy-Paste Sẵn Sàng)**:
   * Bản cũ chỉ mô tả chung chung: *"Cập nhật biến môi trường rồi restart server"*. Trong tình huống sự cố P1 lúc 2h sáng khi toàn bộ hệ thống tê liệt, kỹ sư on-call cần các dòng lệnh cụ thể, chính xác $100\%$ kèm lệnh kiểm chứng kết quả (Sanity Check) thay vì hướng dẫn lý thuyết.
2. **Bỏ Quên Sự Cố Lỗi Hàng Đợi Redis & Job Bị Kẹt (Stalled Jobs)**:
   * Khi Redis bị nghẽn mạng hoặc khởi động lại, hàng trăm job đánh giá phỏng vấn của thí sinh bị kẹt vĩnh viễn ở trạng thái `active` trong BullMQ mà không tự phục hồi được nếu không có quy trình xả kẹt (Unstall Procedure).
3. **Chưa Có Giải Pháp Cho Trường Hợp Index Vector HNSW Bị Hỏng (Index Corruption)**:
   * Nếu máy chủ cơ sở dữ liệu bị ngắt điện đột ngột hoặc lỗi phần cứng khiến file index HNSW bị corrupt, mọi câu lệnh truy vấn RAG sẽ trả lỗi Fatal Error làm crash tiến trình.

---

## 2. MA TRẬN PHÂN LOẠI MỨC ĐỘ SỰ CỐ SẢN XUẤT (INCIDENT SEVERITY)

| Cấp Độ | Tiêu Chí Xác Định | Thời Gian Mục Tiêu (MTTR) | Kênh Thông Báo |
| :---: | :--- | :---: | :--- |
| **P1 (Critical)** | Toàn bộ thí sinh không thể phỏng vấn hoặc AI dừng phản hồi hoàn toàn. | **$< 5\text{ phút}$** | Kích hoạt chuông PagerDuty / Cuộc gọi tự động tới Lead SRE. |
| **P2 (High)** | Độ trễ tăng vọt $> 3\text{s}$, hoặc một tính năng phụ (như Reranker, TTS giọng AI) bị lỗi nhưng đã có fallback. | **$< 30\text{ phút}$** | Tin nhắn khẩn cấp kênh Slack `#incident-p2`. |
| **P3 (Medium)** | Lỗi giao diện nhỏ, log cảnh báo lặp lại, không ảnh hưởng đến luồng phỏng vấn chính. | **$< 4\text{ giờ}$** | Tạo Jira ticket trong sprint kế tiếp. |

---

## 3. 4 SỔ TAY XỬ LÝ SỰ CỐ KHẨN CẤP CHI TIẾT (PRODUCTION RUNBOOKS)

### RUNBOOK P1-01: Python AI Service Bị Sập Toàn Bộ (Total Outage)
* **Triệu chứng**: NestJS log báo `ECONNREFUSED 127.0.0.1:8000`, HTTP 502/503 xuất hiện diện rộng.
* **Thời gian mục tiêu**: $< 2$ phút chuyển mạch sang Cloud.
* **Quy trình Khắc phục Tức thì (Execute Immediately)**:
  ```bash
  # Bước 1: Kích hoạt chế độ Cloud Fallback khẩn cấp không cần build lại code
  docker exec -it interviewai-backend sh -c "
    export AI_STT_PROVIDER=openai
    export AI_TTS_PROVIDER=browser
    export AI_RAG_PROVIDER=prisma
    export AI_EVALUATION_PROVIDER=openai
  "
  
  # Bước 2: Khởi động lại container backend để nhận cấu hình dự phòng
  docker restart interviewai-backend
  
  # Bước 3: Kiểm chứng hệ thống đã sống lại qua Cloud API
  curl -s -f http://localhost:4000/api/v1/health | grep -q '"status":"ok"' && echo "FALLBACK SUCCESSFUL"
  
  # Bước 4: Kiểm tra log của container AI bị sập để truy tìm nguyên nhân gốc rễ
  docker logs --tail 200 interviewai-ai-service > /var/log/incident_ai_crash_$(date +%s).log
  ```

---

### RUNBOOK P1-02: Chỉ Mục pgvector HNSW Bị Chậm Đột Biến Hoặc Hỏng
* **Triệu chứng**: CPU PostgreSQL tăng $100\%$, truy vấn câu hỏi mất $> 3\text{ giây}$ hoặc ném lỗi `index corrupted`.
* **Quy trình Xử lý**:
  ```sql
  -- Bước 1: Kết nối trực tiếp vào PostgreSQL
  psql -U postgres -d interview_coach

  -- Bước 2: Tạm thời chuyển câu truy vấn sang Sequential Scan nếu Index bị hỏng nặng
  SET enable_indexscan = off;

  -- Bước 3: Tái tạo lại Index trong background mà KHÔNG khóa bảng (Zero Downtime)
  REINDEX INDEX CONCURRENTLY idx_question_bank_embedding_hnsw;

  -- Bước 4: Cập nhật lại thống kê phân bố dữ liệu cho Query Planner
  VACUUM ANALYZE question_bank;

  -- Bước 5: Bật lại Index Scan và kiểm tra hiệu năng câu lệnh
  SET enable_indexscan = on;
  EXPLAIN ANALYZE 
  SELECT id, content FROM question_bank 
  ORDER BY embedding <=> '[0.01, ...]'::vector 
  LIMIT 5;
  ```

---

### RUNBOOK P2-01: Card Đồ Họa Hết Bộ Nhớ (CUDA Out-Of-Memory)
* **Triệu chứng**: Log ghi `torch.cuda.OutOfMemoryError`, vLLM container dừng nhận request mới.
* **Quy trình Xử lý**:
  ```bash
  # Bước 1: Kiểm tra trạng thái GPU thực tế
  nvidia-smi

  # Bước 2: Ép giải phóng bộ nhớ PyTorch bị chiếm dụng
  docker exec -it interviewai-ai-service python -c "import torch; torch.cuda.empty_cache()"

  # Bước 3: Nếu là vLLM bị treo, khởi động lại container với tham số bảo toàn bộ nhớ
  docker stop interviewai-vllm
  docker run -d --gpus all -p 8001:8000 --ipc=host --name interviewai-vllm \
    vllm/vllm-openai:v0.6.3.post1 \
    --model Qwen/Qwen2.5-32B-Instruct-AWQ \
    --quantization awq \
    --max-model-len 3072 \
    --gpu-memory-utilization 0.85 \
    --port 8000

  # Bước 4: Đợi container sẵn sàng và kiểm tra probe
  sleep 45
  curl -s http://localhost:8001/health | grep -q "ok" && echo "vLLM RECOVERED WITH REDUCED VRAM USAGE"
  ```

---

### RUNBOOK P2-02: Hàng Đợi Redis BullMQ Bị Nghẽn & Kẹt Job (Stalled Jobs)
* **Triệu chứng**: Thí sinh đã trả lời xong nhưng không thấy trả về kết quả chấm điểm, số lượng job trong BullMQ tăng đều.
* **Quy trình Xử lý**:
  ```bash
  # Bước 1: Kiểm tra dung lượng RAM của Redis
  redis-cli info memory | grep -E "used_memory_human|maxmemory_human"

  # Bước 2: Chạy script cứu hộ giải phóng các Job bị kẹt trong server NestJS
  docker exec -it interviewai-backend npm run job:unstall

  # Bước 3: Khởi động lại Worker Feedback Processor để kéo lại các tác vụ đang chờ
  docker restart interviewai-backend
  ```

---

## 4. DIỄN TẬP KHẮC PHỤC SỰ CỐ ĐỊNH KỲ (DISASTER RECOVERY DRILLS)

Đội ngũ kỹ thuật thực hiện diễn tập định kỳ hàng tháng (Chaos Drill):
1. Cố ý ngắt kết nối mạng của `ai-service`.
2. Bấm giờ xem NestJS Circuit Breaker có tự chuyển sang Cloud OpenAI trong vòng $< 60\text{ giây}$ mà không làm văng người dùng ra khỏi phòng thi hay không.
3. Đo lường tỷ lệ dữ liệu bị thất thoát (Mục tiêu: $0\%$ mất dữ liệu).

---

## 5. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Thời Gian Hồi Phục P1 (MTTR)**: Toàn bộ quá trình chuyển mạch dự phòng thành công trong $< 120\text{ giây}$.
2. **Tính Khả Thi 100% Của Lệnh CLI**: Mọi câu lệnh trong Runbook đều đã được chạy thử nghiệm thực tế trong môi trường Staging và không gặp lỗi cú pháp.
3. **Bảo Toàn Trạng Thái Ứng Viên**: Sau bất kỳ sự cố failover nào, thí sinh không phải làm lại câu hỏi vừa trả lời.
