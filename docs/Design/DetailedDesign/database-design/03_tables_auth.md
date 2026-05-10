# DB Design — Tables: Auth & Lookup

Nhóm này gồm 4 tables thuộc Layer 0 và Layer 1. Không có table nào phụ thuộc FK vào nhau ngoại
trừ `question_bank` → `context_packs` và `user_profiles` → `users`.

Migration order trong nhóm này: `context_packs` → `question_bank` → `users` → `user_profiles`.

---

## context_packs

Lookup table cho hai Context Pack (VN / Western). Mỗi pack chứa rubric JSON và scoring weights
dùng bởi AI pipeline khi generate câu hỏi và chấm điểm.

Không có RLS — public read-only. BullMQ processors read bảng này qua service role.

```sql
CREATE TABLE context_packs (
  id             TEXT        PRIMARY KEY CHECK (id IN ('vn', 'western')),
  name           TEXT        NOT NULL,
  rubric_json    JSONB       NOT NULL,
  scoring_weights JSONB      NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Cấu trúc rubric_json

```json
{
  "behavioral": {
    "D1": { "name": "Giao tiếp & Trình bày", "weight": 0.20 },
    "D2": { "name": "Tư duy & Giải quyết vấn đề", "weight": 0.20 },
    "D3": { "name": "Làm việc nhóm", "weight": 0.15 },
    "D4": { "name": "Thái độ & Động lực", "weight": 0.20 },
    "D5": { "name": "Phù hợp văn hóa", "weight": 0.15 },
    "D6": { "name": "Tự nhận thức", "weight": 0.10 }
  },
  "technical": {
    "TD1": { "name": "Kiến thức nền tảng", "weight": 0.25 },
    "TD2": { "name": "Khả năng áp dụng thực tế", "weight": 0.25 },
    "TD3": { "name": "Tư duy hệ thống", "weight": 0.20 },
    "TD4": { "name": "Code quality & Best practices", "weight": 0.20 },
    "TD5": { "name": "Debug & Problem-solving", "weight": 0.10 }
  }
}
```

Cấu trúc trên là mẫu cho pack `vn`. Pack `western` có cùng keys nhưng name và weight có thể khác.
Giá trị thực xác định khi viết seed migration.

### Seed data

2 rows cần INSERT ngay trong migration đầu tiên — các tables khác FK vào `context_packs.id`.

```sql
INSERT INTO context_packs (id, name, rubric_json, scoring_weights) VALUES
  ('vn',      'Vietnam Context Pack',  '{...}', '{...}'),
  ('western', 'Western Context Pack',  '{...}', '{...}');
