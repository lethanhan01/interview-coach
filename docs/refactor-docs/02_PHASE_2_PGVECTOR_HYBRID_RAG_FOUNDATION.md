# TÀI LIỆU 02: PHASE 2 — NỀN TẢNG POSTGRESQL PGVECTOR, MULTI-CORPUS STORAGE & STANDARDIZED RETRIEVAL TOOLS
# (MASTER BLUEPRINT & NAVIGATION INDEX CHO AGENTIC RAG FOUNDATION)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/prisma/`, PostgreSQL 16 `pgvector`, `server/src/modules/interview-prep/`, Python `ai-service/app/services/rag/`, `ai-service/app/services/tools/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Tái cấu trúc phục vụ Agentic RAG Multi-Corpus & Pydantic Tools)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 2 giải quyết bài toán nền móng cho hệ sinh thái **Agentic RAG**: Chuyển dịch từ cơ chế bốc câu hỏi ngẫu nhiên đơn sơ (Fisher-Yates) sang **Nền tảng Lưu trữ Đa Nguồn (Multi-Corpus Storage) & Bộ Công cụ AI Chuẩn hóa (Standardized Retrieval Tools)**:

$$\mathbf{Multi\text{-}Corpus\ Agentic\ RAG} = \mathbf{Vector\ Embeddings\ (BGE\text{-}M3)} + \mathbf{Full\text{-}Text\ (tsvector)} + \mathbf{RRF\ \&\ Reranker} \rightarrow \mathbf{Pydantic\ Tool\ Registry}$$

1. **Bảo tồn Tuyệt đối Schema Chuẩn SFIA & O\*NET**:
   * Giữ nguyên 100% các bảng quan hệ hiện có trong schema `sfia.*` (`skills`, `skill_levels`, `levels`) và `onet.*` (`occupation_data`, `task_statements`, `software_skills`).
   * Xây dựng 3 bảng vector vệ tinh gắn khóa ngoại (`FOREIGN KEY`): `sfia_vectors`, `onet_vectors`, và `tech_docs_vectors` cùng với việc mở rộng `public.question_bank`.
2. **Domain-Aware Hybrid RAG 3 Lớp**:
   * **Dense Semantic (BGE-M3 1024D)**: Tương đồng Cosine trên PostgreSQL pgvector với chỉ mục HNSW (`m=16, ef_construction=64`).
   * **Sparse Keyword (PostgreSQL tsvector)**: Khớp thuật ngữ kỹ thuật chuyên sâu bằng chỉ mục GIN, triệt tiêu hoàn toàn bẫy zero-match.
   * **Hợp nhất & Tinh chọn Thứ hạng**: Reciprocal Rank Fusion ($k=60$) kết hợp Cross-Encoder `BAAI/bge-reranker-base` và Redis L2 Query Cache ($< 10\text{ms}$).
3. **Đóng gói AI Tool Registry Chuẩn Công nghiệp**:
   * Đóng gói toàn bộ pipeline truy vấn thành 3 tools AI độc lập tuân thủ Pydantic v2 schemas: `QuestionBankRetrieverTool`, `CompetencyTaxonomyTool`, và `TechnicalGroundTruthTool`.
