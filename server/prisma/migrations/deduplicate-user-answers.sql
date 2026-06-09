BEGIN;

SELECT pg_advisory_xact_lock(
  hashtext('interviewcoach:user_answers:deduplicate')
);

LOCK TABLE
  user_answers,
  ai_feedbacks,
  annotated_segments,
  follow_up_questions
IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE answer_dedup_plan ON COMMIT DROP AS
WITH answer_quality AS (
  SELECT
    ua.id,
    ua.session_id,
    ua.question_id,
    ua.feedback_generated,
    ua.created_at,
    af.id AS feedback_id,
    COALESCE(annotation_counts.annotation_count, 0) AS annotation_count
  FROM user_answers ua
  LEFT JOIN ai_feedbacks af
    ON af.user_answer_id = ua.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS annotation_count
    FROM annotated_segments segment
    WHERE segment.ai_feedback_id = af.id
  ) annotation_counts ON TRUE
),
ranked_answers AS (
  SELECT
    id AS discarded_answer_id,
    FIRST_VALUE(id) OVER (
      PARTITION BY session_id, question_id
      ORDER BY
        (feedback_id IS NOT NULL) DESC,
        annotation_count DESC,
        feedback_generated DESC,
        created_at ASC,
        id ASC
    ) AS survivor_answer_id,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, question_id
      ORDER BY
        (feedback_id IS NOT NULL) DESC,
        annotation_count DESC,
        feedback_generated DESC,
        created_at ASC,
        id ASC
    ) AS duplicate_rank
  FROM answer_quality
)
SELECT discarded_answer_id, survivor_answer_id
FROM ranked_answers
WHERE duplicate_rank > 1;

CREATE UNIQUE INDEX ON answer_dedup_plan (discarded_answer_id);

CREATE TEMP TABLE feedback_dedup_plan ON COMMIT DROP AS
WITH duplicate_group_members AS (
  SELECT discarded_answer_id AS answer_id, survivor_answer_id
  FROM answer_dedup_plan
  UNION
  SELECT survivor_answer_id, survivor_answer_id
  FROM answer_dedup_plan
),
feedback_quality AS (
  SELECT
    feedback.id AS feedback_id,
    members.survivor_answer_id,
    feedback.is_fallback,
    feedback.created_at,
    COUNT(segment.id)::INTEGER AS annotation_count
  FROM duplicate_group_members members
  JOIN ai_feedbacks feedback
    ON feedback.user_answer_id = members.answer_id
  LEFT JOIN annotated_segments segment
    ON segment.ai_feedback_id = feedback.id
  GROUP BY
    feedback.id,
    members.survivor_answer_id,
    feedback.is_fallback,
    feedback.created_at
)
SELECT
  feedback_id,
  survivor_answer_id,
  FIRST_VALUE(feedback_id) OVER (
    PARTITION BY survivor_answer_id
    ORDER BY
      is_fallback ASC,
      annotation_count DESC,
      created_at DESC,
      feedback_id ASC
  ) AS kept_feedback_id,
  ROW_NUMBER() OVER (
    PARTITION BY survivor_answer_id
    ORDER BY
      is_fallback ASC,
      annotation_count DESC,
      created_at DESC,
      feedback_id ASC
  ) AS feedback_rank
FROM feedback_quality;

UPDATE annotated_segments segment
SET ai_feedback_id = plan.kept_feedback_id
FROM feedback_dedup_plan plan
WHERE plan.feedback_rank > 1
  AND segment.ai_feedback_id = plan.feedback_id;

DELETE FROM ai_feedbacks feedback
USING feedback_dedup_plan plan
WHERE plan.feedback_rank > 1
  AND feedback.id = plan.feedback_id;

UPDATE ai_feedbacks feedback
SET user_answer_id = plan.survivor_answer_id
FROM feedback_dedup_plan plan
WHERE plan.feedback_rank = 1
  AND feedback.id = plan.feedback_id
  AND feedback.user_answer_id <> plan.survivor_answer_id;

CREATE TEMP TABLE follow_up_dedup_plan ON COMMIT DROP AS
WITH duplicate_group_members AS (
  SELECT discarded_answer_id AS answer_id, survivor_answer_id
  FROM answer_dedup_plan
  UNION
  SELECT survivor_answer_id, survivor_answer_id
  FROM answer_dedup_plan
),
ranked_follow_ups AS (
  SELECT
    follow_up.id AS follow_up_id,
    members.survivor_answer_id,
    FIRST_VALUE(follow_up.id) OVER (
      PARTITION BY members.survivor_answer_id
      ORDER BY
        (follow_up.follow_up_answer_text IS NOT NULL) DESC,
        follow_up.created_at ASC,
        follow_up.id ASC
    ) AS kept_follow_up_id,
    ROW_NUMBER() OVER (
      PARTITION BY members.survivor_answer_id
      ORDER BY
        (follow_up.follow_up_answer_text IS NOT NULL) DESC,
        follow_up.created_at ASC,
        follow_up.id ASC
    ) AS follow_up_rank
  FROM duplicate_group_members members
  JOIN follow_up_questions follow_up
    ON follow_up.user_answer_id = members.answer_id
)
SELECT *
FROM ranked_follow_ups;

DELETE FROM follow_up_questions follow_up
USING follow_up_dedup_plan plan
WHERE plan.follow_up_rank > 1
  AND follow_up.id = plan.follow_up_id;

UPDATE follow_up_questions follow_up
SET user_answer_id = plan.survivor_answer_id
FROM follow_up_dedup_plan plan
WHERE plan.follow_up_rank = 1
  AND follow_up.id = plan.follow_up_id
  AND follow_up.user_answer_id <> plan.survivor_answer_id;

UPDATE user_answers survivor
SET feedback_generated =
  survivor.feedback_generated
  OR EXISTS (
    SELECT 1
    FROM ai_feedbacks feedback
    WHERE feedback.user_answer_id = survivor.id
  )
  OR EXISTS (
    SELECT 1
    FROM answer_dedup_plan plan
    JOIN user_answers discarded
      ON discarded.id = plan.discarded_answer_id
    WHERE plan.survivor_answer_id = survivor.id
      AND discarded.feedback_generated
  )
WHERE survivor.id IN (
  SELECT survivor_answer_id
  FROM answer_dedup_plan
);

DELETE FROM user_answers answer
USING answer_dedup_plan plan
WHERE answer.id = plan.discarded_answer_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_answers'::regclass
      AND conname = 'user_answers_session_id_question_id_key'
  ) THEN
    ALTER TABLE user_answers
      ADD CONSTRAINT user_answers_session_id_question_id_key
      UNIQUE (session_id, question_id);
  END IF;
END
$$;

COMMIT;
