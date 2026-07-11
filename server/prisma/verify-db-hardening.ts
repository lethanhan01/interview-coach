import 'dotenv/config';
import { Client } from 'pg';

type Phase = 'pre' | 'post';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const phase = parsePhase(process.argv);
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL is required to verify DB hardening.');
}

const client = new Client({ connectionString });

const expectedPolicies = [
  ['public', 'question_bank', 'question_bank: read all'],
  ['public', 'question_bank', 'question_bank: admin insert'],
  ['public', 'question_bank', 'question_bank: admin update'],
  ['public', 'question_bank', 'question_bank: admin delete'],
  ['public', 'users', 'users: read own'],
  ['public', 'users', 'users: update own'],
  ['public', 'users', 'users: admin read all'],
  ['public', 'users', 'users: admin update status'],
  ['public', 'user_profiles', 'user_profiles: read own'],
  ['public', 'user_profiles', 'user_profiles: insert own'],
  ['public', 'user_profiles', 'user_profiles: update own'],
  ['public', 'resumes', 'resumes: read own'],
  ['public', 'resumes', 'resumes: insert own'],
  ['public', 'resumes', 'resumes: update own'],
  ['public', 'interview_sessions', 'interview_sessions: read own'],
  ['public', 'interview_sessions', 'interview_sessions: insert own'],
  ['public', 'interview_sessions', 'interview_sessions: update own'],
  ['public', 'session_questions', 'session_questions: read own'],
  ['public', 'user_answers', 'user_answers: read own'],
  ['public', 'user_answers', 'user_answers: insert own'],
  ['public', 'saved_job_descriptions', 'saved_job_descriptions: read own'],
  ['public', 'saved_job_descriptions', 'saved_job_descriptions: insert own'],
  ['public', 'saved_job_descriptions', 'saved_job_descriptions: update own'],
  ['public', 'ai_feedbacks', 'ai_feedbacks: read own'],
  ['public', 'annotated_segments', 'annotated_segments: read own'],
  ['public', 'session_reports', 'Users can read own session reports'],
];

const expectedRlsTables = [
  'question_bank',
  'users',
  'user_profiles',
  'resumes',
  'interview_sessions',
  'session_questions',
  'user_answers',
  'saved_job_descriptions',
  'ai_feedbacks',
  'annotated_segments',
  'session_reports',
];

const expectedConstraints = [
  ['interview_sessions', 'chk_interview_sessions_session_type'],
  ['interview_sessions', 'chk_interview_sessions_status'],
  ['interview_sessions', 'chk_interview_sessions_num_questions'],
  ['interview_sessions', 'chk_interview_sessions_duration_min'],
  ['interview_sessions', 'chk_interview_sessions_overall_score'],
  ['question_bank', 'chk_question_bank_difficulty'],
  ['question_bank', 'chk_question_bank_estimated_time_min'],
  ['session_reports', 'chk_session_reports_report_type'],
  ['session_questions', 'session_questions_id_session_id_key'],
  ['user_answers', 'user_answers_session_id_question_id_key'],
  ['user_answers', 'user_answers_question_session_match_fkey'],
  ['user_answers', 'chk_user_answers_answer_mode'],
  ['user_answers', 'chk_user_answers_transcription_status'],
  ['user_answers', 'chk_user_answers_audio_duration_seconds'],
  ['user_answers', 'chk_user_answers_audio_size_bytes'],
  ['ai_feedbacks', 'chk_ai_feedbacks_overall_score'],
  ['annotated_segments', 'chk_annotated_segments_offsets'],
  ['users', 'chk_users_role'],
  ['rubric_categories', 'chk_rubric_categories_category_key'],
  ['rubric_categories', 'chk_rubric_categories_weight'],
  ['rubric_categories', 'chk_rubric_categories_display_order'],
  ['rubric_criteria', 'chk_rubric_criteria_weight'],
  ['rubric_criteria', 'chk_rubric_criteria_display_order'],
];

