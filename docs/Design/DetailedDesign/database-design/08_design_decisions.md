# DB Design — Design Decisions & Seed Data Notes

## 1. Design Decisions

Các quyết định thiết kế phi hiển nhiên. LLD và implementation không được thay đổi những điểm
này mà không cập nhật file này và tạo ADR nếu cần.

---

### DD-01: ai_feedbacks dùng 2 nullable FKs thay vì polymorphic association

**Quyết định**: `ai_feedbacks` có hai FK nullable — `user_answer_id` và `rewrite_answer_id`.
CHECK constraint đảm bảo đúng một cái non-null.

**Thay vì**: polymorphic `source_type TEXT + source_id UUID` (không có FK constraint).

**Lý do**: Polymorphic association không enforce FK integrity — `source_id` có thể trỏ vào
row không tồn tại mà DB không phát hiện. Với 2 nullable FKs, ON DELETE CASCADE hoạt động
đúng cho cả hai cases. Query cũng đơn giản hơn:

```sql
-- Lấy feedback cho original answer: WHERE user_answer_id = $1
-- Lấy feedback cho rewrite: WHERE rewrite_answer_id = $1
-- Không cần WHERE source_type = 'user_answer' AND source_id = $1
```

**Trade-off**: Thêm một column nullable vào table. Khi thêm loại source thứ 3 trong tương lai
phải ALTER TABLE thêm FK column mới — nhưng đây là trường hợp rất hiếm.

---

### DD-02: ai_quality_log không có FK tới bất kỳ table nào

**Quyết định**: `ai_quality_log.session_id` là `UUID NULL` thuần túy — không có `REFERENCES`.

**Lý do**: Audit log phải tồn tại độc lập với business data. Nếu có FK + CASCADE, việc xóa
một session (admin action trong UC-09) sẽ xóa luôn audit trail — mất khả năng điều tra
retrospective khi cần debug AI pipeline hoặc tính cost.

**Trade-off**: Không có referential integrity cho `session_id`. Application phải tự đảm bảo
giá trị này là valid UUID khi INSERT.

---

### DD-03: context_packs là table, không phải PostgreSQL enum type

**Quyết định**: `context_packs` là table với `id TEXT PRIMARY KEY CHECK (id IN ('vn', 'western'))`.

**Thay vì**: `CREATE TYPE context_pack AS ENUM ('vn', 'western')` và dùng type này trong FK columns.

**Lý do**: PostgreSQL ENUM không thể ADD VALUE trong transaction (`ALTER TYPE ... ADD VALUE` không
transactional). Khi cần thêm context pack mới (`global`, `jp`, v.v.) sẽ phải dùng migration
phức tạp. TEXT + CHECK constraint thêm value = sửa CHECK + INSERT seed row, đơn giản hơn nhiều.

**Trade-off**: CHECK constraint trên TEXT ít type-safe hơn ENUM ở application layer. Giải quyết
bằng TypeScript enum ở NestJS service layer.

---

### DD-04: session_questions.question_bank_id là nullable FK

**Quyết định**: FK `question_bank_id` nullable, `ON DELETE SET NULL`.

**Lý do**: LLM-generated questions không có row trong `question_bank`. Nếu FK NOT NULL, mọi
câu hỏi LLM-generated phải INSERT vào `question_bank` trước — thêm complexity và làm ô nhiễm
seed data với AI-generated content.

`ON DELETE SET NULL` cho phép admin soft-delete câu seed mà không ảnh hưởng session history
(session vẫn hiển thị đúng `question_text` vì đó là column riêng, không lấy từ FK join).

---

### DD-05: CV binary không lưu trong DB

**Quyết định**: `user_profiles.cv_file_url` lưu Supabase Storage path, không lưu binary.
`cv_parsed_text` lưu extracted text. `cv_structured_json` lưu structured data.

**Lý do**: PostgreSQL không phù hợp lưu blob lớn (PDF max 5MB per P-19). Lưu binary trong DB
tăng backup size và slow down pg_dump. Supabase Storage có CDN và signed URLs phù hợp hơn.