```

---

## question_bank

Câu hỏi seed dùng làm fallback khi `QuestionGenerationProcessor` timeout (≥ 1 retry exhausted).
`AntiRepeatService` cũng JOIN bảng này để tránh hỏi lại câu đã gặp trong 30 ngày gần nhất.

```sql
CREATE TABLE question_bank (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content           TEXT        NOT NULL,
  session_type      TEXT        NOT NULL
    CHECK (session_type IN ('hr_behavioral', 'technical', 'mixed')),
  difficulty        INTEGER     NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  context_pack_id   TEXT        NOT NULL
    REFERENCES context_packs(id) ON DELETE RESTRICT,
  subcategory       TEXT        NOT NULL,
  competency_domain TEXT        NOT NULL,
  applicable_roles  TEXT[]      NOT NULL DEFAULT '{}',
  applicable_levels TEXT[]      NOT NULL DEFAULT '{}',
  deleted_at        TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `difficulty` | Scale 1–5: 1=rất dễ, 3=medium, 5=rất khó. Map sang user-facing `easy/medium/hard` tại application layer. |
| `subcategory` | Ví dụ: `teamwork`, `conflict`, `data_structures`, `system_design`. |
| `competency_domain` | `D1`–`D6` cho HR, `TD1`–`TD5` cho Technical. |
| `applicable_roles` | Array: `['backend', 'frontend']` — filter khi generate technical questions theo role. |
| `applicable_levels` | Array: `['intern', 'fresher', 'junior']` — filter theo level. |
| `deleted_at` | Soft delete — admin deactivate câu hỏi không xóa hard để giữ FK integrity từ `session_questions`. |

### Seed requirement

Tối thiểu **15–20 câu** per `(session_type, context_pack_id)` combination để fallback đủ dùng
khi AI timeout. Tổng tối thiểu: 3 session types × 2 packs × 15 = 90 câu.
Seed script riêng (không inline trong migration).

---

## users

Extension của `auth.users` (Supabase). Supabase tự manage `auth.users` — bảng `public.users`
chỉ lưu application fields. Trigger `on auth.users insert` sẽ INSERT row vào `public.users`
khi user đăng ký lần đầu qua Google OAuth.

```sql
CREATE TABLE users (
  id                UUID        PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL UNIQUE,
  role              TEXT        NOT NULL DEFAULT 'candidate'
    CHECK (role IN ('candidate', 'admin')),
  status            TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'banned', 'deleted')),
  profile_completed BOOLEAN     NOT NULL DEFAULT false,
  last_login_at     TIMESTAMPTZ NULL,
  deleted_at        TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `id` | Lấy từ `auth.users.id` — không tự generate, FK bắt buộc. |
| `role` | `admin` chỉ set thủ công qua Supabase Dashboard hoặc migration. |
| `status` | `banned`: session hết hạn ngay, API trả 403. `deleted`: soft delete, ẩn khỏi admin list. |
| `profile_completed` | Set `true` khi user hoàn thành UC-02 (save profile lần đầu). |
| `deleted_at` | Khi set: CV file cũng phải xóa khỏi Supabase Storage (UC-09 admin action). |

### Trigger cần tạo

```sql
-- Tự động tạo row trong public.users khi Supabase Auth tạo user mới
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
```

---

## user_profiles

Thông tin profile của candidate — target role, level, tech stack, CV. One-to-one với `users`.
Tạo sau khi user hoàn thành UC-02 (Profile Setup). UC-11 (Placement Test) ghi kết quả vào
`placement_level`.

```sql
CREATE TABLE user_profiles (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE
    REFERENCES users(id) ON DELETE CASCADE,
  full_name             TEXT        NOT NULL,
  target_position       TEXT        NOT NULL,
  target_role_category  TEXT        NOT NULL
    CHECK (target_role_category IN ('backend', 'frontend', 'mobile', 'data', 'ai', 'other')),
  target_level          TEXT        NOT NULL
    CHECK (target_level IN ('intern', 'fresher', 'junior')),
  preferred_tech_stack  TEXT        NULL,
  years_experience      INTEGER     NOT NULL DEFAULT 0
    CHECK (years_experience >= 0),
  default_language      TEXT        NOT NULL DEFAULT 'vi'
    CHECK (default_language IN ('vi', 'en')),
  tts_enabled           BOOLEAN     NOT NULL DEFAULT false,
  placement_level       TEXT        NULL
    CHECK (placement_level IN ('intern', 'fresher', 'junior')),
  cv_file_url           TEXT        NULL,
  cv_parsed_text        TEXT        NULL,
  cv_structured_json    JSONB       NULL,
  deleted_at            TIMESTAMPTZ NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `target_position` | Free text: "Backend Engineer", "iOS Developer". Không normalize — dùng để inject vào AI prompt. |
| `preferred_tech_stack` | Max 200 chars. Ví dụ: "Node.js, PostgreSQL, Docker". |
| `placement_level` | NULL cho đến khi UC-11 chạy. Nếu NULL, session setup dùng `target_level` thay thế. |
| `cv_file_url` | Supabase Storage path: `cv/{user_id}/{filename}.pdf`. Binary không lưu trong DB. |
| `cv_parsed_text` | Text extracted từ PDF bởi `pdf-parse`. Cache 24h trong Redis key `cv_text:{user_id}`. |
| `cv_structured_json` | Structured CV: `{name, education[], experience[], skills[], languages[]}`. Set sau khi AI parse CV. |

### cv_structured_json schema

```json
{
  "name": "Nguyễn Văn A",
  "education": [
    { "school": "ĐHBK Hà Nội", "degree": "Kỹ sư", "major": "CNTT", "gpa": 3.2, "year": 2026 }
  ],
  "experience": [
    { "company": "Startup XYZ", "role": "Backend Intern", "duration_months": 3, "description": "..." }
  ],
  "skills": ["Node.js", "PostgreSQL", "Git"],
  "languages": [{ "lang": "Vietnamese", "level": "native" }, { "lang": "English", "level": "B2" }]
}
```
