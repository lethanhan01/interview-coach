# TÀI LIỆU 02: PHASE 2 — NỀN TẢNG POSTGRESQL PGVECTOR & DOMAIN-AWARE HYBRID RAG
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/prisma/`, PostgreSQL, Module Prep trong `server/src/modules/interview-prep/`, Python `ai-service/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Đã phân rã thành bộ tài liệu chuyên sâu 5 tasks)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 2 chuyển dịch hệ thống tìm kiếm và cấp phát câu hỏi từ cơ chế ngẫu nhiên sang **Domain-Aware Hybrid RAG 3 Lớp**:

$$\mathbf{Hybrid\ RAG} = \mathbf{Dense\ Semantic\ (BGE-M3)} + \mathbf{Sparse\ Keyword\ (tsvector)} + \mathbf{Metadata\ Filter\ (SFIA/O*NET/Type)} \rightarrow \mathbf{RRF} \rightarrow \mathbf{Reranker}$$

* **Dense Semantic Search (BGE-M3)**: Hiểu sâu sắc toàn bộ ngữ cảnh kỹ thuật của Job Description thông qua không gian vector 1024 chiều và cửa sổ ngữ cảnh 8.192 tokens.
* **Sparse Keyword Search (PostgreSQL tsvector)**: Khớp chuẩn xác 100% các thuật ngữ kỹ thuật đặc thù (Kafka, Kubernetes, Docker, Postgres) bằng danh sách từ khóa tinh chọn, giải quyết dứt điểm bẫy zero-match của Naive RAG.
* **Hard Metadata Filters**: Lọc cứng điều kiện biên nghiệp vụ: `session_type` ('technical' vs 'hr'), mã năng lực `sfia_skill_code`, cấp độ `target_sfia_level <= :level`, và `context_pack_id`.
* **Reciprocal Rank Fusion (RRF $k=60$) & Cross-Encoder Reranker**: Hợp nhất thứ hạng và xếp hạng lại Top 15 ứng viên bằng mô hình `bge-reranker-base` với độ trễ $< 180\text{ms}$.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn hoặc phân chia công việc cho các kỹ sư, vui lòng truy cập các tài liệu đặc tả độc lập theo từng task trong thư mục [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/02_PHASE_2_PGVECTOR_HYBRID_RAG/
├── 00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md          # Kiến trúc tổng thể & Roadmap
├── 01_PGVECTOR_SCHEMA_AND_MIGRATION.md               # Task 2.1: Kích hoạt pgvector, Schema & HNSW Index
├── 02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md        # Task 2.2: BGE-M3 Model & Batch Ingestion Pipeline
├── 03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md            # Task 2.3: Hybrid CTE Query & RRF Fusion (k=60)
├── 04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md  # Task 2.4: bge-reranker-base & Redis L2 Cache
└── 05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md  # Task 2.5: Nâng cấp QuestionBankService & Fallback
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **2.1** | [01_PGVECTOR_SCHEMA_AND_MIGRATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/01_PGVECTOR_SCHEMA_AND_MIGRATION.md) | `server/prisma/`, PostgreSQL | `pgvector`, HNSW index, GIN index, Triggers |
| **2.2** | [02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md) | `ai-service/app/services/rag/` | `BAAI/bge-m3`, SentenceTransformers, CUDA |
| **2.3** | [03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md) | PostgreSQL, SQL CTEs | RRF Algorithm, `websearch_to_tsquery` |
| **2.4** | [04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md) | `ai-service/app/services/rag/` | `bge-reranker-base`, Redis L2 Query Cache |
| **2.5** | [05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md) | `server/src/modules/interview-prep/` | `QuestionBankService`, `AIGatewayDispatcher` |

---

## 3. CHỈ TIÊU NGHIỆM THU PHASE 2 (QUALITY GATES)

1. **Hiệu năng Truy vấn**: Đo đạc 100 lượt truy vấn Hybrid RAG với cơ sở dữ liệu $10.000+$ câu hỏi:
   * Thời gian hoàn thành trung bình (Average Latency) $< 180\text{ ms}$.
   * P99 Latency $< 350\text{ ms}$.
   * Latency khi Cache Hit trên Redis $< 10\text{ ms}$.
2. **Độ chính xác Domain**: $100\%$ câu hỏi được gợi ý bám sát mã ngành O\*NET, `session_type`, và cấp độ SFIA được yêu cầu.
3. **Tính Toàn vẹn Dữ liệu & Rollback**: Hệ thống tự động fallback về câu truy vấn Prisma SQL truyền thống nếu Python service gặp sự cố hoặc cờ `AI_RAG_PROVIDER=prisma` được bật.
