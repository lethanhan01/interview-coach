CREATE TEMP TABLE IF NOT EXISTS user_answer_dedupe_map ON COMMIT DROP AS
WITH ranked_answers AS (
  SELECT
    id,
    session_id,
    question_id,
    FIRST_VALUE(id) OVER (
      PARTITION BY session_id, question_id
      ORDER BY feedback_generated DESC, updated_at DESC, created_at DESC, id DESC
    ) AS keeper_answer_id,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, question_id
      ORDER BY feedback_generated DESC, updated_at DESC, created_at DESC, id DESC
    ) AS rank_in_group
  FROM user_answers
)
SELECT
  id AS loser_answer_id,
  keeper_answer_id,
  session_id,
  question_id
FROM ranked_answers
WHERE rank_in_group > 1;

WITH duplicate_groups AS (
  SELECT DISTINCT keeper_answer_id, session_id, question_id
  FROM user_answer_dedupe_map
),
grouped_answers AS (
  SELECT
    duplicate_groups.keeper_answer_id,
    BOOL_OR(user_answers.feedback_generated) AS feedback_generated,
    MAX(user_answers.updated_at) AS updated_at
  FROM duplicate_groups
  JOIN user_answers
    ON user_answers.session_id = duplicate_groups.session_id
   AND user_answers.question_id = duplicate_groups.question_id
  GROUP BY duplicate_groups.keeper_answer_id
)
UPDATE user_answers
SET
  feedback_generated = grouped_answers.feedback_generated,
  updated_at = GREATEST(user_answers.updated_at, grouped_answers.updated_at)
FROM grouped_answers
WHERE user_answers.id = grouped_answers.keeper_answer_id;

CREATE TEMP TABLE IF NOT EXISTS user_answer_dedupe_feedback_map ON COMMIT DROP AS
WITH duplicate_groups AS (
  SELECT DISTINCT keeper_answer_id, session_id, question_id
  FROM user_answer_dedupe_map
),
ranked_feedbacks AS (
  SELECT
    ai_feedbacks.id AS feedback_id,
    FIRST_VALUE(ai_feedbacks.id) OVER (
      PARTITION BY duplicate_groups.keeper_answer_id
      ORDER BY
        (user_answers.id = duplicate_groups.keeper_answer_id) DESC,
        ai_feedbacks.created_at DESC,
        ai_feedbacks.id DESC
    ) AS keeper_feedback_id,
    duplicate_groups.keeper_answer_id
  FROM duplicate_groups
  JOIN user_answers
    ON user_answers.session_id = duplicate_groups.session_id
   AND user_answers.question_id = duplicate_groups.question_id
  JOIN ai_feedbacks
    ON ai_feedbacks.user_answer_id = user_answers.id
)
SELECT feedback_id, keeper_feedback_id, keeper_answer_id
FROM ranked_feedbacks;

UPDATE ai_feedbacks
SET user_answer_id = keepers.keeper_answer_id
FROM (
  SELECT DISTINCT keeper_feedback_id, keeper_answer_id
  FROM user_answer_dedupe_feedback_map
) keepers
WHERE ai_feedbacks.id = keepers.keeper_feedback_id
  AND ai_feedbacks.user_answer_id <> keepers.keeper_answer_id;

UPDATE annotated_segments
SET ai_feedback_id = user_answer_dedupe_feedback_map.keeper_feedback_id
FROM user_answer_dedupe_feedback_map
WHERE annotated_segments.ai_feedback_id = user_answer_dedupe_feedback_map.feedback_id
  AND user_answer_dedupe_feedback_map.feedback_id <> user_answer_dedupe_feedback_map.keeper_feedback_id;

DELETE FROM ai_feedbacks
USING user_answer_dedupe_feedback_map
WHERE ai_feedbacks.id = user_answer_dedupe_feedback_map.feedback_id
  AND user_answer_dedupe_feedback_map.feedback_id <> user_answer_dedupe_feedback_map.keeper_feedback_id;

DELETE FROM user_answers
USING user_answer_dedupe_map
WHERE user_answers.id = user_answer_dedupe_map.loser_answer_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_answers'::regclass
      AND conname = 'user_answers_session_id_question_id_key'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = current_schema()
        AND c.relname = 'user_answers_session_id_question_id_key'
    ) THEN
      ALTER TABLE user_answers
        ADD CONSTRAINT user_answers_session_id_question_id_key
        UNIQUE USING INDEX user_answers_session_id_question_id_key;
    ELSE
      ALTER TABLE user_answers
        ADD CONSTRAINT user_answers_session_id_question_id_key
        UNIQUE (session_id, question_id);
    END IF;
  END IF;
END
$$;