const expectedIndexes = [
  ['interview_sessions', 'idx_interview_sessions_user_id'],
  ['interview_sessions', 'idx_interview_sessions_created_at'],
  ['interview_sessions', 'idx_interview_sessions_user_created'],
  ['interview_sessions', 'idx_interview_sessions_saved_jd'],
  ['session_questions', 'idx_session_questions_session_id'],
  ['session_questions', 'idx_session_questions_session_id_text'],
  ['user_answers', 'idx_user_answers_session_id'],
  ['user_answers', 'idx_user_answers_question_id'],
  ['ai_feedbacks', 'idx_ai_feedbacks_user_answer_id'],
  ['annotated_segments', 'idx_annotated_segments_feedback_id'],
  ['question_bank', 'idx_question_bank_context_pack'],
  ['question_bank', 'idx_question_bank_session_type_difficulty'],
  ['saved_job_descriptions', 'idx_saved_job_descriptions_user_updated'],
  ['saved_job_descriptions', 'idx_saved_job_descriptions_user_company_title'],
  ['resumes', 'idx_resumes_one_active_per_user'],
  ['rubric_versions', 'idx_rubric_versions_context_pack'],
  ['rubric_versions', 'idx_rubric_versions_one_active_per_context_pack'],
  ['rubric_versions', 'rubric_versions_context_pack_version_key'],
  ['rubric_categories', 'idx_rubric_categories_version'],
  ['rubric_categories', 'rubric_categories_version_category_key'],
  ['rubric_criteria', 'idx_rubric_criteria_category'],
  ['rubric_criteria', 'idx_rubric_criteria_version'],
  ['rubric_criteria', 'rubric_criteria_version_code_key'],
  ['interview_sessions', 'idx_interview_sessions_rubric_version'],
];

const retiredTables = ['ai_quality_log', 'question_usage'];

const retiredColumns = [
  ['question_bank', 'competency_domain'],
  ['question_bank', 'subcategory'],
  ['question_bank', 'applicable_roles'],
  ['question_bank', 'applicable_levels'],
  ['question_bank', 'tags'],
  ['session_questions', 'competency_domain'],
  ['users', 'profile_completed'],
  ['users', 'last_login_at'],
  ['users', 'deleted_at'],
  ['user_profiles', 'years_experience'],
  ['user_profiles', 'default_language'],
  ['user_profiles', 'tts_enabled'],
  ['user_profiles', 'deleted_at'],
  ['resumes', 'file_url'],
  ['resumes', 'original_filename'],
  ['resumes', 'parsed_text'],
  ['resumes', 'language'],
  ['resumes', 'parser_version'],
  ['interview_sessions', 'jd_source'],
  ['interview_sessions', 'jd_url'],
  ['interview_sessions', 'difficulty'],
  ['interview_sessions', 'persona'],
  ['interview_sessions', 'mode'],
  ['interview_sessions', 'show_prep_card'],
  ['interview_sessions', 'opening_transcript'],
  ['context_packs', 'rubric_json'],
  ['context_packs', 'scoring_weights'],
];

