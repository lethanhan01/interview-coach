import { Client } from 'pg';

const TABLES = [
  ['public', 'users'],
  ['public', 'user_profiles'],
  ['public', 'interview_sessions'],
  ['public', 'session_questions'],
  ['public', 'user_answers'],
  ['public', 'ai_feedbacks'],
  ['public', 'annotated_segments'],
  ['public', 'session_reports'],
  ['public', 'saved_job_descriptions'],
  ['public', 'question_bank'],
  ['public', 'question_bank_criteria'],
  ['public', 'rubric_versions'],
  ['public', 'rubric_categories'],
  ['public', 'rubric_criteria'],
  ['public', 'session_question_criteria'],
  ['auth', 'users'],
  ['storage', 'objects'],
];

function normalizedConnectionString(value) {
  const url = new URL(value);
  url.searchParams.delete('pgbouncer');
  url.searchParams.delete('connection_limit');
  return url.toString();
}

async function inventory(label, connectionString) {
  const client = new Client({ connectionString: normalizedConnectionString(connectionString) });
  await client.connect();
  try {
    await client.query('BEGIN READ ONLY');
    const database = await client.query(
      'SELECT current_database() AS database, current_schema() AS schema',
    );
    const tables = [];
    for (const [schema, table] of TABLES) {
      const result = await client.query(
        `SELECT count(*)::bigint AS rows FROM "${schema}"."${table}"`,
      );
      tables.push({ schema, table, rows: Number(result.rows[0].rows) });
    }
    await client.query('ROLLBACK');
    return { label, database: database.rows[0], tables };
  } finally {
    await client.end();
  }
}

const productionUrl = process.env.PRODUCTION_DATABASE_URL ?? process.env.DIRECT_URL;
const recoveryUrl = process.env.RECOVERY_DATABASE_URL;
if (!productionUrl || !recoveryUrl) {
  console.error('Set PRODUCTION_DATABASE_URL (or DIRECT_URL) and RECOVERY_DATABASE_URL.');
  process.exit(1);
}

const result = {
  generatedAt: new Date().toISOString(),
  production: await inventory('production', productionUrl),
  recovery: await inventory('recovery', recoveryUrl),
};
console.log(JSON.stringify(result, null, 2));
