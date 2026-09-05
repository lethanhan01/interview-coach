import 'dotenv/config';
import { Client } from 'pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

async function main() {
  const connStr = process.env.DATABASE_URL || process.env.DIRECT_URL;
  const client = new Client(buildPgConnectionConfig(connStr));
  await client.connect();

  try {
    console.log('Ensuring pg_trgm extension...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    console.log('Creating GIN Trigram index on onet.job_titles(job_title)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_onet_job_titles_trgm 
      ON onet.job_titles USING gin (job_title gin_trgm_ops);
    `);

    console.log('Creating index on onet.job_titles(onetsoc_code)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_onet_job_titles_soc 
      ON onet.job_titles (onetsoc_code);
    `);

    console.log('Creating index on onet.software_skills(onetsoc_code)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_onet_software_skills_soc 
      ON onet.software_skills (onetsoc_code);
    `);

    console.log('All O*NET indexes created/verified successfully!');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed to create O*NET indexes:', err);
  process.exit(1);
});
