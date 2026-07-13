import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import {
  buildPgConnectionConfig,
  setClientDbTimeZone,
} from '../src/prisma/db-timezone';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL or DIRECT_URL is required to test DB constraints.',
  );
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
         id, user_id, job_description, session_type, context_pack_id, rubric_version_id
       )
       VALUES ($1, $2, 'x', 'hr', 'APAC', $3)`,
      [randomUUID(), ids.userA, ids.rubricVersion],
    );

    await expectReject(
      'interview_sessions rejects saved JD owned by another user',
      `INSERT INTO interview_sessions (
         id, user_id, saved_job_description_id, job_description,
         session_type, context_pack_id, rubric_version_id
       )
       VALUES ($1, $2, $3, 'x', 'hr', $4, $5)`,
      [
        randomUUID(),
        ids.userA,
        ids.savedJdB,
        ids.contextPack,
        ids.rubricVersion,
      ],
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
         context_pack_id, rubric_version_id, status, num_questions
       )
       VALUES ($1, $2, 'x', 'hr', $3, $4, 'ready', 2)`,
      [randomUUID(), ids.userA, ids.contextPack, ids.rubricVersion],
    );

    await expectReject(
      'rubric_categories rejects negative weight',
      `INSERT INTO rubric_categories (
       id, rubric_version_id, category_key, label, weight, display_order
     )
       VALUES ($1, $2, 'technical', 'Invalid', -0.1, 3)`,
      [randomUUID(), ids.rubricVersion],
    );

    await expectReject(
      'rubric_categories rejects unknown category_key',
      `INSERT INTO rubric_categories (
         id, rubric_version_id, category_key, label, weight, display_order
       )
       VALUES ($1, $2, 'culture', 'Culture', 0.1, 3)`,
      [randomUUID(), ids.rubricVersion],
    );

    await expectReject(
      'rubric_categories rejects negative display_order',
      `INSERT INTO rubric_categories (
         id, rubric_version_id, category_key, label, weight, display_order
       )
       VALUES ($1, $2, 'technical', 'Technical 2', 0.1, -1)`,
      [randomUUID(), ids.rubricVersion],
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
      'rubric_criteria rejects duplicate code in same version across categories',
      `INSERT INTO rubric_criteria (
         id, rubric_category_id, code, name, weight, display_order
       )
       VALUES ($1, $2, 'D1', 'Duplicate Other Category', 0.1, 2)`,
      [randomUUID(), ids.rubricOtherCategory],
    );

    await expectAccept(
      'rubric_criteria allows same code in different rubric version',
      `INSERT INTO rubric_criteria (
         id, rubric_category_id, code, name, weight, display_order
       )
       VALUES ($1, $2, 'D1', 'Duplicate Different Version', 0.1, 2)`,
      [randomUUID(), ids.otherVersionCategory],
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

    await expectReject(
      'question_bank_criteria rejects criterion from wrong active context pack',
      `INSERT INTO question_bank_criteria (
         question_bank_id, rubric_criterion_id
       )
       VALUES ($1, $2)`,
      [ids.questionBank, ids.wrongContextCriterion],
    );

    await expectReject(
      'session_question_criteria rejects criterion outside session rubric version',
      `INSERT INTO session_question_criteria (
         session_question_id, rubric_criterion_id
       )
       VALUES ($1, $2)`,
      [ids.questionValid, ids.wrongContextCriterion],
    );

    await expectCascade(
      'session_question_criteria cascades when session question is deleted',
      ids.sessionA,
    );

    await expectRejectDelete(
      'session_question_criteria restricts deleting referenced criterion',
      ids.sessionA,
      ids.rubricCategory,
    );

    console.log(
      'DB hardening negative constraints: all rejection checks passed',
    );
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

  const rubricVersion = await ensureRubricVersion(contextPack);
  const rubricCategory = await ensureRubricCategory(
    rubricVersion,
    'behavioral',
  );
  const rubricOtherCategory = await ensureRubricCategory(
    rubricVersion,
    'technical',
  );
  const otherVersion = await createArchivedRubricVersion(contextPack);
  const otherVersionCategory = await ensureRubricCategory(
    otherVersion,
    'behavioral',
  );
  const rubricCriterion = await ensureRubricCriterion(
    rubricVersion,
    rubricCategory,
    'D1',
    'Communication',
  );
  const wrongContextVersion = await ensureRubricVersion('Western');
  const wrongContextCategory = await ensureRubricCategory(
    wrongContextVersion,
    'behavioral',
  );
  const wrongContextCriterion = await ensureRubricCriterion(
    wrongContextVersion,
    wrongContextCategory,
    'D1',
    'Wrong Context',
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
      id, user_id, job_description, session_type, context_pack_id, rubric_version_id
     )
     VALUES
       ($1, $2, 'x', 'hr', $5, $6),
       ($3, $4, 'x', 'hr', $5, $6)`,
    [sessionA, userA, sessionB, userA, contextPack, rubricVersion],
  );

  await client.query(
    `INSERT INTO question_bank (
       id, content, session_type, difficulty, context_pack_id
     )
     VALUES ($1, 'Constraint bank question', 'hr', 2, $2)`,
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
    rubricOtherCategory,
    otherVersionCategory,
    userA,
    sessionA,
    sessionB,
    savedJdB,
    questionB,
    questionBank,
    questionAnswerMode,
    questionTranscription,
    questionAudio,
    questionValid,
    validAnswer,
    validFeedback,
    rubricCriterion,
    wrongContextCriterion,
    rubricVersion,
  };
}

async function ensureRubricVersion(contextPack: string): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT id
     FROM rubric_versions
     WHERE context_pack_id = $1
       AND status = 'active'
     LIMIT 1`,
    [contextPack],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;

  const id = randomUUID();
  await client.query(
    `INSERT INTO rubric_versions (
       id, context_pack_id, version_key, status, checksum
     )
     VALUES ($1, $2, 'constraint-test', 'active', $3)`,
    [id, contextPack, `constraint-${id}`],
  );
  return id;
}

