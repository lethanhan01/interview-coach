# TÀI LIỆU 03: PHASE 3 — PIPELINE CHẤM ĐIỂM CHUYÊN SÂU, MULTI-AGENT FACT-CHECKING & SEMANTIC ASSESSMENT
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/src/modules/interview-assessment/`, BullMQ Outbox Worker, Python `ai-service/app/services/assessment/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md)  
> **Thư mục tài liệu chi tiết**: [03_PHASE_3_DEEP_ASSESSMENT/](03_PHASE_3_DEEP_ASSESSMENT/00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Tái cấu trúc tích hợp LangGraph Multi-Agent Fact-Checking Graph)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 3 nâng cấp toàn diện cơ chế đánh giá câu trả lời từng lượt (Turn Evaluation) từ prompt đơn lẻ dễ bị lạm phát điểm sang **Multi-Agent Deep Assessment StateGraph** kết hợp **Deterministic Scoring 100%**:

1. **Pass 1: Bóc tách Cấu trúc, Kiểm chứng & So khớp Tiêu chí (Extraction Pass)**:
   * Bóc tách 4 thành phần STAR (Situation, Task, Action, Result) định lượng.
   * Thẩm định nhị phân (`passed: true | false`) từng tiêu chí rubric cốt lõi (`core`) và chuyên sâu (`seniority`), bắt buộc có trích dẫn minh chứng (`evidence`).
   * Đo lường mật độ từ sáo rỗng (`buzzwordDensityScore`) và trích xuất các phát biểu kỹ thuật nguyên tử (`atomic claims`).
2. **Multi-Agent Technical Fact-Checking (Sub-Task 3.2B)**:
   * Tác tử `TechnicalFactCheckAgent` truy vấn kho tài liệu kỹ thuật chuẩn (`tech_docs_vectors`) thông qua `TechnicalGroundTruthTool`.
   * Thẩm định tính chính xác theo chuẩn **FEVER NLI 3 trạng thái** (Supported / Contradicted / Unverified) có trích dẫn bằng chứng văn bản cụ thể.
   * Vòng lặp tự phản tư (**Self-Reflection Loop**): Tự động viết lại truy vấn nếu tài liệu ban đầu chưa đủ độ tin cậy.
3. **Pass 2: Tổng hợp Nhận xét, Highlight & Bài học Huấn luyện (Synthesis Pass)**:
   * Đưa ra điểm mạnh (`strengths`) và điểm cần cải thiện (`improvements`) có tính hành động cao.
   * Sinh câu trả lời mẫu hoàn hảo (`modelAnswer`) theo chuẩn STAR và cấp độ mục tiêu.
   * Trích xuất danh sách phân đoạn đánh dấu văn bản (`annotatedSegments`) với Character Offset Healing chính xác để Frontend tô màu và hiển thị tooltip nhận xét.
