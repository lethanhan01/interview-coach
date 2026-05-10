# DB Design — Tables: Answer & Feedback

Nhóm này gồm 5 tables thuộc Layer 3. Đây là nhóm phức tạp nhất về dependency:
`rewrite_answers` phải được CREATE trước `ai_feedbacks` vì `ai_feedbacks` có FK tới cả hai.

Migration order bắt buộc trong nhóm này:
`user_answers` → `follow_up_questions` → `rewrite_answers` → `ai_feedbacks` → `annotated_segments`

---

## user_answers

Một row per turn — câu trả lời của candidate cho một câu hỏi trong session. Voice hoặc text.
INSERT bởi API endpoint `POST /sessions/:id/turns` ngay khi nhận input (trước khi BullMQ jobs
chạy). BullMQ processors sau đó UPDATE `feedback_generated` khi xong.

```sql
CREATE TABLE user_answers (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id             UUID        NOT NULL
    REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id            UUID        NOT NULL
    REFERENCES session_questions(id) ON DELETE CASCADE,
  answer_mode            TEXT        NOT NULL
    CHECK (answer_mode IN ('voice', 'text')),
  answer_text            TEXT        NOT NULL,
  audio_file_url         TEXT        NULL,
  audio_duration_seconds INTEGER     NULL
    CHECK (audio_duration_seconds BETWEEN 1 AND 300),
  audio_size_bytes       INTEGER     NULL
    CHECK (audio_size_bytes > 0),
  skipped                BOOLEAN     NOT NULL DEFAULT false,
  voice_metrics_json     JSONB       NULL,
  feedback_generated     BOOLEAN     NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_user_answers_voice_fields
    CHECK (answer_mode != 'voice' OR audio_file_url IS NOT NULL)
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `answer_text` | Nếu `answer_mode = 'voice'`: Whisper-1 transcript (STT). Nếu `text`: direct input. |
| `audio_file_url` | Supabase Storage path: `audio/{session_id}/{question_id}.webm`. NULL nếu text mode. |
| `audio_duration_seconds` | Max 300s — NFR P-17. CHECK constraint enforce ở DB layer. |
| `audio_size_bytes` | Max ~25MB (P-16) — enforced tại API upload layer, không có DB CHECK (size có thể lớn hơn nếu lỗi validation bypass). |
| `skipped` | Chỉ cho phép skip từ câu Q2 trở đi (UC-04 business rule — enforce tại API layer). |
| `voice_metrics_json` | `{wpm: 120, filler_count: 3, pause_count: 2, duration_seconds: 95}`. Calculated sau STT. |
| `feedback_generated` | Set `true` bởi `FeedbackProcessor` khi INSERT `ai_feedbacks` thành công. |

### voice_metrics_json schema

```json
{
  "wpm": 120,
  "filler_count": 3,
  "pause_count": 2,
  "duration_seconds": 95,
  "filler_words_detected": ["ừm", "à", "kiểu như"]
}
```

Filler words list: `['ừm', 'à', 'thì', 'ý là', 'kiểu như', 'um', 'uh', 'like', 'you know']`.

---

## follow_up_questions

Follow-up question được `FollowUpProcessor` tạo ra khi phát hiện trigger trong transcript.
Một `user_answer` có tối đa 1 follow-up (trigger evaluation chạy 1 lần per turn).
`follow_up_answer_text` được điền sau khi candidate trả lời follow-up.

```sql
CREATE TABLE follow_up_questions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_answer_id          UUID        NOT NULL
    REFERENCES user_answers(id) ON DELETE CASCADE,
  follow_up_text          TEXT        NOT NULL,
  trigger_rule            TEXT        NOT NULL,
  trigger_reason          TEXT        NULL,
  follow_up_answer_text   TEXT        NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `trigger_rule` | Mã trigger từ AI pipeline: `T1_STAR_Missing`, `T2_No_Result`, `T4_Vague`, `T7_Interesting_Point`, v.v. |
| `trigger_reason` | Brief explanation bởi AI tại sao trigger được kích hoạt. Nullable — không phải tất cả triggers trả về reason. |
| `follow_up_answer_text` | NULL cho đến khi candidate submit follow-up answer qua `POST /sessions/:id/turns/:turnId/followup`. |

### Trigger rule codes

| Code | Mô tả | Session type áp dụng |
| ---- | ----- | -------------------- |
| T1_STAR_Missing | Câu trả lời thiếu STAR structure | HR, Mixed |
| T2_No_Result | Không đề cập đến kết quả/outcome | HR, Mixed |
| T4_Vague | Câu trả lời quá chung chung | HR, Technical, Mixed |
| T5_Technical_Shallow | Giải thích kỹ thuật bề nổi | Technical, Mixed |
| T6_No_Tradeoff | Không đề cập đến tradeoff | Technical, Mixed |
| T7_Interesting_Point | Điểm thú vị cần khai thác thêm | HR, Mixed |
| T8_Inconsistency | Mâu thuẫn với JD hoặc CV | HR, Technical, Mixed |
| S2_Repetition | Lặp lại câu trả lời giống session trước | All |

---

## rewrite_answers

Rewrite attempt của candidate cho một `user_answer`. Max 5 attempts per answer (NFR P-21),
enforce bởi `UNIQUE (user_answer_id, attempt_number)` + CHECK constraint.

`delta_score` được set bởi `RewriteEvalProcessor` sau khi AI chấm điểm rewrite — có thể âm
nếu rewrite kém hơn bản gốc.

