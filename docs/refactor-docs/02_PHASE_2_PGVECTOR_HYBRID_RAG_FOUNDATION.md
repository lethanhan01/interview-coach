# TÀI LIỆU 02: PHASE 2 — NỀN TẢNG POSTGRESQL PGVECTOR & NGÂN HÀNG CÂU HỎI
# (PRAGMATIC PGVECTOR & SEMANTIC QUESTION ALLOCATION SPECIFICATION)

> **Trạng thái**: Approved / Pragmatic Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead Engineer)  
> **Áp dụng cho**: `server/prisma/`, PostgreSQL 16 `pgvector`, `server/src/modules/interview-prep/`, Python `ai-service/app/services/rag/`  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Tinh giản thực dụng: pgvector trên `question_bank`, cờ `AI_EMBEDDING_PROVIDER`, loại bỏ multi-corpus và LangGraph)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 2 nâng cấp năng lực tìm kiếm và phân bổ câu hỏi của hệ thống InterviewCoach: Chuyển dịch từ việc chỉ lọc cứng theo taxonomy sang **Kết hợp Tìm kiếm Ngữ nghĩa (`pgvector`) và Phân loại Kỹ năng (O\*NET & SFIA 9)**:

$$\mathbf{Pragmatic\ Semantic\ Allocation} = \mathbf{pgvector\ Cosine\ Similarity} + \mathbf{O*NET\ \&\ SFIA\ Hard\ Filters}$$

1. **Bảo tồn Tuyệt đối Cơ sở Dữ liệu**:
   * Giữ nguyên 100% các bảng quan hệ trong schema `sfia.*` và `onet.*`.
   * Bổ sung cột `embedding vector(1536)` trực tiếp vào bảng [`public.question_bank`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/prisma/schema.prisma) cùng chỉ mục HNSW không khóa bảng (`CONCURRENTLY`).
2. **Cơ chế Embedding Linh hoạt qua Feature Flag**:
   * Mặc định sử dụng OpenAI `text-embedding-3-small` (1536 chiều, tốc độ $< 200\text{ms}$, chi phí gần như bằng 0, không ngốn RAM máy chủ).
   * Hỗ trợ cờ `AI_EMBEDDING_PROVIDER=local` khi cần chạy hoàn toàn offline bằng model HuggingFace trong Python `ai-service`.
3. **Tích hợp Liền mạch với Mã nguồn Hiện có**:
   * Tích hợp trực tiếp vào hàm [`QuestionBankService.allocateQuestionsForSessionSkills`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-prep/question-bank/question-bank.service.ts) và quy trình [`GenerateSessionQuestions`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-prep/question-generation/generate-session-questions.service.ts).
   * Tự động fallback sang SQL shuffle thuần nếu chưa có vector hoặc Python service tắt.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK

Các tài liệu kỹ thuật trong thư mục [02_PHASE_2_PGVECTOR_HYBRID_RAG/](02_PHASE_2_PGVECTOR_HYBRID_RAG/00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md) được tinh giản thành 4 tasks cốt lõi:

```
docs/refactor-docs/02_PHASE_2_PGVECTOR_HYBRID_RAG/
├── 00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md         # Kiến trúc tổng thể & Chỉ tiêu nghiệm thu Quality Gate 2
├── 01_PGVECTOR_SCHEMA_AND_MIGRATION.md             # Task 2.1: Kích hoạt pgvector, migration question_bank & HNSW index
├── 02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md      # Task 2.2: Dịch vụ Embedding & Batch Ingestion Script
├── 03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md          # Task 2.3: Truy vấn Cosine Similarity kết hợp Metadata Filter
└── 05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md# Task 2.4: Tích hợp NestJS QuestionBankService & Fallback
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **2.1** | [01_PGVECTOR_SCHEMA_AND_MIGRATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/01_PGVECTOR_SCHEMA_AND_MIGRATION.md) | `server/prisma/`, PostgreSQL | `pgvector`, `question_bank.embedding`, HNSW index CONCURRENTLY |
| **2.2** | [02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md) | `ai-service/app/services/rag/` | OpenAI `text-embedding-3-small` / local fallback, Batch Ingestion |
| **2.3** | [03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/03_HYBRID_RETRIEVAL_AND_RRF_RANKING.md) | PostgreSQL, SQL Query | SQL Cosine distance (`<=>`) kết hợp bộ lọc O\*NET & SFIA |
| **2.4** | [05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md](02_PHASE_2_PGVECTOR_HYBRID_RAG/05_NESTJS_INTEGRATION_AND_QUESTION_ALLOCATION.md) | `server/src/modules/interview-prep/` | `QuestionBankService`, Semantic Allocation, Strict Toggle, SQL Fallback |

---

## 3. TIÊU CHÍ NGHIỆM THU (QUALITY GATE 2)

1. **Hiệu năng Truy vấn**: Latency tìm kiếm câu hỏi theo vector kết hợp filter $< 80\text{ms}$ trên PostgreSQL.
2. **Độ chính xác Nghiệp vụ**: 100% câu hỏi được chọn khớp chính xác `sfiaSkillCode` và `targetSfiaLevel` được yêu cầu bởi phiên phỏng vấn.
3. **Khả năng Chịu lỗi**: Khi tắt cờ `AI_RAG_PROVIDER` hoặc Python AI Service ngắt kết nối, NestJS tự động fallback sang truy vấn SQL thông thường mà không làm đứt quãng tiến trình tạo phiên.
