# PHÂN HỆ LLM SERVING & INFERENCE SCALING (LLM-RUNTIME)

> **Trạng thái**: 🟡 Planned (Dự kiến chuẩn hóa sau khi hoàn thành Phase 4)  
> **Cấp độ**: Functional Subsystem Specification  
> **Áp dụng cho**: `ai-service/app/services/llm/`, vLLM Server, Mô hình mã nguồn mở (Qwen/Llama)  
> **Tài liệu cha**: [docs/architecture/README.md](../README.md)  
> **Tài liệu Kế hoạch Triển khai**: [docs/refactor-docs/04_PHASE_4_VLLM_SCALING_AND_ADVANCED_CAPABILITIES.md](../../refactor-docs/04_PHASE_4_VLLM_SCALING_AND_ADVANCED_CAPABILITIES.md)  

---

## 1. TỔNG QUAN PHÂN HỆ DỰ KIẾN
Phân hệ LLM Serving & Inference Scaling chịu trách nhiệm:
1. **Self-Hosted LLM Serving**: Vận hành mô hình mã nguồn mở (Qwen 2.5 7B/14B, Llama 3) bằng runtime **vLLM** hiệu năng cao với PagedAttention và continuous batching.
2. **Adaptive Probing (Truy vấn Đào sâu Thích ứng)**: Khả năng tự động phân tích câu trả lời của ứng viên để đặt câu hỏi đào sâu (follow-up question) theo thời gian thực trong lượt phỏng vấn.
3. **Tối ưu Hóa Thông lượng & Độ trễ**: Giảm thiểu chi phí gọi token đám mây và bảo đảm độ trễ phản hồi theo lượt $< 1.5\text{s}$.

*Ghi chú: Thư mục này sẽ được chuẩn hóa thành Living Documentation đầy đủ các sơ đồ, onboarding guide và API contracts ngay sau khi Phase 4 vượt qua Quality Gate 4.*
