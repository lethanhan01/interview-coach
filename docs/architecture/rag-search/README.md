# PHÂN HỆ RAG & HYBRID SEMANTIC SEARCH (RAG-SEARCH)

> **Trạng thái**: 🟡 Planned (Dự kiến chuẩn hóa sau khi hoàn thành Phase 2)  
> **Cấp độ**: Functional Subsystem Specification  
> **Áp dụng cho**: `server/src/modules/question/`, `ai-service/app/services/rag/`, PostgreSQL `pgvector`  
> **Tài liệu cha**: [docs/architecture/README.md](../README.md)  
> **Tài liệu Kế hoạch Triển khai**: [docs/refactor-docs/02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md](../../refactor-docs/02_PHASE_2_PGVECTOR_HYBRID_RAG_FOUNDATION.md)  

---

## 1. TỔNG QUAN PHÂN HỆ DỰ KIẾN
Phân hệ RAG & Hybrid Semantic Search chịu trách nhiệm:
1. **Lưu trữ & Lập chỉ mục Vector**: Kích hoạt extension `pgvector` trên PostgreSQL 16 với chỉ mục HNSW nhằm tăng tốc độ truy vấn độ tương đồng cosine.
2. **Hybrid Search (Tìm kiếm Lai)**: Kết hợp tìm kiếm toàn văn Full-Text Search (tsvector tiếng Việt/Anh) với Vector Search ngữ nghĩa từ mô hình BGE Embeddings.
3. **Question Bank Recommendation**: Đề xuất câu hỏi phỏng vấn thông minh theo độ tương đồng với mô tả công việc (Job Description) và hồ sơ ứng viên (Candidate Resume).

*Ghi chú: Thư mục này sẽ được chuẩn hóa thành Living Documentation đầy đủ các sơ đồ, onboarding guide và API contracts ngay sau khi Phase 2 vượt qua Quality Gate 2.*
