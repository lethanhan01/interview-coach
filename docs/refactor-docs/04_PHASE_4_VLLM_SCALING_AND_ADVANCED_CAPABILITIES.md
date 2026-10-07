# TÀI LIỆU 04: PHASE 4 — TRẢI NGHIỆM HỎI ĐÀO SÂU THEO LƯỢT (ADAPTIVE PROBING)
# (PRAGMATIC TURN-BASED ADAPTIVE PROBING SPECIFICATION)

> **Trạng thái**: Approved / Pragmatic Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/src/modules/interview-live/turn/`, Python `ai-service/app/services/probing/`, `client/components/interview/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [04_PHASE_4_VLLM_SCALING/](04_PHASE_4_VLLM_SCALING/00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Thay thế toàn diện cụm vLLM và WebSocket duplex bằng trải nghiệm hỏi xoáy đáp sâu theo lượt)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 4 nâng cấp trải nghiệm tương tác phỏng vấn từ hỏi-đáp tĩnh sang **Hỏi Xoáy Đáp Sâu Thích Ứng (Adaptive Probing)** mà không gây rủi ro phình to hạ tầng:

$$\mathbf{Pragmatic\ Adaptive\ Probing} = \mathbf{Turn\text{-}Based\ Probing\ Heuristics} + \mathbf{Sub\text{-}Turn\ Persistence\ (probing\_context\_json)}$$

1. **Khả thi & Ổn định Tuyệt đối**:
   * Loại bỏ hoàn toàn sự phụ thuộc vào máy chủ GPU tự host (vLLM) đắt đỏ và các luồng WebSocket Streaming song công dễ đứt đoạn.
   * Sử dụng API LLM tiêu chuẩn (OpenAI / Claude / local LM Studio qua `@infra/ai`) để phân tích câu trả lời chính và sinh 1 câu hỏi đào sâu sắc bén.
2. **Kiểm soát Ngân sách Hỏi xoáy (Strict Budget)**:
   * Junior ($\le 3$): Tối đa **1 câu hỏi đào sâu** cho mỗi câu hỏi chính.
   * Mid/Senior ($\ge 4$): Tối đa **2 câu hỏi đào sâu** cho mỗi câu hỏi chính.
   * Câu trả lời quá ngắn ($< 20$ từ) hoặc lạc đề sẽ tự động bỏ qua để tiết kiệm thời gian.
3. **Mô hình Dữ liệu Sub-turn An toàn**:
   * Câu hỏi phụ và câu trả lời phụ được lưu trữ trực tiếp trong trường `probingContextJson` của [`UserAnswer`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/prisma/schema.prisma), không tạo thêm bản ghi câu hỏi làm vỡ ràng buộc duy nhất `orderIndex`.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK

Thư mục [04_PHASE_4_VLLM_SCALING/](04_PHASE_4_VLLM_SCALING/00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md) được tinh giản thành 2 tasks cốt lõi:

```
docs/refactor-docs/04_PHASE_4_VLLM_SCALING/
├── 00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md         # Kiến trúc tổng thể & Cơ chế hỏi xoáy Turn-based
├── 01_ADAPTIVE_PROBING_ENGINE_AND_BUDGET.md        # Task 4.1: Adaptive Probing Engine, Prompt & Budget
└── 02_NESTJS_PROBING_INTAKE_AND_DATA_MODEL.md      # Task 4.2: Tích hợp NestJS TurnController & probingContextJson
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **4.1** | [01_ADAPTIVE_PROBING_ENGINE_AND_BUDGET.md](04_PHASE_4_VLLM_SCALING/01_ADAPTIVE_PROBING_ENGINE_AND_BUDGET.md) | `ai-service/app/services/probing/` | LLM Prompting, Heuristics lọc nội dung, Probing Budget (Junior 1 / Senior 2) |
| **4.2** | [02_NESTJS_PROBING_INTAKE_AND_DATA_MODEL.md](04_PHASE_4_VLLM_SCALING/02_NESTJS_PROBING_INTAKE_AND_DATA_MODEL.md) | `server/src/modules/interview-live/turn/`, `client/` | `TurnController`, DTO Sub-turn, Prisma `probingContextJson`, UI 2-step |

---

## 3. TIÊU CHÍ NGHIỆM THU (QUALITY GATE 4)

1. **Độ trễ Sinh câu hỏi phụ**: Thời gian AI phản hồi câu hỏi đào sâu $< 1.5\text{s}$ (P95).
2. **Độ chính xác Ngữ cảnh**: 100% câu hỏi đào sâu bám sát công nghệ hoặc thuật ngữ chuyên ngành do ứng viên trình bày trong câu trả lời chính.
3. **Bảo toàn Dữ liệu**: Câu hỏi phụ và câu trả lời phụ được ghi nhận đầy đủ vào DB và được nối vào chuỗi văn bản đánh giá ở Phase 3 mà không làm gián đoạn luồng phỏng vấn.
