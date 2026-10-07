# TÀI LIỆU 03: PHASE 3 — PIPELINE CHẤM ĐIỂM CHUYÊN SÂU & SEMANTIC ASSESSMENT
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/src/modules/interview-assessment/`, BullMQ Outbox Worker, Python `ai-service/app/services/assessment/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md)  
> **Thư mục tài liệu chi tiết**: [03_PHASE_3_DEEP_ASSESSMENT/](03_PHASE_3_DEEP_ASSESSMENT/00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Đã phân rã thành bộ tài liệu chuyên sâu 5 tasks)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 3 nâng cấp toàn diện cơ chế đánh giá câu trả lời từng lượt (turn evaluation) từ prompt đơn lẻ dễ bị lạm phát điểm sang **Pipeline Đánh giá 2 Chặng Tối ưu (Optimized 2-Pass Assessment Pipeline)** kết hợp **Tính toán Điểm số Tất định 100%**:

1. **Pass 1: Bóc tách Cấu trúc, Kiểm chứng & So khớp Tiêu chí (Extraction Pass)**:
   * Bóc tách 4 thành phần STAR (Situation, Task, Action, Result) định lượng.
   * Thẩm định nhị phân (`passed: true | false`) từng tiêu chí rubric cốt lõi (`core`) và chuyên sâu (`seniority`), bắt buộc có trích dẫn minh chứng (`evidence`).
   * Kiểm chứng tính đúng đắn kỹ thuật (Fact-Checking) và đo mật độ từ khóa sáo rỗng (`buzzwordDensityScore`).
2. **Pass 2: Tổng hợp Nhận xét, Highlight & Bài học Huấn luyện (Synthesis Pass)**:
   * Đưa ra điểm mạnh (`strengths`) và điểm cần cải thiện (`improvements`) có tính hành động cao.
   * Sinh câu trả lời mẫu hoàn hảo (`modelAnswer`) theo chuẩn STAR và cấp độ mục tiêu.
   * Trích xuất danh sách phân đoạn đánh dấu văn bản (`annotatedSegments`) với tọa độ ký tự chính xác để Frontend tô màu và hiển thị tooltip nhận xét.
3. **Tính điểm Tất định & Điều phối Outbox**:
   * [ScoringEngineService](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-assessment/evaluation/scoring-engine.service.ts) tính điểm `questionScore` và suy luận cấp độ SFIA `demonstratedLevel` (1-7) bằng toán học tất định 100%.
   * [FeedbackProcessor](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-assessment/evaluation/feedback/feedback.processor.ts) (NestJS BullMQ Worker) là Consumer duy nhất kéo job, gọi REST sang Python stateless, và lưu dữ liệu trong 1 `prisma.$transaction`.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn hoặc phân chia công việc cho các kỹ sư, vui lòng truy cập các tài liệu đặc tả độc lập theo từng task trong thư mục [03_PHASE_3_DEEP_ASSESSMENT/](03_PHASE_3_DEEP_ASSESSMENT/00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/03_PHASE_3_DEEP_ASSESSMENT/
├── 00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md            # Kiến trúc tổng thể & Roadmap
├── 01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md    # Task 3.1: Pass 1 STAR & Rubric Evaluation
├── 02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md# Task 3.2: Fact-Checking & Anti-Fluff Engine
├── 03_PASS_2_SYNTHESIS_MODEL_ANSWER_AND_ANNOTATIONS.md  # Task 3.3: Pass 2 Synthesis & Annotated Segments
├── 04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md# Task 3.4: ScoringEngineService & SFIA Inference
└── 05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md # Task 3.5: BullMQ Worker & DB Transactions
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **3.1** | [01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md](03_PHASE_3_DEEP_ASSESSMENT/01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md) | `ai-service/app/services/assessment/` | STAR Parsing, Binary Criteria, Quote Citation |
| **3.2** | [02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md](03_PHASE_3_DEEP_ASSESSMENT/02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md) | `ai-service/app/services/assessment/` | Fact-Checking Logic, Buzzword Density Score |
| **3.3** | [03_PASS_2_SYNTHESIS_MODEL_ANSWER_AND_ANNOTATIONS.md](03_PHASE_3_DEEP_ASSESSMENT/03_PASS_2_SYNTHESIS_MODEL_ANSWER_AND_ANNOTATIONS.md) | `ai-service/app/services/assessment/` | STAR Model Answer, Character Offset Healing |
| **3.4** | [04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md](03_PHASE_3_DEEP_ASSESSMENT/04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md) | `server/src/modules/interview-assessment/` | `ScoringEngineService`, SFIA Level Algorithm |
| **3.5** | [05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md](03_PHASE_3_DEEP_ASSESSMENT/05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md) | `server/src/modules/interview-assessment/` | `FeedbackProcessor`, BullMQ, Prisma Transaction |

---

## 3. CHỈ TIÊU NGHIỆM THU PHASE 3 (QUALITY GATES)

1. **Hiệu năng Pipeline 2 Chặng**:
   * Tổng thời gian từ lúc ứng viên submit câu trả lời đến khi hiển thị feedback $< 12.0\text{ giây}$ (Average) và $< 20.0\text{ giây}$ (P99).
2. **Độ chính xác Tiêu chí & Fact-Check**:
   * Phát hiện chính xác $100\%$ các lỗi kiến thức kỹ thuật cài cắm trong test suite.
   * $100\%$ các tiêu chí đạt bắt buộc phải có trích dẫn bằng chứng xác thực (`evidence`) lấy từ transcript.
3. **Tính Toàn vẹn Dữ liệu**:
   * $100\%$ kết quả đánh giá lưu thành công vào bảng `ai_feedbacks` và `annotated_segments` với đầy đủ tọa độ ký tự.
   * Điểm số và cấp độ SFIA được tính toán tất định $100\%$ qua `ScoringEngineService`.
4. **Khả năng Phục hồi (Zero-Downtime Fallback)**:
   * Chuyển đổi cờ `AI_EVALUATION_PROVIDER=openai` hoặc ngắt kết nối Python `ai-service`, NestJS vẫn xử lý và trả về feedback bình thường qua engine dự phòng.
