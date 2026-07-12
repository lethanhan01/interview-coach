import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import {
  buildPgConnectionConfig,
  setClientDbTimeZone,
} from '../src/prisma/db-timezone';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL is required to test DB constraints.');
}

const client = new Client(buildPgConnectionConfig(connectionString));

async function main() {
  await client.connect();
  await setClientDbTimeZone(client);
  await client.query('BEGIN');

  try {
    const ids = await createFixture();

    await expectReject(
      'user_answers rejects question/session mismatch',
      `INSERT INTO user_answers (
         id, session_id, question_id, answer_mode, answer_text
       )
       VALUES ($1, $2, $3, 'text', 'valid answer text')`,
      [randomUUID(), ids.sessionA, ids.questionB],
    );

    await expectReject(
      'interview_sessions rejects invalid context_pack_id',
      `INSERT INTO interview_sessions (
         id, user_id, job_description, session_type, context_pack_id
       )
       VALUES ($1, $2, 'x', 'hr', 'APAC')`,
      [randomUUID(), ids.userA],
    );

    await expectReject(
      'interview_sessions rejects saved JD owned by another user',
      `INSERT INTO interview_sessions (
         id, user_id, saved_job_description_id, job_description,
         session_type, context_pack_id
       )
       VALUES ($1, $2, $3, 'x', 'hr', $4)`,
      [randomUUID(), ids.userA, ids.savedJdB, ids.contextPack],
    );

    await expectReject(
      'user_answers rejects invalid answer_mode',
      `INSERT INTO user_answers (
         id, session_id, question_id, answer_mode, answer_text
       )
       VALUES ($1, $2, $3, 'video', 'valid answer text')`,
      [randomUUID(), ids.sessionA, ids.questionAnswerMode],
    );

    await expectReject(
      'user_answers rejects invalid transcription_status',
      `INSERT INTO user_answers (
         id, session_id, question_id, answer_mode, answer_text, transcription_status
       )
       VALUES ($1, $2, $3, 'voice', '', 'queued')`,
      [randomUUID(), ids.sessionA, ids.questionTranscription],
    );

    await expectReject(
      'user_answers rejects negative audio metadata',
      `INSERT INTO user_answers (
         id, session_id, question_id, answer_mode, answer_text, audio_duration_seconds
       )
       VALUES ($1, $2, $3, 'voice', '', -1)`,
      [randomUUID(), ids.sessionA, ids.questionAudio],
    );

    await expectReject(
      'session_reports rejects unknown report_type',
      `INSERT INTO session_reports (
         id, session_id, report_type, version, content_json
       )
       VALUES ($1, $2, 'reverse_q_eval', 1, '{}'::jsonb)`,
      [randomUUID(), ids.sessionA],
    );

    await expectReject(
      'ai_feedbacks rejects score outside 0-100',
      `INSERT INTO ai_feedbacks (
         id, user_answer_id, overall_score, model_answer, key_takeaway, prompt_version
       )
       VALUES ($1, $2, 101, 'model', 'takeaway', 'constraint-test')`,
      [randomUUID(), ids.validAnswer],
    );

    await expectReject(
      'annotated_segments rejects invalid offsets',
      `INSERT INTO annotated_segments (
         id, ai_feedback_id, segment_text, start_index, end_index,
         highlight_level, annotation
       )
       VALUES ($1, $2, 'segment', 10, 5, 'strength', 'annotation')`,
      [randomUUID(), ids.validFeedback],
    );

    await expectReject(
      'interview_sessions rejects invalid status and range',
      `INSERT INTO interview_sessions (
         id, user_id, job_description, session_type,
         context_pack_id, status, num_questions
       )
       VALUES ($1, $2, 'x', 'hr', $3, 'ready', 2)`,
      [randomUUID(), ids.userA, ids.contextPack],
    );

    await expectReject(
      'rubric_categories rejects negative weight',
      `INSERT INTO rubric_categories (
       id, context_pack_id, category_key, label, weight, display_order
     )
       VALUES ($1, 'VN', 'technical', 'Invalid', -0.1, 3)`,
      [randomUUID()],
    );

    await expectReject(
      'rubric_categories rejects unknown category_key',
      `INSERT INTO rubric_categories (
         id, context_pack_id, category_key, label, weight, display_order
       )
       VALUES ($1, 'VN', 'culture', 'Culture', 0.1, 3)`,
      [randomUUID()],
    );

    await expectReject(
      'rubric_categories rejects negative display_order',
      `INSERT INTO rubric_categories (
         id, context_pack_id, category_key, label, weight, display_order
       )
       VALUES ($1, 'VN', 'technical', 'Technical 2', 0.1, -1)`,
      [randomUUID()],
    );

    await expectReject(
      'rubric_criteria rejects duplicate code in same category',
      `INSERT INTO rubric_criteria (
         id, rubric_category_id, code, name, weight, display_order
       )
       VALUES ($1, $2, 'D1', 'Duplicate', 0.1, 2)`,
      [randomUUID(), ids.rubricCategory],
    );

    await expectReject(
      'rubric_criteria rejects negative display_order',
      `INSERT INTO rubric_criteria (
         id, rubric_category_id, code, name, weight, display_order
       )
       VALUES ($1, $2, 'D9', 'Invalid Order', 0.1, -1)`,
      [randomUUID(), ids.rubricCategory],
    );

    await expectReject(
      'question_bank_criteria rejects duplicate criterion on same question',
      `INSERT INTO question_bank_criteria (
         question_bank_id, rubric_criterion_id
       )
       VALUES ($1, $2)`,
      [ids.questionBank, ids.rubricCriterion],
    );

    await expectReject(
      'question_bank_criteria rejects missing rubric criterion FK',
      `INSERT INTO question_bank_criteria (
         question_bank_id, rubric_criterion_id
       )
       VALUES ($1, $2)`,
      [ids.questionBank, randomUUID()],
    );

    await expectCascade(
      'session_question_criteria cascades when session question is deleted',
      ids.sessionA,
    );

    await expectSetNull(
      'session_question_criteria keeps snapshot and nulls FK when criterion is deleted',
      ids.sessionA,
      ids.rubricCategory,
    );

    console.log('DB hardening negative constraints: all rejection checks passed');
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
}

async function createFixture() {
  const contextPack = 'VN';
  const userA = randomUUID();
  const userB = randomUUID();
  const sessionA = randomUUID();
  const sessionB = randomUUID();
  const savedJdB = randomUUID();
  const questionBank = randomUUID();

  const rubricCategory = await ensureRubricCategory(contextPack);
  const rubricCriterion = await ensureRubricCriterion(
    rubricCategory,
    'D1',
    'Communication',
  );

  await client.query(
    `INSERT INTO users (id, email)
     VALUES ($1, $2), ($3, $4)`,
    [
      userA,
      `constraint-${userA}@example.test`,
      userB,
      `constraint-${userB}@example.test`,
    ],
  );

  await client.query(
    `INSERT INTO saved_job_descriptions (
       id, user_id, company_name, job_title, requirements, job_content
     )
     VALUES ($1, $2, 'Other Company', 'Engineer', 'Requirements', 'Content')`,
    [savedJdB, userB],
  );

  await client.query(
    `INSERT INTO interview_sessions (
       id, user_id, job_description, session_type, context_pack_id
     )
     VALUES
       ($1, $2, 'x', 'hr', $5),
       ($3, $4, 'x', 'hr', $5)`,
    [sessionA, userA, sessionB, userA, contextPack],
  );

  await client.query(
    `INSERT INTO question_bank (
       id, content, session_type, difficulty, context_pack_id, competency_domains
     )
     VALUES ($1, 'Constraint bank question', 'hr', 2, $2, ARRAY['D1'])`,
    [questionBank, contextPack],
  );

  await client.query(
    `INSERT INTO question_bank_criteria (
       question_bank_id, rubric_criterion_id
     )
     VALUES ($1, $2)`,
    [questionBank, rubricCriterion],
  );

  const questionB = await createQuestion(sessionB, 1);
  const questionAnswerMode = await createQuestion(sessionA, 1);
  const questionTranscription = await createQuestion(sessionA, 2);
  const questionAudio = await createQuestion(sessionA, 3);
  const questionValid = await createQuestion(sessionA, 4);

  const validAnswer = randomUUID();
  await client.query(
    `INSERT INTO user_answers (
       id, session_id, question_id, answer_mode, answer_text
     )
     VALUES ($1, $2, $3, 'text', 'valid answer text')`,
    [validAnswer, sessionA, questionValid],
  );

  const validFeedback = randomUUID();
  await client.query(
    `INSERT INTO ai_feedbacks (
       id, user_answer_id, overall_score, model_answer, key_takeaway, prompt_version
     )
     VALUES ($1, $2, 80, 'model', 'takeaway', 'constraint-test')`,
    [validFeedback, validAnswer],
  );

  return {
    contextPack,
    rubricCategory,
    userA,
    sessionA,
    sessionB,
    savedJdB,
    questionB,
    questionBank,
    questionAnswerMode,
    questionTranscription,
    questionAudio,
    validAnswer,
    validFeedback,
    rubricCriterion,
  };
}

async function ensureRubricCategory(contextPack: string): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT id
     FROM rubric_categories
     WHERE context_pack_id = $1
       AND category_key = 'behavioral'
     LIMIT 1`,
    [contextPack],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;

  const id = randomUUID();
  await client.query(
    `INSERT INTO rubric_categories (
       id, context_pack_id, category_key, label, weight, display_order
     )
     VALUES ($1, $2, 'behavioral', 'Behavioral', 1, 1)`,
    [id, contextPack],
  );
  return id;
}

async function ensureRubricCriterion(
  rubricCategory: string,
  code: string,
  name: string,
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT id
     FROM rubric_criteria
     WHERE rubric_category_id = $1
       AND code = $2
     LIMIT 1`,
    [rubricCategory, code],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;

  const id = randomUUID();
  await client.query(
    `INSERT INTO rubric_criteria (
       id, rubric_category_id, code, name, weight, display_order
     )
     VALUES ($1, $2, $3, $4, 1, 1)`,
    [id, rubricCategory, code, name],
  );
  return id;
}

