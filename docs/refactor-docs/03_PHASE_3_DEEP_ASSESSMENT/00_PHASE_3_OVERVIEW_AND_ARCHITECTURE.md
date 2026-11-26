# TÀI LIỆU TỔNG QUAN: PHASE 3 — ĐÁNH GIÁ CÂU TRẢ LỜI & TÍNH ĐIỂM TẤT ĐỊNH
# (MASTER OVERVIEW, ROADMAP & PRAGMATIC TASK BREAKDOWN)

> **Trạng thái**: Approved / Pragmatic Production Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/src/modules/interview-assessment/`, BullMQ Outbox Worker, Python `ai-service/app/services/assessment/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](../00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [02_PHASE_2_PGVECTOR_HYBRID_RAG/](../02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Tinh giản thực dụng: Single-Pass Prompting, bảo toàn ScoringEngineService đã có sẵn, loại bỏ LangGraph và FEVER NLI)  

---

## 1. TỔNG QUAN KIẾN TRÚC PHASE 3

Phase 3 nâng cấp cơ chế đánh giá câu trả lời từng lượt (Turn Evaluation) kết hợp **Single-Pass LLM Evaluation** với **Toán học Tính điểm Tất định 100%**:

```mermaid
graph TD
    Input["Input: Answer Transcript + Audio Metrics + Rubric Criteria"] --> Worker["BullMQ FeedbackProcessor (NestJS Worker)"]
    
    subgraph PythonCompute["Python AI Service (Stateless Single-Pass)"]
        EvalAPI["POST /api/v1/assessment/evaluate<br/>• Bóc tách STAR & Thẩm định Rubric (passed: boolean + evidence)<br/>• Sinh Model Answer & Highlight Annotated Segments"]
    end
    
    subgraph NestJSCore["NestJS Core: Tính điểm Tất định & Giao dịch DB"]
        ScoringEngine["ScoringEngineService (Toán học Tất định 100% - ĐÃ CÓ TRONG CODE)<br/>• calculateQuestionScore(evaluations, rubricCriteria)<br/>• inferDemonstratedLevel(targetLevel, corePassRate, seniorityPassRate)"]
        DBTx["prisma.$transaction (ACID Transaction)<br/>• Lưu AiFeedback + AnnotatedSegment<br/>• Cập nhật UserAnswer.feedbackGenerated<br/>• aggregateSessionSkillScores"]
        Realtime["SseService: Phát event feedback:ready về Client"]
    end

    Worker -->|"Gọi REST"| EvalAPI
    EvalAPI -->>|"Structured Evaluation JSON"| Worker
    Worker --> ScoringEngine
    ScoringEngine --> DBTx
    DBTx --> Realtime
```

---

## 2. DANH MỤC CÁC TÀI LIỆU CHUYÊN SÂU TỪNG TASK (TASK BREAKDOWN)

Phase 3 bao gồm 3 nhiệm vụ kỹ thuật thực dụng:

| Thứ tự | Tệp Tài liệu Đặc tả | Trọng tâm Kỹ thuật & Phạm vi Triển khai |
| :---: | :--- | :--- |
| **Task 3.1** | [01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md](01_PASS_1_STAR_DECONSTRUCTION_AND_RUBRIC_EVAL.md) | Single-Pass Structured Assessment Endpoint (`/assessment/evaluate`), bóc tách STAR, thẩm định rubric nhị phân, sinh câu trả lời mẫu và highlight văn bản. |
| **Task 3.2** | [04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md](04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md) | Xác minh logic toán học tất định 100% trong `ScoringEngineService` (**ĐÃ CÓ TRONG CODE**): tính `questionScore`, suy luận cấp độ SFIA và tổng hợp điểm kỹ năng. |
| **Task 3.3** | [05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md](05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md) | Điều phối bất đồng bộ qua BullMQ Outbox, `FeedbackProcessor` gọi REST sang Python Stateless Compute, lưu trữ DB trong 1 `prisma.$transaction`, bắn SSE realtime. |

---

## 3. CHỈ TIÊU NGHIỆM THU TỔNG THỂ (QUALITY GATE 3)

1. **Hiệu năng Xử lý Bất đồng bộ & Latency**:
   * Tổng thời gian từ lúc ứng viên submit turn đến khi hiển thị feedback $< 6.0\text{s}$ (Average) và $< 9.0\text{s}$ (P95).
2. **Độ chính xác Tiêu chí & Minh chứng**:
   * 100% các tiêu chí đạt bắt buộc phải có trích dẫn bằng chứng xác thực (`evidence`) lấy từ transcript của ứng viên.
   * Nếu không đạt, bắt buộc cung cấp lý do trừ điểm cụ thể (`deductionReason`).
3. **Tính Toàn vẹn Dữ liệu & Deterministic Scoring**:
   * Điểm số và cấp độ SFIA được tính toán tất định 100% bằng toán học qua `ScoringEngineService`.
   * Toàn bộ dữ liệu `ai_feedbacks`, `annotated_segments` và `session_skills` được cập nhật đồng thời trong cùng một `prisma.$transaction`.
4. **Khả năng Phục hồi (Zero-Downtime Fallback)**:
   * Chuyển đổi cờ `AI_EVALUATION_PROVIDER=openai` hoặc ngắt kết nối Python `ai-service`, NestJS vẫn xử lý và trả về feedback bình thường qua Cloud Fallback.