async function main() {
  await client.connect();
  const results: CheckResult[] = [];

  results.push(...(await runAnomalyChecks()));

  if (phase === 'post') {
    results.push(...(await runCatalogChecks()));
  }

  printResults(results);
  await client.end();

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

async function runAnomalyChecks(): Promise<CheckResult[]> {
  const checks: Array<[string, string]> = [
    [
      'anomaly:user_answers_question_session_mismatch',
      `SELECT count(*)::int AS count
       FROM user_answers ua
       JOIN session_questions sq ON sq.id = ua.question_id
       WHERE sq.session_id <> ua.session_id`,
    ],
    [
      'anomaly:interview_sessions_saved_jd_cross_user',
      `SELECT count(*)::int AS count
       FROM interview_sessions s
       LEFT JOIN saved_job_descriptions sjd
         ON sjd.id = s.saved_job_description_id
       WHERE s.saved_job_description_id IS NOT NULL
         AND (sjd.id IS NULL OR sjd.user_id <> s.user_id)`,
    ],
    [
      'anomaly:resumes_duplicate_active_per_user',
      `SELECT count(*)::int AS count
       FROM (
         SELECT user_id
         FROM resumes
         WHERE active = true
         GROUP BY user_id
         HAVING count(*) > 1
       ) dup`,
    ],
    [
      'anomaly:invalid_interview_session_status',
      `SELECT count(*)::int AS count
       FROM interview_sessions
       WHERE status NOT IN (
         'generating', 'active', 'paused', 'canceled',
         'completing', 'completed', 'error'
       )`,
    ],
    [
      'anomaly:invalid_interview_session_ranges',
      `SELECT count(*)::int AS count
       FROM interview_sessions
       WHERE num_questions NOT BETWEEN 3 AND 45
          OR duration_min <= 0
          OR (overall_score IS NOT NULL AND overall_score NOT BETWEEN 0 AND 100)`,
    ],
    [
      'anomaly:invalid_question_bank_ranges',
      `SELECT count(*)::int AS count
       FROM question_bank
       WHERE difficulty NOT BETWEEN 1 AND 5
          OR (estimated_time_min IS NOT NULL AND estimated_time_min <= 0)`,
    ],
    [
      'anomaly:invalid_session_report_type',
      `SELECT count(*)::int AS count
       FROM session_reports
       WHERE report_type NOT IN (
         'executive_summary', 'comm_analysis', 'competency_heatmap',
         'action_plan', 'skipped_answers'
       )`,
    ],
    [
      'anomaly:invalid_user_answer_values',
      `SELECT count(*)::int AS count
       FROM user_answers
       WHERE answer_mode NOT IN ('text', 'voice')
          OR (
            transcription_status IS NOT NULL
            AND transcription_status NOT IN ('pending', 'done', 'failed')
          )
          OR (audio_duration_seconds IS NOT NULL AND audio_duration_seconds < 0)
          OR (audio_size_bytes IS NOT NULL AND audio_size_bytes < 0)`,
    ],
    [
      'anomaly:invalid_ai_feedback_score',
      `SELECT count(*)::int AS count
       FROM ai_feedbacks
       WHERE overall_score NOT BETWEEN 0 AND 100`,
    ],
    [
      'anomaly:invalid_annotated_segment_offsets',
      `SELECT count(*)::int AS count
       FROM annotated_segments
       WHERE start_index < 0
          OR end_index < start_index`,
    ],
  ];

  if (await rubricTablesExist()) {
    checks.push(
      [
        'anomaly:rubric_duplicate_active_version',
        `SELECT count(*)::int AS count
         FROM (
           SELECT context_pack_id
           FROM rubric_versions
           WHERE status = 'active'
           GROUP BY context_pack_id
           HAVING count(*) > 1
         ) dup`,
      ],
      [
        'anomaly:rubric_active_version_missing_categories',
        `SELECT count(*)::int AS count
         FROM rubric_versions rv
         WHERE rv.status = 'active'
           AND (
             SELECT count(*)
             FROM rubric_categories rc
             WHERE rc.rubric_version_id = rv.id
               AND rc.category_key IN ('behavioral', 'technical')
           ) <> 2`,
      ],
      [
        'anomaly:rubric_active_version_missing_criteria',
        `SELECT count(*)::int AS count
         FROM rubric_versions rv
         WHERE rv.status = 'active'
           AND NOT EXISTS (
             SELECT 1
             FROM rubric_criteria rcr
             WHERE rcr.rubric_version_id = rv.id
               AND rcr.active = true
           )`,
      ],
      [
        'anomaly:question_bank_unknown_competency_domains',
        `SELECT count(*)::int AS count
         FROM question_bank qb
         JOIN rubric_versions rv
           ON rv.context_pack_id = qb.context_pack_id
          AND rv.status = 'active'
         WHERE qb.deleted_at IS NULL
           AND EXISTS (
             SELECT 1
             FROM unnest(qb.competency_domains) AS domain(code)
             WHERE NOT EXISTS (
               SELECT 1
               FROM rubric_criteria rcr
               WHERE rcr.rubric_version_id = rv.id
                 AND rcr.code = domain.code
                 AND rcr.active = true
             )
           )`,
      ],
    );
  }

  const results: CheckResult[] = [];
  for (const [name, sql] of checks) {
    const count = await countRows(sql);
    results.push({
      name,
      ok: count === 0,
      detail: `count=${count}`,
    });
  }
  return results;
}

async function rubricTablesExist(): Promise<boolean> {
  return existsBySql(`
    SELECT 1
    WHERE to_regclass('public.rubric_versions') IS NOT NULL
      AND to_regclass('public.rubric_categories') IS NOT NULL
      AND to_regclass('public.rubric_criteria') IS NOT NULL
  `);
}

async function runCatalogChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const table of expectedRlsTables) {
    const exists = await existsBySql(
      `SELECT 1
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = $1
         AND c.relrowsecurity = true`,
      [table],
    );
    results.push({
      name: `rls:${table}`,
      ok: exists,
      detail: exists ? 'enabled' : 'missing',
    });
  }

  for (const [schema, table, policy] of expectedPolicies) {
    const exists = await existsBySql(
      `SELECT 1
       FROM pg_policies
       WHERE schemaname = $1
         AND tablename = $2
         AND policyname = $3`,
      [schema, table, policy],
    );
    results.push({
      name: `policy:${table}:${policy}`,
      ok: exists,
      detail: exists ? 'present' : 'missing',
    });
  }

  for (const [table, constraint] of expectedConstraints) {
    const exists = await existsBySql(
      `SELECT 1
       FROM pg_constraint
       JOIN pg_class c ON c.oid = pg_constraint.conrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = $1
         AND conname = $2`,
      [table, constraint],
    );
    results.push({
      name: `constraint:${table}:${constraint}`,
      ok: exists,
      detail: exists ? 'present' : 'missing',
    });
  }

  for (const [table, index] of expectedIndexes) {
    const exists = await existsBySql(
      `SELECT 1
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND tablename = $1
         AND indexname = $2`,
      [table, index],
    );
    results.push({
      name: `index:${table}:${index}`,
      ok: exists,
      detail: exists ? 'present' : 'missing',
    });
  }

  for (const table of retiredTables) {
    const exists = await existsBySql(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = $1`,
      [table],
    );
    results.push({
      name: `retired_table_absent:${table}`,
      ok: !exists,
      detail: exists ? 'present' : 'absent',
    });
  }

  for (const [table, column] of retiredColumns) {
    const exists = await existsBySql(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2`,
      [table, column],
    );
    results.push({
      name: `retired_column_absent:${table}.${column}`,
      ok: !exists,
      detail: exists ? 'present' : 'absent',
    });
  }

  const savedJdTrigger = await existsBySql(
    `SELECT 1
     FROM pg_trigger
     WHERE tgname = 'trg_interview_sessions_saved_jd_owner'
       AND tgrelid = 'public.interview_sessions'::regclass
       AND NOT tgisinternal`,
  );
  results.push({
    name: 'trigger:interview_sessions:trg_interview_sessions_saved_jd_owner',
    ok: savedJdTrigger,
    detail: savedJdTrigger ? 'present' : 'missing',
  });

  const authUsersExists = await existsBySql(`SELECT to_regclass('auth.users')`);
  if (authUsersExists) {
    const authTrigger = await existsBySql(
      `SELECT 1
       FROM pg_trigger
       WHERE tgname = 'on_auth_user_created'
         AND tgrelid = 'auth.users'::regclass
         AND NOT tgisinternal`,
    );
    results.push({
      name: 'trigger:auth.users:on_auth_user_created',
      ok: authTrigger,
      detail: authTrigger ? 'present' : 'missing',
    });
  }

  return results;
}

async function countRows(sql: string): Promise<number> {
  const result = await client.query<{ count: number }>(sql);
  return Number(result.rows[0]?.count ?? 0);
}

async function existsBySql(sql: string, values: unknown[] = []): Promise<boolean> {
  const result = await client.query(sql, values);
  if (result.rowCount === 0) return false;
  const first = result.rows[0] as Record<string, unknown>;
  const value = Object.values(first)[0];
  return value !== null && value !== undefined;
}

function printResults(results: CheckResult[]) {
  const failed = results.filter((result) => !result.ok);
  console.log(`DB hardening verify (${phase}): ${results.length - failed.length}/${results.length} passed`);
  for (const result of results) {
    const marker = result.ok ? 'PASS' : 'FAIL';
    console.log(`${marker} ${result.name} ${result.detail}`);
  }
}

function parsePhase(argv: string[]): Phase {
  const phaseArg = argv.find((arg) => arg.startsWith('--phase='));
  const value = phaseArg?.split('=')[1] ?? 'post';
  if (value === 'pre' || value === 'post') return value;
  throw new Error(`Unsupported phase "${value}". Use --phase=pre or --phase=post.`);
}

void main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));
  await client.end().catch(() => undefined);
  process.exitCode = 1;
});
