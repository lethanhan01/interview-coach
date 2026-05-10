# DB Design — Tables: Features & Audit

Nhóm này gồm 4 tables thuộc Layer 4. Tất cả đều độc lập với nhau.
`ai_quality_log` không có FK — tạo cuối cùng hoặc bất kỳ lúc nào.

---

## reverse_questions

Câu hỏi ngược — candidate hỏi AI (đóng vai interviewer) trong UC-12. Tối đa 3 câu per session,
enforce bởi `UNIQUE (session_id, order_index)` và CHECK constraint.

`evaluation_label` ghi nhận chất lượng câu hỏi của candidate — hidden khỏi candidate trong
UC-12, chỉ hiển thị trong comprehensive report (UC-06 và UC-05).

```sql
CREATE TABLE reverse_questions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID        NOT NULL
    REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_text      TEXT        NOT NULL
    CHECK (char_length(question_text) <= 500),
  answer_mode        TEXT        NOT NULL DEFAULT 'text'
    CHECK (answer_mode IN ('voice', 'text')),
  ai_response        TEXT        NOT NULL,
  evaluation_label   TEXT        NOT NULL
    CHECK (evaluation_label IN ('insightful', 'generic', 'red_flag')),
  evaluation_comment TEXT        NULL,
  order_index        INTEGER     NOT NULL
    CHECK (order_index BETWEEN 1 AND 3),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (session_id, order_index)
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `question_text` | Max 500 chars — UC-12 validation. Câu hỏi của candidate (không phải AI). |
| `answer_mode` | Reverse questions thường dùng `text` mặc định. Voice support optional. |
| `ai_response` | AI trả lời in-character (đóng vai interviewer từ JD context). |
| `evaluation_label` | Tự động assess bởi AI sau khi trả lời: `insightful` (câu hay), `generic` (câu chung chung), `red_flag` (câu không phù hợp). |
| `evaluation_comment` | Giải thích tại sao label đó. Hiển thị trong report, không hiển thị real-time. |
| `order_index` | 1-based (1, 2, 3). UNIQUE per session đảm bảo không quá 3 câu qua constraint. |

### evaluation_label logic

`evaluation_label` set bởi AI ngay trong cùng prompt generate `ai_response`. Tiêu chí:

- `insightful`: câu hỏi thể hiện hiểu biết về role, company, tech stack, hoặc culture
- `generic`: câu hỏi quá phổ biến ("What is the company culture?", "What are the benefits?")
- `red_flag`: câu hỏi gây ấn tượng xấu (chỉ hỏi về lương, WFH, vacation trước khi được offer)

---

## progress_snapshots

Snapshot điểm competency sau mỗi session hoàn thành. Dùng bởi UC-13 Dashboard để vẽ trend chart
và tính streak. INSERT bởi `ComprehensiveReportProcessor` cùng lúc với UPDATE `interview_sessions`.

```sql
CREATE TABLE progress_snapshots (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  session_id             UUID        NOT NULL
    REFERENCES interview_sessions(id) ON DELETE CASCADE,
  competency_scores_json JSONB       NOT NULL,
  overall_score          INTEGER     NULL
    CHECK (overall_score BETWEEN 0 AND 100),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `user_id` | Denormalized từ `interview_sessions.user_id` — tránh JOIN khi query dashboard. |
| `competency_scores_json` | Aggregate scores per dimension. Schema phụ thuộc session type (xem bên dưới). |
| `overall_score` | Copy từ `interview_sessions.overall_score` — denormalized để query dashboard nhanh hơn. |

### competency_scores_json schema

HR Behavioral session:
```json
{
  "type": "hr_behavioral",
  "scores": {
    "D1": 78,
    "D2": 65,
    "D3": 82,
    "D4": 70,
    "D5": 75,
    "D6": 60
  }
}
```

Technical session:
```json
{
  "type": "technical",
  "scores": {
    "TD1": 85,
    "TD2": 70,
    "TD3": 60,
    "TD4": 75,
    "TD5": 80
  }
}
```

Mixed session: chứa cả D1–D6 và TD1–TD5.

### Dashboard query patterns (UC-13)

```sql
-- Trend chart: overall_score theo thời gian
SELECT session_id, overall_score, created_at
FROM progress_snapshots
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;

-- Streak: số ngày liên tiếp có ít nhất 1 session
SELECT DATE(created_at) AS session_date
FROM progress_snapshots
WHERE user_id = $1
  AND created_at > now() - INTERVAL '60 days'
GROUP BY session_date
ORDER BY session_date DESC;

-- Competency trend cho một dimension
SELECT (competency_scores_json -> 'scores' ->> 'D3')::INTEGER AS d3_score, created_at
FROM progress_snapshots
WHERE user_id = $1
  AND (competency_scores_json ->> 'type') = 'hr_behavioral'
ORDER BY created_at DESC
LIMIT 10;
```

---

## placement_test_answers

Kết quả từng câu trả lời trong bài test định vị (UC-11). Mỗi user chỉ có một bộ kết quả
(UNIQUE constraint per `question_number`). Nếu user làm lại, cần DELETE cũ trước INSERT mới
(application layer responsibility).

```sql
CREATE TABLE placement_test_answers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  question_number  INTEGER     NOT NULL
    CHECK (question_number BETWEEN 1 AND 10),
  question_text    TEXT        NOT NULL,
  candidate_answer TEXT        NOT NULL,
  is_correct       BOOLEAN     NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, question_number)
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `question_text` | Lưu lại câu hỏi đã hỏi — vì question pool có thể thay đổi theo thời gian. |
| `candidate_answer` | MCQ: option letter hoặc text. Short answer: free text. |
| `is_correct` | Set bởi AI scoring ngay sau khi user submit. |

### Placement result logic

Sau khi tất cả 10 rows được INSERT, application tính:

```
score = COUNT(*) WHERE is_correct = true
placement_level = CASE
  WHEN score >= 8 THEN 'junior'
  WHEN score >= 5 THEN 'fresher'
  ELSE                'intern'
END
```

Kết quả UPDATE vào `user_profiles.placement_level`.

---

## ai_quality_log

Audit log cho mọi AI API call từ BullMQ processors. Không có FK — intentional để đảm bảo
audit trail không bị xóa theo cascade khi session hoặc answer bị remove.

```sql
CREATE TABLE ai_quality_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        NULL,
  job_type      TEXT        NOT NULL
    CHECK (job_type IN ('question-gen', 'follow-up', 'feedback', 'rewrite-eval', 'report')),
  prompt_version TEXT       NOT NULL,
  model         TEXT        NOT NULL
    CHECK (model IN ('gpt-4o', 'whisper-1')),
  input_tokens  INTEGER     NULL CHECK (input_tokens >= 0),
  output_tokens INTEGER     NULL CHECK (output_tokens >= 0),
  latency_ms    INTEGER     NOT NULL CHECK (latency_ms >= 0),
  is_fallback   BOOLEAN     NOT NULL DEFAULT false,
  error_code    TEXT        NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `session_id` | Soft reference — không có FK constraint. Nếu session bị xóa, log row vẫn còn nguyên. |
| `job_type` | Map 1-1 với 5 BullMQ queues: `question-gen`, `follow-up`, `feedback`, `rewrite-eval`, `report`. |
| `prompt_version` | Semantic version của prompt template: `question-gen-v1.0`, `surgical-feedback-v1.0`, v.v. Dùng để track A/B test prompt. |
| `model` | `gpt-4o` cho tất cả text AI calls; `whisper-1` cho STT. Thêm model mới vào CHECK khi dùng. |
| `input_tokens` / `output_tokens` | NULL nếu call failed trước khi nhận response. Dùng để tính cost. |
| `latency_ms` | Wall-clock time từ lúc gửi request đến nhận response. So sánh với SLO per job type. |
| `is_fallback` | `true` khi processor timeout hoặc validation fail và dùng fallback strategy. |
| `error_code` | OpenAI error code hoặc custom code: `TIMEOUT`, `VALIDATION_FAIL`, `RATE_LIMIT`. NULL khi thành công. |

### SLO monitoring query

```sql
-- Tỷ lệ fallback per job type (7 ngày)
SELECT
  job_type,
  COUNT(*) AS total_calls,
  SUM(CASE WHEN is_fallback THEN 1 ELSE 0 END) AS fallback_count,
  ROUND(100.0 * SUM(CASE WHEN is_fallback THEN 1 ELSE 0 END) / COUNT(*), 1) AS fallback_pct,
  ROUND(AVG(latency_ms)) AS avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM ai_quality_log
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY job_type
ORDER BY fallback_pct DESC;
```

Admin endpoint `GET /api/v1/admin/ai-quality-log` dùng query tương tự để dashboard SLO monitoring.