**Cache**: `cv_parsed_text` cũng được cache trong Redis key `cv_text:{user_id}` TTL 24h bởi
BullMQ processors để tránh đọc DB nhiều lần trong một session.

---

### DD-06: Soft delete chỉ cho 3 tables, không áp dụng toàn bộ

**Quyết định**: Soft delete (`deleted_at`) chỉ trên `users`, `user_profiles`, `question_bank`.
Các transactional tables (`user_answers`, `ai_feedbacks`, v.v.) dùng hard delete qua CASCADE.

**Lý do**: Transactional tables không cần soft delete — khi user yêu cầu xóa account (GDPR),
toàn bộ session data phải xóa thật. Giữ soft delete chỉ cho:
- `users`: admin cần xem "deleted" accounts trong audit
- `user_profiles`: cùng lifecycle với users
- `question_bank`: admin deactivate câu hỏi mà không phá FK integrity từ `session_questions`

---

### DD-07: pgvector không có trong v1

**Quyết định**: Không có column `VECTOR` hay extension `pgvector` trong schema v1.

**Lý do**: Không có UC nào trong SRS yêu cầu semantic search. `AntiRepeatService` dùng SQL JOIN
đơn giản (30 ngày gần nhất). Chi phí maintain embedding pipeline không justify ở prototype scope.

**Revise khi**: cần semantic search trong Question Bank (tìm câu tương tự), hoặc similar-session
detection. Khi đó thêm column `embedding VECTOR(1536)` vào `question_bank` và `session_questions`,
dùng `text-embedding-3-small` từ OpenAI. Xem OQ-4 trong HLD §10.3.

---

### DD-08: rewrite_answers phải CREATE trước ai_feedbacks trong migration

**Quyết định**: Migration order bắt buộc: `rewrite_answers` → `ai_feedbacks`.

**Lý do**: `ai_feedbacks` có FK `rewrite_answer_id REFERENCES rewrite_answers(id)`. Nếu
`ai_feedbacks` được CREATE trước, PostgreSQL sẽ báo lỗi `relation "rewrite_answers" does not exist`.

**Ghi chú**: File [05_tables_answer.md](05_tables_answer.md) đã document migration order đúng.
Khi viết migration script, tuân thủ thứ tự: `user_answers` → `follow_up_questions` →
`rewrite_answers` → `ai_feedbacks` → `annotated_segments`.

---

### DD-09: BullMQ job data không lưu trong DB

**Quyết định**: Job data (payload của BullMQ jobs) chỉ tồn tại trong Redis queue — không
lưu vào bất kỳ DB table nào.

**Lý do**: Job data là ephemeral — chỉ cần trong thời gian job chạy (max 30s). Lưu vào DB
tạo write amplification: mỗi AI call = 1 BullMQ enqueue + 1 DB write + 1 DB update khi done.
Redis đủ bền vững cho job queue (AOF enabled theo Railway default).

**Implication**: Nếu Redis mất, jobs trong queue cũng mất — sessions đang ở trạng thái
`generating` hoặc `generating_report` sẽ stuck. Recovery: cron job kiểm tra sessions stuck
quá 5 phút và mark `interrupted`. Đây là edge case chấp nhận được ở prototype scope.

---

## 2. Seed Data Notes

### 2.1 context_packs

2 rows cần INSERT trong migration đầu tiên (M001). Không có API để tạo/sửa context pack —
chỉ qua migration.