async function createQuestion(sessionId: string, orderIndex: number) {
  const id = randomUUID();
  await client.query(
     `INSERT INTO session_questions (
        id, session_id, question_text, order_index,
        question_category, competency_domains, rubric_json
      )
      VALUES ($1, $2, $3, $4, 'general', ARRAY['D1'], '{}'::jsonb)`,
    [id, sessionId, `Constraint question ${orderIndex}`, orderIndex],
  );
  return id;
}

async function expectCascade(label: string, sessionId: string) {
  const questionId = await createQuestion(sessionId, 20);
  await client.query(
    `INSERT INTO session_question_criteria (
       session_question_id, context_pack_id_snapshot, criterion_code,
       criterion_name_snapshot, category_key_snapshot, weight_snapshot,
       display_order_snapshot
     )
     VALUES ($1, 'VN', 'D1', 'Communication', 'behavioral', 1, 1)`,
    [questionId],
  );

  await client.query(`DELETE FROM session_questions WHERE id = $1`, [
    questionId,
  ]);
  const result = await client.query<{ count: number }>(
    `SELECT count(*)::int AS count
     FROM session_question_criteria
     WHERE session_question_id = $1`,
    [questionId],
  );
  if (Number(result.rows[0]?.count ?? 0) !== 0) {
    throw new Error(`Expected cascade did not happen: ${label}`);
  }
  console.log(`PASS ${label}`);
}

