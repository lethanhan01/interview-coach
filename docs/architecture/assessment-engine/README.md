# PHÂN HỆ DEEP ASSESSMENT & SEMANTIC SCORING (ASSESSMENT-ENGINE)

> **Trạng thái**: 🟡 Planned (Dự kiến chuẩn hóa sau khi hoàn thành Phase 3)  
> **Cấp độ**: Functional Subsystem Specification  
> **Áp dụng cho**: `server/src/modules/interview-assessment/`, `ai-service/app/services/assessment/`  
> **Tài liệu cha**: [docs/architecture/README.md](../README.md)  
> **Tài liệu Kế hoạch Triển khai**: [docs/refactor-docs/03_PHASE_3_DEEP_ASSESSMENT_AND_SEMANTIC_SCORING.md](../../refactor-docs/03_PHASE_3_DEEP_ASSESSMENT_AND_SEMANTIC_SCORING.md)  

---

## 1. TỔNG QUAN PHÂN HỆ DỰ KIẾN
Phân hệ Deep Assessment & Semantic Scoring chịu trách nhiệm:
1. **Đánh giá Rubric Đa chiều**: Chấm điểm câu trả lời của ứng viên theo 4 khía cạnh kỹ thuật: Tính chính xác, Độ sâu kiến trúc, Kỹ năng giải quyết vấn đề, và Năng lực trình bày.
2. **Chuẩn hóa Năng lực SFIA (Skills Framework for the Information Age)**: Kết hợp Single-Pass LLM Evaluation với thuật toán toán học tất định tại `ScoringEngineService` để suy luận chính xác cấp độ SFIA Level 1 đến Level 7.
3. **Phản hồi Cá nhân hóa**: Sinh báo cáo chi tiết kèm điểm mạnh, điểm yếu và gợi ý câu trả lời mẫu tối ưu.

*Ghi chú: Thư mục này sẽ được chuẩn hóa thành Living Documentation đầy đủ các sơ đồ, onboarding guide và API contracts ngay sau khi Phase 3 vượt qua Quality Gate 3.*