```sql
-- M001_seed_context_packs.sql
INSERT INTO context_packs (id, name, rubric_json, scoring_weights) VALUES
('vn', 'Vietnam Context Pack', '{
  "behavioral": {
    "D1": {"name": "Giao tiếp & Trình bày", "weight": 0.20},
    "D2": {"name": "Tư duy & Giải quyết vấn đề", "weight": 0.20},
    "D3": {"name": "Làm việc nhóm", "weight": 0.15},
    "D4": {"name": "Thái độ & Động lực", "weight": 0.20},
    "D5": {"name": "Phù hợp văn hóa", "weight": 0.15},
    "D6": {"name": "Tự nhận thức", "weight": 0.10}
  },
  "technical": {
    "TD1": {"name": "Kiến thức nền tảng", "weight": 0.25},
    "TD2": {"name": "Khả năng áp dụng thực tế", "weight": 0.25},
    "TD3": {"name": "Tư duy hệ thống", "weight": 0.20},
    "TD4": {"name": "Code quality & Best practices", "weight": 0.20},
    "TD5": {"name": "Debug & Problem-solving", "weight": 0.10}
  }
}', '{"question_gen_temp": 0.8, "feedback_temp": 0.3}'),

('western', 'Western Context Pack', '{
  "behavioral": {
    "D1": {"name": "Communication & Presentation", "weight": 0.20},
    "D2": {"name": "Critical Thinking", "weight": 0.25},
    "D3": {"name": "Collaboration", "weight": 0.15},
    "D4": {"name": "Drive & Initiative", "weight": 0.20},
    "D5": {"name": "Culture Fit", "weight": 0.10},
    "D6": {"name": "Self-awareness", "weight": 0.10}
  },
  "technical": {
    "TD1": {"name": "Core Knowledge", "weight": 0.25},
    "TD2": {"name": "Practical Application", "weight": 0.30},
    "TD3": {"name": "System Thinking", "weight": 0.20},
    "TD4": {"name": "Code Quality", "weight": 0.15},
    "TD5": {"name": "Debugging", "weight": 0.10}
  }
}', '{"question_gen_temp": 0.8, "feedback_temp": 0.3}');
```

### 2.2 question_bank

Seed script riêng (không inline trong migration) — `scripts/seed_questions.sql` hoặc
`scripts/seed_questions.ts`. Chạy sau migration M001 và M002.

**Yêu cầu tối thiểu cho fallback đủ dùng**:

| session_type | context_pack_id | Số câu tối thiểu |
| ------------ | --------------- | ---------------- |
| hr_behavioral | vn | 15 |
| hr_behavioral | western | 15 |
| technical | vn | 15 |
| technical | western | 15 |
| mixed | vn | 15 |
| mixed | western | 15 |

Tổng: 90 câu. Nên có 20–30 câu per combination để AntiRepeat filter (30 ngày) không cạn pool.

**Phân bố difficulty** trong mỗi combination: 30% easy (1–2), 50% medium (3), 20% hard (4–5).

Seed data không include trong git repository chính — file riêng hoặc Supabase Dashboard import.
Lý do: câu hỏi là IP của product, không public source.

### 2.3 Migration file naming

```
supabase/migrations/
├── 20260510000001_create_context_packs.sql
├── 20260510000002_create_question_bank.sql
├── 20260510000003_create_users.sql
├── 20260510000004_create_user_profiles.sql
├── 20260510000005_create_interview_sessions.sql
├── 20260510000006_create_session_questions.sql
├── 20260510000007_create_user_answers.sql
├── 20260510000008_create_follow_up_questions.sql
├── 20260510000009_create_rewrite_answers.sql
├── 20260510000010_create_ai_feedbacks.sql
├── 20260510000011_create_annotated_segments.sql
├── 20260510000012_create_reverse_questions.sql
├── 20260510000013_create_progress_snapshots.sql
├── 20260510000014_create_placement_test_answers.sql
├── 20260510000015_create_ai_quality_log.sql
├── 20260510000016_create_indexes.sql
├── 20260510000017_create_rls_policies.sql
├── 20260510000018_create_triggers.sql
└── 20260510000019_seed_context_packs.sql
```

Mỗi table một migration file riêng — dễ rollback từng table khi cần.
`create_triggers.sql` (M018) chứa trigger `on_auth_user_created` — phải sau `create_users.sql`.
`seed_context_packs.sql` (M019) INSERT 2 rows — phải sau `create_context_packs.sql`.