async function expectSetNull(
  label: string,
  sessionId: string,
  rubricCategory: string,
) {
  const criterionId = randomUUID();
  const questionId = await createQuestion(sessionId, 21);
  await client.query(
    `INSERT INTO rubric_criteria (
       id, rubric_category_id, code, name, weight, display_order
     )
     VALUES ($1, $2, 'D99', 'Temporary Criterion', 0.1, 99)`,
    [criterionId, rubricCategory],
  );
  await client.query(
    `INSERT INTO session_question_criteria (
       session_question_id, rubric_criterion_id, context_pack_id_snapshot,
       criterion_code, criterion_name_snapshot, category_key_snapshot,
       weight_snapshot, display_order_snapshot
     )
     VALUES ($1, $2, 'VN', 'D99', 'Temporary Criterion', 'behavioral', 0.1, 99)`,
    [questionId, criterionId],
  );

  await client.query(`DELETE FROM rubric_criteria WHERE id = $1`, [
    criterionId,
  ]);
  const result = await client.query<{ rubric_criterion_id: string | null }>(
    `SELECT rubric_criterion_id
     FROM session_question_criteria
     WHERE session_question_id = $1
       AND criterion_code = 'D99'`,
    [questionId],
  );
  if (result.rows[0]?.rubric_criterion_id !== null) {
    throw new Error(`Expected SET NULL did not happen: ${label}`);
  }
  console.log(`PASS ${label}`);
}

async function expectReject(
  label: string,
  sql: string,
  values: unknown[],
) {
  const savepoint = `sp_${randomUUID().replace(/-/g, '')}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    await client.query(sql, values);
  } catch {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    console.log(`PASS ${label}`);
    return;
  }

  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  await client.query(`RELEASE SAVEPOINT ${savepoint}`);
  throw new Error(`Expected DB rejection did not happen: ${label}`);
}

void main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));
  await client.end().catch(() => undefined);
  process.exitCode = 1;
});