async function createArchivedRubricVersion(contextPack: string): Promise<string> {
  const id = randomUUID();
  await client.query(
    `INSERT INTO rubric_versions (
       id, context_pack_id, version_key, status, checksum
     )
     VALUES ($1, $2, $3, 'archived', $4)`,
    [id, contextPack, `constraint-${id}`, `constraint-${id}`],
  );
  return id;
}

async function ensureRubricCategory(
  rubricVersion: string,
  categoryKey = 'behavioral',
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT id
     FROM rubric_categories
     WHERE rubric_version_id = $1
       AND category_key = $2
     LIMIT 1`,
    [rubricVersion, categoryKey],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;

  const id = randomUUID();
  await client.query(
    `INSERT INTO rubric_categories (
       id, rubric_version_id, category_key, label, weight, display_order
     )
     VALUES ($1, $2, $3, $4, 1, 1)`,
    [
      id,
      rubricVersion,
      categoryKey,
      categoryKey === 'technical' ? 'Technical' : 'Behavioral',
    ],
  );
  return id;
}

async function ensureRubricCriterion(
  rubricVersion: string,
  rubricCategory: string,
  code: string,
  name: string,
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT rcr.id
     FROM rubric_criteria rcr
     JOIN rubric_categories rc
       ON rc.id = rcr.rubric_category_id
     WHERE rc.rubric_version_id = $1
       AND rcr.code = $2
     LIMIT 1`,
    [rubricVersion, code],
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
         question_category
       )
       VALUES ($1, $2, $3, $4, 'behavioral')`,
    [id, sessionId, `Constraint question ${orderIndex}`, orderIndex],
  );
  return id;
}

async function expectCascade(label: string, sessionId: string) {
  const questionId = await createQuestion(sessionId, 20);
  const criterion = await client.query<{ id: string }>(
    `SELECT rcr.id
     FROM rubric_criteria rcr
     JOIN rubric_categories rc
       ON rc.id = rcr.rubric_category_id
     JOIN interview_sessions s
       ON s.rubric_version_id = rc.rubric_version_id
     WHERE s.id = $1
       AND rcr.code = 'D1'
     LIMIT 1`,
    [sessionId],
  );
  await client.query(
    `INSERT INTO session_question_criteria (
       session_question_id, rubric_criterion_id
     )
     VALUES ($1, $2)`,
    [questionId, criterion.rows[0]?.id],
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

async function expectRejectDelete(
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
       session_question_id, rubric_criterion_id
     )
     VALUES ($1, $2)`,
    [questionId, criterionId],
  );

  await expectReject(label, `DELETE FROM rubric_criteria WHERE id = $1`, [
    criterionId,
  ]);
}

async function expectAccept(label: string, sql: string, values: unknown[]) {
  await client.query(sql, values);
  console.log(`PASS ${label}`);
}

async function expectReject(label: string, sql: string, values: unknown[]) {
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