4. **Deterministic Scoring & Outbox Orchestration**:
   * [ScoringEngineService](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-assessment/evaluation/scoring-engine.service.ts) tính điểm `questionScore` và suy luận cấp độ SFIA `demonstratedLevel` (1-7) bằng toán học tất định 100%.
   * [FeedbackProcessor](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-assessment/evaluation/feedback/feedback.processor.ts) (NestJS BullMQ Worker) là Consumer duy nhất kéo job, gọi REST sang Python Stateless Compute, và lưu dữ liệu trong 1 `prisma.$transaction`.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn tuần tự, AI Agent bắt buộc thực thi lần lượt các tài liệu đặc tả độc lập theo từng task trong thư mục [03_PHASE_3_DEEP_ASSESSMENT/](03_PHASE_3_DEEP_ASSESSMENT/00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/03_PHASE_3_DEEP_ASSESSMENT/
├── 00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md                   # Kiến trúc tổng thể & LangGraph Multi-Agent Roadmap
├── 01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md           # Task 3.1: Pass 1 STAR & Rubric Evaluation
├── 02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md       # Task 3.2: Atomic Claims, Anti-Fluff Math & Heuristics
├── 02B_AGENTIC_FACT_CHECKING_GRAPH_AND_EVIDENCE_RETRIEVAL.md  # Sub-Task 3.2B: LangGraph Fact-Checking Agent & FEVER NLI
├── 03_PASS_2_SYNTHESIS_MODEL_ANSWER_AND_ANNOTATIONS.md         # Task 3.3: Pass 2 Synthesis & Annotated Segments
├── 04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md       # Task 3.4: ScoringEngineService & SFIA Inference
└── 05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md        # Task 3.5: BullMQ Worker & DB Transactions
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **3.1** | [01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md](03_PHASE_3_DEEP_ASSESSMENT/01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md) | `ai-service/app/services/assessment/` | STAR Parsing, Binary Criteria, Quote Citation |
| **3.2** | [02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md](03_PHASE_3_DEEP_ASSESSMENT/02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md) | `ai-service/app/services/assessment/` | Atomic Claims Extraction, Buzzword Density Score Math |
| **3.2B**| [02B_AGENTIC_FACT_CHECKING_GRAPH_AND_EVIDENCE_RETRIEVAL.md](03_PHASE_3_DEEP_ASSESSMENT/02B_AGENTIC_FACT_CHECKING_GRAPH_AND_EVIDENCE_RETRIEVAL.md) | `ai-service/app/services/assessment/` | LangGraph StateGraph, `TechnicalFactCheckAgent`, FEVER NLI, Self-Reflection |
| **3.3** | [03_PASS_2_SYNTHESIS_MODEL_ANSWER_AND_ANNOTATIONS.md](03_PHASE_3_DEEP_ASSESSMENT/03_PASS_2_SYNTHESIS_MODEL_ANSWER_AND_ANNOTATIONS.md) | `ai-service/app/services/assessment/` | STAR Model Answer, Character Offset Healing |
| **3.4** | [04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md](03_PHASE_3_DEEP_ASSESSMENT/04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md) | `server/src/modules/interview-assessment/` | `ScoringEngineService`, SFIA Level Algorithm |
| **3.5** | [05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md](03_PHASE_3_DEEP_ASSESSMENT/05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md) | `server/src/modules/interview-assessment/` | `FeedbackProcessor`, BullMQ, Prisma Transaction |

---

## 3. KHUNG BÀN GIAO & LIÊN KẾT TUẦN TỰ (PHASE 3 EXECUTION & HANDOVER PROTOCOL)

### 3.1 Tiền đề Bàn giao Nhận từ Phase 2 (Incoming Handover)
* Toàn bộ 4 kho tri thức pgvector và bộ 3 AI Tools (`QuestionBankRetrieverTool`, `CompetencyTaxonomyTool`, `TechnicalGroundTruthTool`) đã hoạt động ổn định.
* Đã vượt qua toàn bộ tiêu chí của **Quality Gate 2**.

### 3.2 Chuỗi Thực thi Tuần tự (Task Sequential Flow)
```
Task 3.1 (Pass 1 STAR) ──> Task 3.2 (Atomic Claims & Buzzword Math)
                                   │
                                   ▼
Task 3.3 (Pass 2 Synthesis) <── Sub-Task 3.2B (LangGraph Fact-Checking Agent)
         │
         ▼
Task 3.4 (Deterministic Scoring) ──> Task 3.5 (BullMQ Outbox Worker)
```

### 3.3 Handover Sang Phase 4 (Phase 3 -> Phase 4 Transition)
* **Điều kiện hoàn thành Phase 3**: Vượt qua toàn bộ tiêu chí của **Quality Gate 3**.
* **Đầu ra bàn giao**: Pipeline đánh giá câu trả lời kết hợp Multi-Agent Fact-Checking đã chạy ổn định qua BullMQ Outbox Worker và lưu dữ liệu trong 1 `prisma.$transaction`.
* **Tài liệu chuyển tiếp**: Bắt đầu Phase 4 tại [04_PHASE_4_VLLM_SCALING_AND_ADVANCED_CAPABILITIES.md](04_PHASE_4_VLLM_SCALING_AND_ADVANCED_CAPABILITIES.md) (Task 4.1: Deploy vLLM Cluster).

---

## 4. CHỈ TIÊU NGHIỆM THU PHASE 3 (QUALITY GATE 3)

1. **Hiệu năng Pipeline & Latency**:
   * Tổng thời gian từ lúc ứng viên submit câu trả lời đến khi hiển thị feedback $< 12.0\text{ giây}$ (Average) và $< 20.0\text{ giây}$ (P99).
2. **Độ chính xác Tiêu chí & Fact-Check**:
   * Phân loại chuẩn xác 3 trạng thái (Supported / Contradicted / Unverified) cho $100\%$ các phát biểu kỹ thuật nguyên tử.
   * Phát hiện chính xác $100\%$ các lỗi kiến thức kỹ thuật cài cắm trong test suite fixture.
   * $100\%$ các tiêu chí đạt bắt buộc phải có trích dẫn bằng chứng xác thực (`evidence`) lấy từ transcript.
3. **Tính Toàn vẹn Dữ liệu & Deterministic Scoring**:
   * $100\%$ kết quả đánh giá lưu thành công vào bảng `ai_feedbacks` và `annotated_segments` qua duy nhất 1 `prisma.$transaction`.
   * Điểm số và cấp độ SFIA được tính toán tất định $100\%$ qua `ScoringEngineService`.
4. **Khả năng Phục hồi (Zero-Downtime Fallback)**:
   * Chuyển đổi cờ `AI_EVALUATION_PROVIDER=openai` hoặc ngắt kết nối Python `ai-service`, NestJS vẫn xử lý và trả về feedback bình thường qua Cloud Fallback.
