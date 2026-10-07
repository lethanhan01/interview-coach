# TÀI LIỆU 02: PHASE 2 — NỀN TẢNG POSTGRESQL PGVECTOR & DOMAIN-AWARE HYBRID RAG
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/prisma/`, PostgreSQL 16, Module Prep trong `server/src/modules/interview-prep/`, Python `ai-service/app/services/rag/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.1.0 (Chuẩn hóa toàn diện chuỗi thực thi tuần tự & Thuật ngữ tiếng Anh kỹ thuật)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 2 chuyển dịch hệ thống tìm kiếm và cấp phát câu hỏi từ cơ chế bốc ngẫu nhiên (Fisher-Yates) sang **Domain-Aware Hybrid RAG 3 Lớp**:

$$\mathbf{Hybrid\ RAG} = \mathbf{Dense\ Semantic\ (BGE-M3)} + \mathbf{Sparse\ Keyword\ (tsvector)} + \mathbf{Metadata\ Filter\ (SFIA/O*NET/Type)} \rightarrow \mathbf{RRF} \rightarrow \mathbf{Reranker}$$

* **Dense Semantic Search (BGE-M3)**: Hiểu sâu sắc toàn bộ ngữ cảnh kỹ thuật của Job Description thông qua không gian vector 1024 chiều và context window 8.192 tokens.
* **Sparse Keyword Search (PostgreSQL tsvector)**: Khớp chuẩn xác 100% các thuật ngữ kỹ thuật đặc thù (Kafka, Kubernetes, Docker, Postgres) bằng danh sách từ khóa tinh chọn, triệt tiêu bẫy zero-match của Naive RAG.
* **Hard Metadata SQL Filters**: Lọc cứng điều kiện biên nghiệp vụ: `session_type` ('technical' vs 'hr'), mã năng lực `sfia_skill_code`, cấp độ `target_sfia_level <= :level`, và `context_pack_id`.
* **Reciprocal Rank Fusion (RRF $k=60$) & Cross-Encoder Reranker**: Hợp nhất thứ hạng và xếp hạng lại Top 15 candidates bằng mô hình `bge-reranker-base` với Latency $< 180\text{ms}$.
* **Redis L2 Query Cache**: Bộ nhớ đệm lưu trữ kết quả truy vấn câu hỏi, đưa Latency khi Cache Hit xuống $< 10\text{ms}$.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn tuần tự, AI Agent bắt buộc thực thi lần lượt các tài liệu đặc tả độc lập theo từng task trong thư mục [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md):

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
| **2.1** | [01_PGVECTOR_SCHEMA_AND_MIGRATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/01_PGVECTOR_SCHEMA_AND_MIGRATION.md) | `server/prisma/`, PostgreSQL | `pgvector`, Non-blocking HNSW index, GIN index, Triggers |
| **2.2** | [02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md) | `ai-service/app/services/rag/` | `BAAI/bge-m3`, SentenceTransformers, CUDA |
| **2.3** | [03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md) | PostgreSQL, SQL CTEs | RRF Algorithm, `websearch_to_tsquery` |
| **2.4** | [04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md) | `ai-service/app/services/rag/` | `bge-reranker-base`, Redis L2 Query Cache |
| **2.5** | [05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md) | `server/src/modules/interview-prep/` | `QuestionBankService`, `AIGatewayDispatcher` |

---

## 3. KHUNG BÀN GIAO & LIÊN KẾT TUẦN TỰ (PHASE 2 EXECUTION & HANDOVER PROTOCOL)

### 3.1 Tiền đề Bàn giao Nhận từ Phase 1 (Incoming Handover)
* Microservice `ai-service` đã vận hành ổn định trên port 8000 (FastAPI + `uv`).
* `AIGatewayDispatcher` phía NestJS đã thiết lập cơ chế Strict Toggle.
* Đã vượt qua toàn bộ tiêu chí của **Quality Gate 1**.

### 3.2 Chuỗi Thực thi Tuần tự (Task Sequential Flow)
```
Task 2.1 (pgvector Migration) ──> Task 2.2 (BGE-M3 Embedder) ──> Task 2.3 (Hybrid CTE Query)
                                                                           │
Task 2.5 (NestJS Integration) <── Task 2.4 (Reranker & Cache) <───────────┘
```

### 3.3 Handover Sang Phase 3 (Phase 2 -> Phase 3 Transition)
* **Điều kiện hoàn thành Phase 2**: Vượt qua toàn bộ tiêu chí của **Quality Gate 2**.
* **Đầu ra bàn giao**: Ngân hàng câu hỏi `question_bank` được trang bị vector 1024 chiều và `tsv_content`, pipeline cấp phát câu hỏi theo SFIA/O*NET hoạt động ổn định.
* **Tài liệu chuyển tiếp**: Bắt đầu Phase 3 tại [03_PHASE_3_DEEP_ASSESSMENT_AND_SEMANTIC_SCORING.md](03_PHASE_3_DEEP_ASSESSMENT_AND_SEMANTIC_SCORING.md) (Task 3.1: Pass 1 STAR Deconstruction).

---

## 4. CHỈ TIÊU NGHIỆM THU PHASE 2 (QUALITY GATE 2)

1. **Hiệu năng Truy vấn & Latency**: Đo đạc 100 lượt truy vấn Hybrid RAG với cơ sở dữ liệu $10.000+$ câu hỏi:
   * Average Latency $< 180\text{ ms}$.
   * P99 Latency $< 350\text{ ms}$.
   * Latency khi Cache Hit trên Redis L2 Cache $< 10\text{ ms}$.
2. **Độ chính xác Domain**: $100\%$ câu hỏi được gợi ý bám sát mã ngành O\*NET, `session_type`, và cấp độ SFIA được yêu cầu.
3. **Tính Toàn vẹn Dữ liệu & Non-blocking Migration**:
   * Quá trình tạo index HNSW không gây Table Lock trên database production (`CREATE INDEX CONCURRENTLY`).
   * Hệ thống tự động Fallback về câu truy vấn Prisma SQL truyền thống nếu Python service gặp sự cố hoặc cờ `AI_RAG_PROVIDER=prisma` được kích hoạt.
