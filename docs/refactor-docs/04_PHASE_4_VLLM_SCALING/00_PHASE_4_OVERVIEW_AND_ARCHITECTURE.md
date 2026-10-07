# TÀI LIỆU TỔNG QUAN: PHASE 4 — TRẢI NGHIỆM HỎI ĐÀO SÂU THEO LƯỢT (ADAPTIVE PROBING)
# (MASTER OVERVIEW, ROADMAP & PRAGMATIC TASK BREAKDOWN)

> **Trạng thái**: Approved / Pragmatic Production Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/src/modules/interview-live/turn/`, Python `ai-service/app/services/probing/`, `client/components/interview/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](../00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](../01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Phiên bản**: 3.0.0 (Thay thế cụm vLLM và WebSocket duplex bằng trải nghiệm hỏi xoáy đáp sâu theo lượt)  

---

## 1. TỔNG QUAN KIẾN TRÚC PHASE 4

Phase 4 nâng cấp hệ thống InterviewCoach từ cơ chế hỏi-đáp tuần tự đơn điệu sang **Trải nghiệm Hỏi Xoáy Đáp Sâu Thích Ứng (Turn-based Adaptive Probing)** bám sát thực tế phỏng vấn kỹ thuật:

```mermaid
graph TD
    subgraph Client["Next.js Web Client"]
        UI["Turn-based Interview Room"]
        Recorder["VoiceRecorder (Answer Main Question)"]
        ProbingUI["Probing Sub-turn UI (Answer Follow-up Question)"]
    end

    subgraph Gateways["NestJS Core (server/)"]
        TC["TurnController (/turns & /turns/probing)"]
        TS["TurnService & VoiceAnswerIntakeHandler"]
        Prisma["Prisma ORM ($transaction)"]
    end

    subgraph AIService["Python AI Service (Stateless Probing Engine)"]
        ProbeEndpoint["POST /api/v1/probing/generate<br/>• Heuristics phát hiện công nghệ/quyết định kỹ thuật<br/>• Strictly controlled Probing Budget (Junior 1 / Senior 2)"]
    end

    subgraph Database["PostgreSQL 16"]
        UserAnswerTable[("public.user_answers<br/>• answer_text (câu trả lời chính)<br/>• probing_context_json (sub-turn đào sâu)")]
    end

    Recorder -->|"1. Submit Main Answer"| TC
    TC --> TS
    TS -->|"Lưu câu trả lời chính"| Prisma
    Prisma --> UserAnswerTable
    TS -->|"2. Kiểm tra điều kiện hỏi đào sâu"| ProbeEndpoint
    ProbeEndpoint -->>|"shouldProbe: true + probingQuestion"| TS
    TS -->>|"Yêu cầu trả lời câu hỏi phụ"| TC
    TC -->>|"Hiển thị câu hỏi xoáy"| ProbingUI
    
    ProbingUI -->|"3. Submit Follow-up Answer"| TC
    TC --> TS
    TS -->|"Cập nhật probing_context_json"| Prisma
    Prisma --> UserAnswerTable
    TS -->|"4. Đẩy job chấm điểm vào Outbox"| OutboxWorker["BullMQ Worker (Phase 3)"]
```

---

## 2. DANH MỤC CÁC TÀI LIỆU CHUYÊN SÂU TỪNG TASK (TASK BREAKDOWN)

Phase 4 bao gồm 2 nhiệm vụ kỹ thuật thực dụng:

| Thứ tự | Tệp Tài liệu Đặc tả | Trọng tâm Kỹ thuật & Phạm vi Triển khai |
| :---: | :--- | :--- |
| **Task 4.1** | [01_ADAPTIVE_PROBING_ENGINE_AND_BUDGET.md](01_ADAPTIVE_PROBING_ENGINE_AND_BUDGET.md) | Xây dựng Adaptive Probing Engine trong Python `ai-service`: Prompt Engineering, quy tắc lọc nội dung, kiểm soát ngân sách hỏi xoáy (Junior 1 / Senior 2). |
| **Task 4.2** | [02_NESTJS_PROBING_INTAKE_AND_DATA_MODEL.md](02_NESTJS_PROBING_INTAKE_AND_DATA_MODEL.md) | Tích hợp NestJS Core: Thêm trường `probingContextJson` vào `UserAnswer`, endpoint `/sessions/:id/turns/probing`, FSM 2 bước trên giao diện Client. |

---

## 3. CHỈ TIÊU NGHIỆM THU TỔNG THỂ (QUALITY GATE 4)

1. **Độ Trễ Sinh Câu Hỏi Phụ**: Thời gian AI sinh câu hỏi đào sâu $< 1.5\text{s}$ (P95) khi gọi API LLM tiêu chuẩn.
2. **Kiểm Soát Ngân Sách**: Tuyệt đối không sinh câu hỏi đào sâu nếu câu trả lời chính quá ngắn ($< 20$ từ) hoặc lạc đề; tuân thủ nghiêm ngặt ngân sách tối đa 1 câu cho Junior và 2 câu cho Senior.
3. **Tính Toàn Vẹn Dữ Liệu**: Câu hỏi đào sâu và câu trả lời đào sâu được lưu trữ trọn vẹn trong `probingContextJson` và được tổng hợp vào nội dung đánh giá ở Phase 3 mà không làm vỡ cấu trúc câu hỏi của phiên.
