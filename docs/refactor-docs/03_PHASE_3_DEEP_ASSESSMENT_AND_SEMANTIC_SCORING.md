# TÀI LIỆU 03: PHASE 3 — ĐÁNH GIÁ CÂU TRẢ LỜI & TÍNH ĐIỂM TẤT ĐỊNH
# (PRAGMATIC SINGLE-PASS ASSESSMENT & DETERMINISTIC SCORING SPECIFICATION)

> **Trạng thái**: Approved / Pragmatic Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/src/modules/interview-assessment/`, BullMQ Outbox Worker, Python `ai-service/app/services/assessment/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md)  
> **Thư mục tài liệu chi tiết**: [03_PHASE_3_DEEP_ASSESSMENT/](03_PHASE_3_DEEP_ASSESSMENT/00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Tinh giản thực dụng: Single-Pass Prompting, bảo toàn ScoringEngineService đã có sẵn, loại bỏ LangGraph và FEVER NLI)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 3 nâng cấp cơ chế đánh giá câu trả lời từng lượt (Turn Evaluation) theo nguyên tắc chính xác, nhanh chóng và công bằng:

$$\mathbf{Pragmatic\ Evaluation} = \mathbf{Single\text{-}Pass\ LLM\ Evidence\ Verification} + \mathbf{Deterministic\ Math\ Scoring\ (NestJS)}$$

1. **Đánh giá Một Lượt Toàn diện (Single-Pass Assessment)**:
   * Thay vì tách làm 2 lượt gọi LLM (Pass 1 bóc tách STAR $\to$ Pass 2 tổng hợp nhận xét) làm tăng gấp đôi độ trễ, hệ thống gom toàn bộ yêu cầu vào **1 prompt LLM duy nhất** qua endpoint `POST /api/v1/assessment/evaluate`.
   * Trả về kết quả có cấu trúc Pydantic v2: Tiêu chí nhị phân (`passed: true | false`), trích dẫn bằng chứng (`evidence`), điểm mạnh (`strengths`), điểm cải thiện (`improvements`), câu trả lời mẫu (`modelAnswer`), và phân đoạn đánh dấu văn bản (`annotatedSegments`).
2. **Bảo tồn Thuật toán Tính điểm Tất định (Deterministic Scoring)**:
   * Thuật toán tính điểm toán học và suy luận cấp độ SFIA 9 **ĐÃ ĐƯỢC TRIỂN KHAI HOÀN CHỈNH 100%** trong [`ScoringEngineService`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-assessment/evaluation/scoring-engine.service.ts) tại NestJS.
   * AI chỉ đóng vai trò trọng tài thẩm định bằng chứng; toàn bộ điểm số (`questionScore`) và cấp độ thể hiện (`inferDemonstratedLevel`) do toán học quyết định, loại bỏ 100% hiện tượng lạm phát điểm và tính bất định của LLM.
3. **Điều phối Bất đồng bộ qua BullMQ Outbox**:
   * [`FeedbackProcessor`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-assessment/evaluation/feedback/feedback.processor.ts) là Consumer duy nhất kéo job, gọi REST sang Python Stateless Compute, nhận kết quả và lưu vào cơ sở dữ liệu trong đúng một `prisma.$transaction`.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK

Thư mục [03_PHASE_3_DEEP_ASSESSMENT/](03_PHASE_3_DEEP_ASSESSMENT/00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md) được tinh giản thành 3 tasks cốt lõi:

```
docs/refactor-docs/03_PHASE_3_DEEP_ASSESSMENT/
├── 00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md                   # Kiến trúc tổng thể & Quality Gate 3
├── 01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md           # Task 3.1: Single-Pass Assessment Endpoint & Schema
├── 04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md       # Task 3.2: ScoringEngineService Verification (ĐÃ CÓ)
└── 05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md        # Task 3.3: BullMQ Outbox Worker & ACID Transaction
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **3.1** | [01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md](03_PHASE_3_DEEP_ASSESSMENT/01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md) | `ai-service/app/services/assessment/` | Single-Pass LLM Prompt, Pydantic v2 Schema, STAR & Rubric Evidence |
| **3.2** | [04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md](03_PHASE_3_DEEP_ASSESSMENT/04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md) | `server/src/modules/interview-assessment/` | `ScoringEngineService` (ALREADY IMPLEMENTED), Toán học tất định 100% |
| **3.3** | [05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md](03_PHASE_3_DEEP_ASSESSMENT/05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md) | `server/src/modules/interview-assessment/` | `FeedbackProcessor`, BullMQ Outbox, `prisma.$transaction`, SSE Event |

---

## 3. TIÊU CHÍ NGHIỆM THU (QUALITY GATE 3)

1. **Thời gian Xử lý Toàn trình**: Tổng thời gian từ khi nộp câu trả lời đến khi hiển thị feedback $< 6.0\text{s}$ (Average) và $< 9.0\text{s}$ (P95) nhờ kỹ thuật Single-Pass.
2. **Tính Tất định của Điểm số**: Cùng một bộ kết quả tiêu chí đầu vào, điểm số và cấp độ SFIA được tính toán đồng nhất 100% qua `ScoringEngineService`.
3. **Tính Toàn vẹn Giao dịch**: Toàn bộ dữ liệu `ai_feedbacks`, `annotated_segments` và `session_skills` được cập nhật đồng thời trong cùng một `prisma.$transaction`.