```sql
CREATE TABLE rewrite_answers (
  id                             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_answer_id                 UUID        NOT NULL
    REFERENCES user_answers(id) ON DELETE CASCADE,
  attempt_number                 INTEGER     NOT NULL
    CHECK (attempt_number BETWEEN 1 AND 5),
  rewrite_mode                   TEXT        NOT NULL
    CHECK (rewrite_mode IN ('voice', 'text')),
  rewrite_text                   TEXT        NOT NULL,
  rewrite_audio_url              TEXT        NULL,
  rewrite_audio_duration_seconds INTEGER     NULL
    CHECK (rewrite_audio_duration_seconds BETWEEN 1 AND 300),
  delta_score                    INTEGER     NULL,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_answer_id, attempt_number),

  CONSTRAINT chk_rewrite_answers_voice_fields
    CHECK (rewrite_mode != 'voice' OR rewrite_audio_url IS NOT NULL)
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `attempt_number` | 1-based. Application layer tính `MAX(attempt_number) + 1` trước INSERT. UNIQUE constraint ngăn race condition. |
| `delta_score` | `new_score - original_score`. NULL cho đến khi `RewriteEvalProcessor` chạy xong. Range thực tế: -100 đến +100. |

### delta_score display states (HLD §5.3)

| Điều kiện | Label hiển thị |
| --------- | -------------- |
| delta_score >= 20 | "Cải thiện rõ rệt" |
| delta_score > 0 | "Có cải thiện" |
| delta_score = 0 | "Chưa thay đổi" |
| delta_score < 0 | "Điểm giảm" |

---

## ai_feedbacks

Surgical feedback output từ `FeedbackProcessor` (original answer) hoặc `RewriteEvalProcessor`
(rewrite). Dùng chung một table với hai nullable FK — CHECK constraint đảm bảo đúng một FK non-null.

```sql
CREATE TABLE ai_feedbacks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_answer_id    UUID        NULL
    REFERENCES user_answers(id) ON DELETE CASCADE,
  rewrite_answer_id UUID        NULL
    REFERENCES rewrite_answers(id) ON DELETE CASCADE,
  overall_score     INTEGER     NOT NULL
    CHECK (overall_score BETWEEN 0 AND 100),
  model_answer      TEXT        NOT NULL,
  key_takeaway      TEXT        NOT NULL,
  prompt_version    TEXT        NOT NULL,
  is_fallback       BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_ai_feedbacks_source CHECK (
    (user_answer_id IS NOT NULL AND rewrite_answer_id IS NULL) OR
    (user_answer_id IS NULL     AND rewrite_answer_id IS NOT NULL)
  )
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `overall_score` | 0–100. Aggregate từ rubric dimensions (D1–D6 hoặc TD1–TD5). |
| `model_answer` | Câu trả lời mẫu từ AI — hiển thị trong UC-06 Surgical Review. |
| `key_takeaway` | One-liner key insight. Ví dụ: "Thiếu kết quả cụ thể trong STAR story". |
| `prompt_version` | `surgical-feedback-v1.0`, `rewrite-eval-v1.0`. Dùng để audit và A/B test prompt. |
| `is_fallback` | `true` khi AI timeout và FeedbackProcessor dùng fallback prompt đơn giản hơn. |

### Query pattern — lấy feedback cho một turn

```sql
SELECT f.overall_score, f.model_answer, f.key_takeaway,
       s.segment_text, s.highlight_level, s.annotation, s.improved_version
FROM ai_feedbacks f
JOIN annotated_segments s ON s.ai_feedback_id = f.id
WHERE f.user_answer_id = $1
ORDER BY s.start_index;
```

---

## annotated_segments

Từng đoạn highlight trong transcript của `user_answer` (hoặc `rewrite_answer`). Mỗi segment
là một substring với vị trí ký tự, level (good/warning/critical), và annotation text.

`improved_version` bắt buộc khi level là `warning` hoặc `critical` — CHECK constraint enforce.

```sql
CREATE TABLE annotated_segments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_feedback_id   UUID        NOT NULL
    REFERENCES ai_feedbacks(id) ON DELETE CASCADE,
  segment_text     TEXT        NOT NULL,
  start_index      INTEGER     NOT NULL CHECK (start_index >= 0),
  end_index        INTEGER     NOT NULL,
  highlight_level  TEXT        NOT NULL
    CHECK (highlight_level IN ('good', 'warning', 'critical')),
  annotation       TEXT        NOT NULL,
  suggestion       TEXT        NULL,
  improved_version TEXT        NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_annotated_segments_end_index
    CHECK (end_index > start_index),

  CONSTRAINT chk_annotated_segments_improved_version
    CHECK (highlight_level = 'good' OR improved_version IS NOT NULL)
);
```

### Column notes

| Column | Ghi chú |
| ------ | ------- |
| `segment_text` | Exact substring từ `user_answers.answer_text` (hoặc `rewrite_answers.rewrite_text`). |
| `start_index` / `end_index` | Character offset trong transcript — dùng để render highlight overlay trên UI. |
| `highlight_level` | `good`: xanh, `warning`: vàng, `critical`: đỏ — map sang color tokens trong SRS §2.5. |
| `annotation` | Giải thích tại sao đoạn này được đánh dấu. |
| `suggestion` | Gợi ý cải thiện chung. Nullable — không phải tất cả segments cần suggestion. |
| `improved_version` | Rewrite exemplar cho đoạn này. Bắt buộc khi level ≠ 'good'. |

### Popup data structure (UC-06 Surgical Review)

Khi user click vào một highlight trên UI, frontend query:

```sql
SELECT annotation, suggestion, improved_version, highlight_level
FROM annotated_segments
WHERE id = $1;
```

Popup hiển thị: label severity (Vấn đề / Gợi ý / Nên nói) + nội dung annotation, suggestion,
improved_version tương ứng.
