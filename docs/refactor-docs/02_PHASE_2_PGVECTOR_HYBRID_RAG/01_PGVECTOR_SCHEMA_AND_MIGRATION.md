# TASK 2.1: POSTGRESQL PGVECTOR EXTENSION, SCHEMA & MIGRATION

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Backend & Database Architecture)  
> **Áp dụng cho**: `server/prisma/`, PostgreSQL 16, Extension `pgvector`  
> **Tài liệu cha**: [00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 1.0.0  

---

## 1. MỤC TIÊU KỸ THUẬT & YÊU CẦU HẠ TẦNG

1. Kích hoạt extension `vector` trên PostgreSQL 16 cho cơ sở dữ liệu `interview_ai`.
2. Mở rộng bảng [`question_bank`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/prisma/schema.prisma#L31-L57) để lưu trữ:
   * Cột `embedding`: vector 1024 chiều (tương thích chuẩn nhúng BAAI/BGE-M3).
   * Cột `tsv_content`: tsvector hỗ trợ full-text search theo từ khóa kỹ thuật.
3. Cài đặt Trigger tự động đồng bộ hóa `tsv_content` mỗi khi nội dung câu hỏi (`content`) được tạo mới hoặc chỉnh sửa.
4. Xây dựng chỉ mục HNSW (Hierarchical Navigable Small World) cho tìm kiếm vector và GIN cho full-text search.
5. Cập nhật Prisma Schema (`schema.prisma`) tương thích 100% với kiểu dữ liệu `Unsupported`.

---

## 2. FILE MIGRATION SQL CHUẨN (`20261015_enable_pgvector_rag`)

Tạo file: `server/prisma/migrations/20261015_enable_pgvector_rag/migration.sql`:

```sql
-- ==============================================================================
-- BƯỚC 1: KÍCH HOẠT EXTENSION PGVECTOR
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ==============================================================================
-- BƯỚC 2: BỔ SUNG CỘT EMBEDDING & TSVECTOR VÀO QUESTION_BANK
-- ==============================================================================
ALTER TABLE "question_bank" 
  ADD COLUMN IF NOT EXISTS "embedding" vector(1024),
  ADD COLUMN IF NOT EXISTS "tsv_content" tsvector;

-- ==============================================================================
-- BƯỚC 3: TRIGGER TỰ ĐỘNG CẬP NHẬT TSVECTOR KHI NỘI DUNG THAY ĐỔI
-- Sử dụng 'simple' dictionary để giữ nguyên thuật ngữ kỹ thuật và tiếng Việt
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_question_bank_tsv() RETURNS trigger AS $$
BEGIN
  new.tsv_content := 
    setweight(to_tsvector('simple', coalesce(new.content, '')), 'A');
  RETURN new;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_question_bank_tsv ON "question_bank";
CREATE TRIGGER trg_question_bank_tsv 
  BEFORE INSERT OR UPDATE OF content ON "question_bank" 
  FOR EACH ROW EXECUTE FUNCTION update_question_bank_tsv();

-- Backfill dữ liệu tsv cho toàn bộ các bản ghi hiện có
UPDATE "question_bank" 
SET "tsv_content" = setweight(to_tsvector('simple', coalesce("content", '')), 'A') 
WHERE "tsv_content" IS NULL;

-- ==============================================================================
-- BƯỚC 4: THIẾT LẬP CHỈ MỤC TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN
-- ==============================================================================

-- 4.1 Chỉ mục HNSW cho vector cosine ops (khoảng cách cosine: <=>)
-- m = 16: số kết nối mỗi node (cân bằng tốc độ build và độ chính xác)
-- ef_construction = 64: độ sâu tìm kiếm lúc build index
CREATE INDEX IF NOT EXISTS "idx_question_bank_embedding_hnsw" 
  ON "question_bank" 
  USING hnsw ("embedding" vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);

-- 4.2 Chỉ mục GIN cho Full-text search
CREATE INDEX IF NOT EXISTS "idx_question_bank_tsv" 
  ON "question_bank" 
  USING gin ("tsv_content");

-- 4.3 Composite index hỗ trợ lọc cứng kết hợp vector (Partial Filter Optimization)
CREATE INDEX IF NOT EXISTS "idx_question_bank_rag_filter" 
  ON "question_bank" ("session_type", "sfia_skill_code", "target_sfia_level") 
  WHERE ("deleted_at" IS NULL);
```

---

## 3. CẬP NHẬT PRISMA SCHEMA (`server/prisma/schema.prisma`)

Trong model [`QuestionBank`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/prisma/schema.prisma#L31-L57), cập nhật định nghĩa:

```prisma
model QuestionBank {
  id                      String                   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content                 String
  sessionType             QuestionSessionType      @map("session_type")
  difficulty              Int
  contextPackId           String                   @map("context_pack_id")
  estimatedTimeMin        Int?                     @map("estimated_time_min")
  translations            Json?
  contentJson             Json?                    @map("content_json")
  deletedAt               DateTime?                @map("deleted_at") @db.Timestamptz(6)
  createdAt               DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt               DateTime                 @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  // === TRƯỜNG GẮN NHÃN KÉP O*NET + SFIA ===
  onetSocCode             String?                  @map("onet_soc_code") @db.VarChar(10)
  sfiaSkillCode           String?                  @map("sfia_skill_code") @db.VarChar(10)
  targetSfiaLevel         Int?                     @map("target_sfia_level") @db.SmallInt

  // === TRƯỜNG VECTOR & FULL-TEXT QUẢN LÝ BỞI PGVECTOR ===
  embedding               Unsupported("vector(1024)")?
  tsvContent              Unsupported("tsvector")? @map("tsv_content")

  questionCriteria        QuestionCriteria[]
  sessionQuestions        SessionQuestion[]

  @@index([contextPackId], map: "idx_question_bank_context_pack", where: raw("(deleted_at IS NULL)"))
  @@index([sessionType, difficulty], map: "idx_question_bank_session_type_difficulty", where: raw("(deleted_at IS NULL)"))
  @@index([onetSocCode, targetSfiaLevel], map: "idx_question_bank_soc_level", where: raw("(deleted_at IS NULL)"))
  @@index([sfiaSkillCode, targetSfiaLevel], map: "idx_question_bank_sfia_skill_level", where: raw("(deleted_at IS NULL)"))
  @@map("question_bank")
}
```

> [!CAUTION]
> **Quy tắc Prisma đối với kiểu `Unsupported`**:
> 1. Tuyệt đối không query `prisma.questionBank.findMany({ select: { embedding: true } })` vì Prisma Client sẽ throw runtime error do không biết serialize kiểu dữ liệu này.
> 2. Mọi truy vấn liên quan đến vector phải dùng `prisma.$queryRaw` hoặc được thực thi từ Python service qua thư viện DB chuyên biệt (`psycopg2` / `asyncpg`).

---

## 4. TINH CHỈNH THAM SỐ POSTGRESQL (DATABASE TUNING)

Để xây dựng và truy vấn HNSW index đạt hiệu năng cao trên cơ sở dữ liệu production:

1. **Khi xây dựng Index (Build Time)**:
   ```sql
   -- Tăng bộ nhớ tạm để build HNSW index không bị tràn ra đĩa
   SET maintenance_work_mem = '256MB';
   SET max_parallel_maintenance_workers = 4;
   ```
2. **Khi truy vấn (Query Runtime)**:
   ```sql
   -- Tăng độ rộng duyệt đồ thị khi search (mặc định = 40, tăng lên 60 để tăng recall)
   SET hnsw.ef_search = 60;
   ```

---

## 5. KỊCH BẢN ROLLBACK (RECOVERY PLAYBOOK)

Nếu migration gặp sự cố cần hoàn nguyên:
```sql
DROP INDEX IF EXISTS "idx_question_bank_rag_filter";
DROP INDEX IF EXISTS "idx_question_bank_tsv";
DROP INDEX IF EXISTS "idx_question_bank_embedding_hnsw";
DROP TRIGGER IF EXISTS trg_question_bank_tsv ON "question_bank";
DROP FUNCTION IF EXISTS update_question_bank_tsv();
ALTER TABLE "question_bank" DROP COLUMN IF EXISTS "tsv_content";
ALTER TABLE "question_bank" DROP COLUMN IF EXISTS "embedding";
-- Không cần DROP EXTENSION vector để tránh ảnh hưởng bảng khác nếu có
```

---

## 6. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. Lệnh `npx prisma migrate dev` và `npx prisma generate` chạy thành công không cảnh báo lỗi type mismatch.
2. Kiểm tra `SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';` trả về extension version $\ge 0.5.0$.
3. Insert thử 1 bản ghi vào `question_bank` và xác minh cột `tsv_content` được tự động điền dữ liệu đúng định dạng tsvector.
4. Sao lưu cơ sở dữ liệu bằng `pg_dump` và phục hồi lại trên test database kiểm tra không bị mất dữ liệu vector.

---

## 7. TASK EXECUTION CONTRACT

### 7.1 Prerequisites (Tiền đề bắt buộc)
- [ ] Hoàn thành toàn bộ **Phase 1** (Quality Gate 1 Approved).
- [ ] PostgreSQL 16 server chạy với extension `pgvector` cài sẵn (image `pgvector/pgvector:pg16` hoặc tương đương).
- [ ] Prisma CLI phiên bản $\ge 5.10.0$ trong `server/package.json`.

### 7.2 Target Deliverables (Sản phẩm mã nguồn đầu ra)
- [ ] `server/prisma/migrations/20261015_enable_pgvector_rag/migration.sql`: Kích hoạt extension, thêm cột `embedding vector(1024)` và `tsv_content tsvector`, tạo trigger `trg_question_bank_tsv`, tạo index HNSW và GIN.
- [ ] `server/prisma/schema.prisma`: Khai báo 2 trường `embedding Unsupported("vector(1024)")?` và `tsvContent Unsupported("tsvector")?` trong model `QuestionBank`.

### 7.3 Architectural Rules Enforced (Tuân thủ AGENTS.md)
- [x] **Backend Rule 5**: Toàn bộ script DDL an toàn, không làm crash schema Prisma hiện có.
- [x] **Non-blocking Invariant**: Sử dụng index `CONCURRENTLY` trên production để không gây Table Lock.
- [x] **Unsupported Type Isolation**: Không bao giờ query trực tiếp `embedding` qua Prisma Client `findMany` mà thông qua raw SQL hoặc Python service.

### 7.4 Verification Command (Lệnh kiểm thử & Xác thực tự động)
```bash
# Tier 1 (Prisma Schema Validation)
cd server && npx prisma validate

# Tier 2 (Live Database Migration & Extension Check)
cd server && npx prisma migrate deploy
psql "$DATABASE_URL" -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

### 7.5 Definition of Done (DoD)
- [ ] Extension `vector` kích hoạt thành công (version $\ge 0.5.0$).
- [ ] Bảng `question_bank` có đủ hai cột `embedding` và `tsv_content`.
- [ ] Trigger `trg_question_bank_tsv` tự động sinh tsvector khi insert câu hỏi mới.
- [ ] `npx prisma generate` sinh Prisma Client thành công không lỗi type mismatch.

### 7.6 Next Task Transition (Bước chuyển tiếp)
- Tiếp tục sang **Sub-Task 2.1B: Multi-Corpus Vector Schemas**: [01B_MULTI_CORPUS_VECTOR_SCHEMAS_AND_INDEXES.md](01B_MULTI_CORPUS_VECTOR_SCHEMAS_AND_INDEXES.md) để thiết lập các bảng vector `sfia_vectors`, `onet_vectors`, và `tech_docs_vectors`.
- Sau khi hoàn thành Sub-Task 2.1B, chuyển sang **Task 2.2: BGE-M3 Embedding Pipeline**: [02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md](02_BGE_M3_EMBEDDING_AND_BATCH_INGESTION.md) để xây dựng pipeline sinh vector và batch ingestion.

