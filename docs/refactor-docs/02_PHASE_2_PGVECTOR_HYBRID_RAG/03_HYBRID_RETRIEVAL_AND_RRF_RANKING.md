# TASK 2.3: THIẾT KẾ TRUY VẤN NGỮ NGHĨA KẾT HỢP BỘ LỌC CHUẨN HÓA (SEMANTIC + TAXONOMY FILTER)
# (PRAGMATIC VECTOR RETRIEVAL: COSINE DISTANCE, DOMAIN HARD FILTERS & FALLBACK STRATEGY)

> **Trạng thái**: Approved / Pragmatic Production Specification  
> **Cấp độ**: Deep Technical Specification (Database Query Engineering & Information Retrieval)  
> **Áp dụng cho**: PostgreSQL 16 pgvector, `server/src/modules/interview-prep/question-bank/`  
> **Tài liệu cha**: [00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_2_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Thay thế RRF k=60 và Reranker phức tạp bằng truy vấn Cosine Similarity kết hợp Metadata Filter tối ưu)  

---

## 1. NGUYÊN LÝ THIẾT KẾ: TẠI SAO ĐƠN GIẢN HÓA LẠI TỐT HƠN?

Trong bản thảo ban đầu, việc kết hợp Dense Search + Sparse Search + RRF ($k=60$) + Cross-Encoder Reranker gây ra các vấn đề nghiêm trọng:
1. **Quá tải tài nguyên**: Ngân hàng câu hỏi của dự án hiện tại có quy mô vài trăm đến vài nghìn câu hỏi. Việc chạy 2 truy vấn CTE song song rồi hợp nhất bằng RRF và nạp tiếp model Cross-Encoder nặng hàng trăm MB vào RAM là hoàn toàn lãng phí (Over-Engineering).
2. **Nguy cơ Zero-Match**: Bản JD dài khi đưa vào Sparse Search `tsquery` rất dễ bị 0 kết quả nếu từ khóa quá dài hoặc ghép toán tử `AND`.

**Giải pháp Thực dụng**:
* Tận dụng tối đa sức mạnh của **PostgreSQL `pgvector`**:
  - Dùng toán tử khoảng cách Cosine (`<=>`) trên cột `embedding vector(1536)` để đo lường độ tương đồng ngữ nghĩa giữa Job Description và nội dung câu hỏi.
  - Kết hợp trực tiếp trong mệnh đề `WHERE` với các bộ lọc chuẩn hóa nghiệp vụ: `session_type`, `sfia_skill_code`, và `target_sfia_level`.
* Truy vấn duy nhất, chạy thẳng trên chỉ mục HNSW, trả về kết quả trong $< 20\text{ms}$.

---

## 2. CÂU LỆNH SQL CHUẨN HÓA (CANONICAL RETRIEVAL QUERY)

```sql
-- Truy vấn cấp phát câu hỏi theo ngữ nghĩa kết hợp bộ lọc phân loại SFIA & O*NET
SELECT 
    qb.id,
    qb.content,
    qb.difficulty,
    qb.sfia_skill_code AS "sfiaSkillCode",
    qb.target_sfia_level AS "targetSfiaLevel",
    qb.onet_soc_code AS "onetSocCode",
    1 - (qb.embedding <=> $1::vector) AS similarity_score
FROM public.question_bank qb
WHERE qb.deleted_at IS NULL
  AND qb.session_type = $2::"QuestionSessionType"
  AND qb.sfia_skill_code = $3
  AND qb.target_sfia_level = $4
ORDER BY qb.embedding <=> $1::vector ASC
LIMIT $5;
```

### Giải thích Tham số:
* `$1`: Vector embedding của bản tóm tắt Job Description (1536 chiều sinh từ OpenAI `text-embedding-3-small` hoặc local model).
* `$2`: Loại phiên phỏng vấn (`technical` hoặc `hr`).
* `$3`: Mã kỹ năng SFIA mục tiêu (ví dụ: `'PROG'`, `'DBDS'`).
* `$4`: Cấp độ SFIA mục tiêu (ví dụ: `3`, `4`).
* `$5`: Số lượng câu hỏi cần lấy cho kỹ năng đó.

---

## 3. CƠ CHẾ DỰ PHÒNG AN TOÀN (GRACEFUL FALLBACK)

Nếu câu hỏi trong ngân hàng chưa được đánh vector embedding (giá trị `embedding IS NULL`), hoặc khi Python Embedding Service tạm thời mất kết nối:

```typescript
// Fallback sang truy vấn lọc thông thường có sẵn trong QuestionBankService
return await this.prisma.questionBank.findMany({
  where: {
    deletedAt: null,
    sessionType,
    sfiaSkillCode,
    targetSfiaLevel,
  },
  take: count,
  orderBy: { createdAt: 'desc' },
});
```

Điều này đảm bảo quy trình tạo phiên phỏng vấn của người dùng **hoàn toàn không bao giờ bị nghẽn hay đứt quãng**.
