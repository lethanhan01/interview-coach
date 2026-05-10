# DB Design — Tables: Session

Nhóm này gồm 2 tables thuộc Layer 2. Cả hai phụ thuộc vào Layer 0–1.

Migration order: `interview_sessions` → `session_questions`.

---

## interview_sessions

Table trung tâm của hệ thống. Lưu toàn bộ session configuration (UC-03) và kết quả tổng hợp
sau khi `ComprehensiveReportProcessor` hoàn thành (UC-05). Các JSON columns report được
UPDATE dần qua pipeline — không phải một lần INSERT.

```sql
CREATE TABLE interview_sessions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  job_description         TEXT        NOT NULL
    CHECK (char_length(job_description) BETWEEN 100 AND 5000),
  jd_source               TEXT        NOT NULL
    CHECK (jd_source IN ('paste', 'pdf', 'url')),
  jd_url                  TEXT        NULL,
  job_title               TEXT        NULL,
  session_type            TEXT        NOT NULL
    CHECK (session_type IN ('hr_behavioral', 'technical', 'mixed')),
  num_questions           INTEGER     NOT NULL DEFAULT 5
    CHECK (num_questions IN (3, 5, 7)),
  difficulty              TEXT        NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  persona                 TEXT        NOT NULL DEFAULT 'neutral_tech_lead'
    CHECK (persona IN ('friendly_hr', 'neutral_tech_lead', 'strict_senior', 'senior_manager')),
  mode                    TEXT        NOT NULL DEFAULT 'practice'
    CHECK (mode IN ('practice', 'exam')),
  duration_min            INTEGER     NOT NULL DEFAULT 30
    CHECK (duration_min IN (15, 30, 45, 60)),
  language                TEXT        NOT NULL DEFAULT 'vi'
    CHECK (language IN ('vi', 'en', 'mixed')),
  context_pack_id         TEXT        NOT NULL
    REFERENCES context_packs(id) ON DELETE RESTRICT,
  show_prep_card          BOOLEAN     NOT NULL DEFAULT false,
  status                  TEXT        NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'in_progress', 'generating_report', 'completed', 'interrupted')),
  plan_json               JSONB       NULL,
  opening_transcript      TEXT        NULL,
  self_eval_json          JSONB       NULL,
  overall_score           INTEGER     NULL
    CHECK (overall_score BETWEEN 0 AND 100),
  executive_summary_json  JSONB       NULL,
  comm_analysis_json      JSONB       NULL,
  competency_heatmap_json JSONB       NULL,
  reverse_q_eval_json     JSONB       NULL,
  action_plan_json        JSONB       NULL,
  completed_at            TIMESTAMPTZ NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_interview_sessions_jd_url
    CHECK (jd_source != 'url' OR jd_url IS NOT NULL)
);
```

### Column notes

| Column | Set khi nào | Ghi chú |
| ------ | ----------- | ------- |
| `job_description` | POST /sessions (UC-03) | 100–5000 chars — NFR AS-04 và P-18. |
| `jd_url` | POST /sessions nếu jd_source='url' | CHECK constraint bắt buộc non-null khi source=url. |
| `job_title` | POST /sessions | Extracted từ JD text bởi NestJS service. Nullable nếu không parse được. |
| `status` | Thay đổi theo pipeline | Xem lifecycle diagram bên dưới. |
| `plan_json` | QuestionGenerationProcessor | `{questions[], sequencing: string, rubric: object}`. |
| `opening_transcript` | UC-04 Opening Phase | Câu tự giới thiệu của candidate. |
| `self_eval_json` | UC-04 Closing Phase | `{rating: 1-5, comment: string}` — candidate tự đánh giá. |
| `executive_summary_json` | ComprehensiveReportProcessor | `{avg_score, recommendation, strengths[], gaps[]}`. |
| `comm_analysis_json` | ComprehensiveReportProcessor | `{avg_wpm, filler_count, speak_silence_ratio}`. |
| `competency_heatmap_json` | ComprehensiveReportProcessor | `{D1: score, D2: score, ...}` hoặc `{TD1: score, ...}`. |
| `reverse_q_eval_json` | ComprehensiveReportProcessor | `{q_id: label, ...}` — label mỗi reverse question. |
| `action_plan_json` | ComprehensiveReportProcessor (AI step) | `{items: [{priority, action, rationale}]}`. |
| `completed_at` | Khi status → 'completed' | Set đồng thời với UPDATE status. |

