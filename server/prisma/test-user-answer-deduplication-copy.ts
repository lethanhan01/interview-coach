import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL is required');
  }

  const client = new Client({ connectionString });
  const schemaName = `migration_test_${Date.now()}`;
  const schema = quoteIdentifier(schemaName);
  await client.connect();

  try {
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`
      CREATE TABLE ${schema}.user_answers
        AS TABLE public.user_answers WITH NO DATA;
      CREATE TABLE ${schema}.ai_feedbacks
        AS TABLE public.ai_feedbacks WITH NO DATA;
      CREATE TABLE ${schema}.annotated_segments
        AS TABLE public.annotated_segments WITH NO DATA;
      CREATE TABLE ${schema}.follow_up_questions
        AS TABLE public.follow_up_questions WITH NO DATA;

      ALTER TABLE ${schema}.user_answers ADD PRIMARY KEY (id);
      ALTER TABLE ${schema}.ai_feedbacks ADD PRIMARY KEY (id);
      ALTER TABLE ${schema}.annotated_segments ADD PRIMARY KEY (id);
      ALTER TABLE ${schema}.follow_up_questions ADD PRIMARY KEY (id);

      ALTER TABLE ${schema}.ai_feedbacks
        ADD CONSTRAINT ai_feedbacks_user_answer_id_key UNIQUE (user_answer_id),
        ADD CONSTRAINT ai_feedbacks_user_answer_id_fkey
          FOREIGN KEY (user_answer_id)
          REFERENCES ${schema}.user_answers(id)
          ON DELETE CASCADE;
      ALTER TABLE ${schema}.annotated_segments
        ADD CONSTRAINT annotated_segments_ai_feedback_id_fkey
          FOREIGN KEY (ai_feedback_id)
          REFERENCES ${schema}.ai_feedbacks(id)
          ON DELETE CASCADE;
      ALTER TABLE ${schema}.follow_up_questions
        ADD CONSTRAINT follow_up_questions_user_answer_id_key
          UNIQUE (user_answer_id),
        ADD CONSTRAINT follow_up_questions_user_answer_id_fkey
          FOREIGN KEY (user_answer_id)
          REFERENCES ${schema}.user_answers(id)
          ON DELETE CASCADE;

      INSERT INTO ${schema}.user_answers
        SELECT * FROM public.user_answers;
      INSERT INTO ${schema}.ai_feedbacks
        SELECT * FROM public.ai_feedbacks;
      INSERT INTO ${schema}.annotated_segments
        SELECT * FROM public.annotated_segments;
      INSERT INTO ${schema}.follow_up_questions
        SELECT * FROM public.follow_up_questions;
    `);

    const seedResult = await client.query<{
      answer_id: string;
      feedback_id: string;
      session_id: string;
      question_id: string;
    }>(`
      SELECT
        answer.id AS answer_id,
        feedback.id AS feedback_id,
        answer.session_id,
        answer.question_id
      FROM ${schema}.user_answers answer
      JOIN ${schema}.ai_feedbacks feedback
        ON feedback.user_answer_id = answer.id
      JOIN ${schema}.annotated_segments segment
        ON segment.ai_feedback_id = feedback.id
      ORDER BY answer.created_at ASC
      LIMIT 1
    `);
    const seed = seedResult.rows[0];
    if (!seed) {
      throw new Error(
        'The source database needs an answer with feedback and annotations.',
      );
    }

    const duplicateAnswerResult = await client.query<{ id: string }>(
      `
        INSERT INTO ${schema}.user_answers (
          id,
          session_id,
          question_id,
          answer_mode,
          answer_text,
          audio_file_url,
          audio_duration_seconds,
          audio_size_bytes,
          skipped,
          voice_metrics_json,
          feedback_generated,
          created_at,
          updated_at
        )
        SELECT
          gen_random_uuid(),
          session_id,
          question_id,
          answer_mode,
          answer_text,
          audio_file_url,
          audio_duration_seconds,
          audio_size_bytes,
          skipped,
          voice_metrics_json,
          TRUE,
          created_at + INTERVAL '1 minute',
          updated_at + INTERVAL '1 minute'
        FROM ${schema}.user_answers
        WHERE id = $1
        RETURNING id
      `,
      [seed.answer_id],
    );
    const duplicateAnswerId = duplicateAnswerResult.rows[0]?.id;
    if (!duplicateAnswerId) {
      throw new Error('Unable to create duplicate answer in the test copy.');
    }

    const duplicateFeedbackResult = await client.query<{ id: string }>(
      `
        INSERT INTO ${schema}.ai_feedbacks (
          id,
          user_answer_id,
          overall_score,
          model_answer,
          key_takeaway,
          prompt_version,
          is_fallback,
          created_at
        )
        SELECT
          gen_random_uuid(),
          $1,
          overall_score,
          model_answer,
          key_takeaway,
          prompt_version,
          is_fallback,
          created_at + INTERVAL '1 minute'
        FROM ${schema}.ai_feedbacks
        WHERE id = $2
        RETURNING id
      `,
      [duplicateAnswerId, seed.feedback_id],
    );
    const duplicateFeedbackId = duplicateFeedbackResult.rows[0]?.id;
    if (!duplicateFeedbackId) {
      throw new Error('Unable to create duplicate feedback in the test copy.');
    }

    await client.query(
      `
        INSERT INTO ${schema}.annotated_segments (
          id,
          ai_feedback_id,
          segment_text,
          start_index,
          end_index,
          highlight_level,
          annotation,
          suggestion,
          improved_version,
          created_at
        )
        SELECT
          gen_random_uuid(),
          $1,
          segment_text,
          start_index,
          end_index,
          highlight_level,
          annotation,
          suggestion,
          improved_version,
          created_at + INTERVAL '1 minute'
        FROM ${schema}.annotated_segments
        WHERE ai_feedback_id = $2;
      `,
      [duplicateFeedbackId, seed.feedback_id],
    );
    await client.query(
      `
        INSERT INTO ${schema}.follow_up_questions (
          id,
          user_answer_id,
          follow_up_text,
          trigger_rule,
          trigger_reason,
          follow_up_answer_text,
          created_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          'Migration test follow-up',
          'migration_test',
          'Verify relation preservation',
          'Preserved answer',
          now()
        );
      `,
      [duplicateAnswerId],
    );

    const beforeResult = await client.query<{
      answers: number;
      feedbacks: number;
      annotations: number;
      follow_ups: number;
    }>(
      `
        SELECT
          COUNT(DISTINCT answer.id)::INTEGER AS answers,
          COUNT(DISTINCT feedback.id)::INTEGER AS feedbacks,
          COUNT(DISTINCT segment.id)::INTEGER AS annotations,
          COUNT(DISTINCT follow_up.id)::INTEGER AS follow_ups
        FROM ${schema}.user_answers answer
        LEFT JOIN ${schema}.ai_feedbacks feedback
          ON feedback.user_answer_id = answer.id
        LEFT JOIN ${schema}.annotated_segments segment
          ON segment.ai_feedback_id = feedback.id
        LEFT JOIN ${schema}.follow_up_questions follow_up
          ON follow_up.user_answer_id = answer.id
        WHERE answer.session_id = $1
          AND answer.question_id = $2
      `,
      [seed.session_id, seed.question_id],
    );
    const before = beforeResult.rows[0];

    await client.query(`SET search_path TO ${schema}, public`);
    const migrationSql = readFileSync(
      join(process.cwd(), 'prisma', 'migrations', 'deduplicate-user-answers.sql'),
      'utf8',
    );
    await client.query(migrationSql);

    const afterResult = await client.query<{
      answers: number;
      feedbacks: number;
      annotations: number;
      follow_ups: number;
      orphan_feedbacks: number;
      orphan_annotations: number;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)::INTEGER
            FROM ${schema}.user_answers
            WHERE session_id = $1 AND question_id = $2
          ) AS answers,
          (
            SELECT COUNT(*)::INTEGER
            FROM ${schema}.ai_feedbacks feedback
            JOIN ${schema}.user_answers answer
              ON answer.id = feedback.user_answer_id
            WHERE answer.session_id = $1 AND answer.question_id = $2
          ) AS feedbacks,
          (
            SELECT COUNT(*)::INTEGER
            FROM ${schema}.annotated_segments segment
            JOIN ${schema}.ai_feedbacks feedback
              ON feedback.id = segment.ai_feedback_id
            JOIN ${schema}.user_answers answer
              ON answer.id = feedback.user_answer_id
            WHERE answer.session_id = $1 AND answer.question_id = $2
          ) AS annotations,
          (
            SELECT COUNT(*)::INTEGER
            FROM ${schema}.follow_up_questions follow_up
            JOIN ${schema}.user_answers answer
              ON answer.id = follow_up.user_answer_id
            WHERE answer.session_id = $1 AND answer.question_id = $2
          ) AS follow_ups,
          (
            SELECT COUNT(*)::INTEGER
            FROM ${schema}.ai_feedbacks feedback
            LEFT JOIN ${schema}.user_answers answer
              ON answer.id = feedback.user_answer_id
            WHERE answer.id IS NULL
          ) AS orphan_feedbacks,
          (
            SELECT COUNT(*)::INTEGER
            FROM ${schema}.annotated_segments segment
            LEFT JOIN ${schema}.ai_feedbacks feedback
              ON feedback.id = segment.ai_feedback_id
            WHERE feedback.id IS NULL
          ) AS orphan_annotations
      `,
      [seed.session_id, seed.question_id],
    );
    const after = afterResult.rows[0];

    if (
      !before ||
      !after ||
      before.answers !== 2 ||
      after.answers !== 1 ||
      after.feedbacks !== 1 ||
      after.annotations !== before.annotations ||
      after.follow_ups !== before.follow_ups ||
      after.orphan_feedbacks !== 0 ||
      after.orphan_annotations !== 0
    ) {
      throw new Error(
        `Migration verification failed: ${JSON.stringify({ before, after })}`,
      );
    }

    let uniqueConstraintRejectedDuplicate = false;
    try {
      await client.query(
        `
          INSERT INTO ${schema}.user_answers (
            id,
            session_id,
            question_id,
            answer_mode,
            answer_text,
            skipped,
            feedback_generated,
            created_at,
            updated_at
          )
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            'text',
            'Should violate the unique constraint',
            FALSE,
            FALSE,
            now(),
            now()
          )
        `,
        [seed.session_id, seed.question_id],
      );
    } catch (error: unknown) {
      uniqueConstraintRejectedDuplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505';
    }

    if (!uniqueConstraintRejectedDuplicate) {
      throw new Error('The unique constraint did not reject a duplicate.');
    }

    console.log(
      `Migration copy test passed in ${schemaName}: ` +
        `${before.answers}->${after.answers} answers, ` +
        `${before.feedbacks}->${after.feedbacks} feedbacks, ` +
        `${after.annotations}/${before.annotations} annotations preserved, ` +
        `${after.follow_ups}/${before.follow_ups} follow-ups preserved.`,
    );
  } finally {
    await client.query('SET search_path TO public').catch(() => undefined);
    await client
      .query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
      .catch(() => undefined);
    await client.end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Migration copy test failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