4. **Lập Kịch Bản Phỏng Vấn Tự Trị (Curriculum Planning StateGraph)**:
   * Triển khai LangGraph `CurriculumPlannerAgent` trong `ai-service/` tự động phân tích JD/CV, tìm kiếm câu hỏi, tự sinh câu hỏi chuẩn mực cho kỹ năng thiếu hụt, và tự thẩm định qua `RubricAuditorAgent`.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn tuần tự, AI Agent bắt buộc thực thi lần lượt các tài liệu đặc tả độc lập theo từng task trong thư mục [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/02_PHASE_2_PGVECTOR_HYBRID_RAG/
├── 00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md                  # Kiến trúc tổng thể, Multi-Corpus Topology & Roadmap Master
├── 01_PGVECTOR_SCHEMA_AND_MIGRATION.md                      # Task 2.1: pgvector Extension, question_bank & HNSW Index
├── 01B_MULTI_CORPUS_VECTOR_SCHEMAS_AND_INDEXES.md           # Sub-Task 2.1B: Schemas sfia_vectors, onet_vectors, tech_docs_vectors
├── 02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md               # Task 2.2: BGE-M3 Model & Batch Ingestion Pipeline (4 Corpora)
├── 03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md                   # Task 2.3: Hybrid CTE Query & RRF Fusion (k=60)
├── 04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md         # Task 2.4: bge-reranker-base & Redis L2 Cache (<10ms)
├── 05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md         # Task 2.5: Nâng cấp QuestionBankService & Fallback an toàn
├── 06_STANDARDIZED_AGENTIC_TOOLS_AND_PYDANTIC_CONTRACTS.md  # Task 2.6: Bộ 3 AI Tools chuẩn hóa (Pydantic v2 / BaseTool)
└── 07_CURRICULUM_PLANNER_AGENTIC_GRAPH.md                   # Task 2.7: LangGraph StateGraph CurriculumPlannerAgent
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **2.1** | [01_PGVECTOR_SCHEMA_AND_MIGRATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/01_PGVECTOR_SCHEMA_AND_MIGRATION.md) | `server/prisma/`, PostgreSQL | `pgvector`, `question_bank` vector column, HNSW index CONCURRENTLY, GIN index |
| **2.1B**| [01B_MULTI_CORPUS_VECTOR_SCHEMAS_AND_INDEXES.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/01B_MULTI_CORPUS_VECTOR_SCHEMAS_AND_INDEXES.md) | PostgreSQL 16 DDL | `sfia_vectors`, `onet_vectors`, `tech_docs_vectors`, Foreign Keys, HNSW & GIN |
| **2.2** | [02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md) | `ai-service/app/services/rag/` | `BAAI/bge-m3`, SentenceTransformers, Ingestion Pipeline 4 Corpora |
| **2.3** | [03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md) | PostgreSQL, SQL CTEs | Parallel Dense/Sparse CTEs, `websearch_to_tsquery`, Reciprocal Rank Fusion ($k=60$) |
| **2.4** | [04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/04_CROSS_ENCODER_RERANKER_AND_LATENCY_CACHING.md) | `ai-service/app/services/rag/` | `bge-reranker-base`, Cross-Encoder Re-ranking, Redis L2 Query Cache |
| **2.5** | [05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md) | `server/src/modules/interview-prep/` | `QuestionBankService`, Semantic Allocation, Strict Provider Toggle, SQL Fallback |
| **2.6** | [06_STANDARDIZED_AGENTIC_TOOLS_AND_PYDANTIC_CONTRACTS.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/06_STANDARDIZED_AGENTIC_TOOLS_AND_PYDANTIC_CONTRACTS.md) | `ai-service/app/services/tools/` | Pydantic v2 `BaseModel`, `langchain_core.tools.BaseTool`, Tool Registry |
| **2.7** | [07_CURRICULUM_PLANNER_AGENTIC_GRAPH.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/07_CURRICULUM_PLANNER_AGENTIC_GRAPH.md) | `ai-service/app/services/prep/` | LangGraph StateGraph, `CurriculumPlannerAgent`, `RubricAuditorAgent`, Reflection |

---

## 3. KHUNG BÀN GIAO & LIÊN KẾT TUẦN TỰ (PHASE 2 EXECUTION & HANDOVER PROTOCOL)

### 3.1 Tiền đề Bàn giao Nhận từ Phase 1 (Incoming Handover)
* Microservice `ai-service` đã vận hành ổn định trên port 8000 (FastAPI + `uv`).
* `AIGatewayDispatcher` phía NestJS đã thiết lập cơ chế Strict Toggle.
* Đã vượt qua toàn bộ tiêu chí của **Quality Gate 1**.

### 3.2 Chuỗi Thực thi Tuần tự (Task Sequential Flow)
```
Task 2.1 (pgvector Core) ──> Sub-Task 2.1B (Multi-Corpus Schemas) ──> Task 2.2 (BGE-M3 Embedder)
                                                                                  │
Task 2.5 (NestJS Allocator) <── Task 2.4 (Reranker & Cache) <── Task 2.3 (Hybrid CTE & RRF)
         │
         ▼
Task 2.6 (Pydantic Tool Registry) ──> Task 2.7 (LangGraph Curriculum Planner)
```

### 3.3 Handover Sang Phase 3 (Phase 2 -> Phase 3 Transition)
* **Điều kiện hoàn thành Phase 2**: Vượt qua toàn bộ tiêu chí của **Quality Gate 2**.
* **Đầu ra bàn giao**:
  1. Toàn bộ 4 kho tri thức (`question_bank`, `sfia_vectors`, `onet_vectors`, `tech_docs_vectors`) có chỉ mục vector 1024D và GIN hoạt động ổn định.
  2. Bộ 3 AI Tools (`QuestionBankRetrieverTool`, `CompetencyTaxonomyTool`, `TechnicalGroundTruthTool`) sẵn sàng cho các tác tử ở Phase 3 và Phase 4 tiêu thụ.
  3. Pipeline Lập kịch bản câu hỏi qua `CurriculumPlannerAgent` vận hành mượt mà với NestJS BullMQ.
* **Tài liệu chuyển tiếp**: Bắt đầu Phase 3 tại [03_PHASE_3_DEEP_ASSESSMENT_AND_SEMANTIC_SCORING.md](03_PHASE_3_DEEP_ASSESSMENT_AND_SEMANTIC_SCORING.md) (Task 3.1 & Sub-Task 3.2B: Fact-Checking Graph).

---

## 4. CHỈ TIÊU NGHIỆM THU PHASE 2 (QUALITY GATE 2)

1. **Hiệu năng Truy vấn & Latency**: Đo đạc 100 lượt truy vấn Hybrid RAG với cơ sở dữ liệu $10.000+$ câu hỏi:
   * Average Latency $< 180\text{ ms}$.
   * P99 Latency $< 350\text{ ms}$.
   * Latency khi Cache Hit trên Redis L2 Cache $< 10\text{ ms}$.
2. **Chuẩn Hóa AI Tools & Contract Tests**:
   * $100\%$ các lệnh gọi qua bộ 3 AI Tools serialize đúng chuẩn Pydantic v2 schemas.
   * $100\%$ test suite Pytest cho Tool Registry vượt qua mà không phát sinh lỗi validation.
3. **Độ chính xác Domain**: $100\%$ câu hỏi được gợi ý bám sát mã ngành O\*NET, `session_type`, và cấp độ SFIA được yêu cầu.
4. **Tính Toàn vẹn Dữ liệu & Non-blocking Migration**:
   * Quá trình tạo index HNSW trên cả 4 bảng không gây Table Lock trên production database (`CREATE INDEX CONCURRENTLY`).
   * Giữ nguyên vẹn 100% dữ liệu gốc trong schema `sfia.*` và `onet.*`.
   * Hệ thống tự động Fallback về câu truy vấn Prisma SQL truyền thống nếu Python service gặp sự cố hoặc cờ `AI_RAG_PROVIDER=prisma` được kích hoạt.