### Status lifecycle

```
generating
    │
    │  QuestionGenerationProcessor hoàn thành
    ▼
in_progress
    │
    │  Tất cả turns xong, user kết thúc session
    ▼
generating_report
    │
    │  ComprehensiveReportProcessor hoàn thành
    ▼
completed
```

`interrupted`: user thoát giữa chừng hoặc session timeout. Pipeline dừng; report không được tạo.

### NFR mapping

| NFR | Column | Enforcement |
| --- | ------ | ----------- |
| AS-04 (JD tối thiểu 100 chars) | `job_description` | `CHECK (char_length(...) >= 100)` |
| P-18 (JD tối đa 5000 chars) | `job_description` | `CHECK (char_length(...) <= 5000)` |
| P-20 (max 7 questions/session) | `num_questions` | `CHECK (num_questions IN (3, 5, 7))` |
| S-12 (max 10 sessions/24h) | — | Enforced tại API layer, không phải DB constraint |

### plan_json schema

```json
{
  "questions": [
    {
      "id": "uuid",
      "text": "...",
      "category": "teamwork",
      "competency_domain": "D3",
      "difficulty": 3,
      "estimated_time_min": 4
    }
  ],
  "sequencing": "Opening → Warm-up → Core → Stretch → Closing",
  "rubric": { "D1": { "weight": 0.20 }, "D2": { "weight": 0.20 } }
}
```

---

## session_questions

Câu hỏi cụ thể trong một session. Row được INSERT bởi `QuestionGenerationProcessor` sau khi
LLM generate (hoặc seed fallback). `question_bank_id` là NULL khi câu hỏi do LLM generate động.

```sql
CREATE TABLE session_questions (
  id               UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID     NOT NULL
    REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_bank_id UUID     NULL
    REFERENCES question_bank(id) ON DELETE SET NULL,
  question_text    TEXT     NOT NULL,
  order_index      INTEGER  NOT NULL CHECK (order_index >= 0),
  question_category TEXT    NOT NULL,
  competency_domain TEXT    NOT NULL,
  rubric_json      JSONB    NOT NULL,
  estimated_time_min INTEGER NULL CHECK (estimated_time_min > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (session_id, order_index)
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `question_bank_id` | NULL nếu LLM-generated. `ON DELETE SET NULL` — deactivate seed câu hỏi không xóa session history. |
| `order_index` | 0-based. Câu 1 = index 0. UNIQUE per session đảm bảo không trùng thứ tự. |
| `question_category` | Từ session type spec: `teamwork`, `conflict`, `data_structures`, `system_design`, v.v. |
| `competency_domain` | `D1`–`D6` (HR), `TD1`–`TD5` (Technical). Dùng để aggregate heatmap trong ComprehensiveReportProcessor. |
| `rubric_json` | Per-question rubric — subset của `context_packs.rubric_json`, có thể customize per question. |

### rubric_json schema (per question)

```json
{
  "dimensions": {
    "D3": { "name": "Làm việc nhóm", "weight": 1.0, "criteria": ["collaboration", "conflict_resolution"] }
  },
  "scoring_guide": {
    "90_100": "Có ví dụ cụ thể, STAR đầy đủ, kết quả đo lường được",
    "70_89":  "Có ví dụ, STAR thiếu một phần, kết quả mơ hồ",
    "50_69":  "Ví dụ chung chung, thiếu kết quả",
    "0_49":   "Không có ví dụ, trả lời lý thuyết thuần túy"
  }
}
```

### AntiRepeatService query pattern

```sql
-- Lấy câu hỏi đã gặp trong 30 ngày gần nhất cho user
SELECT sq.question_text
FROM session_questions sq
JOIN interview_sessions s ON sq.session_id = s.id
WHERE s.user_id = $1
  AND s.created_at > now() - INTERVAL '30 days';
```

Không dùng vector similarity — SQL JOIN đủ cho v1 (OQ-4 resolved).
