import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment.');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('1. Dropping dimension_scores from ai_feedbacks...');
    await prisma.$executeRawUnsafe(`ALTER TABLE public.ai_feedbacks DROP COLUMN IF EXISTS dimension_scores;`);
    console.log('   ✔ Successfully dropped dimension_scores from public.ai_feedbacks.');

    console.log('2. Updating check constraint chk_session_reports_report_type...');
    await prisma.$executeRawUnsafe(`ALTER TABLE public.session_reports DROP CONSTRAINT IF EXISTS chk_session_reports_report_type;`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.session_reports 
      ADD CONSTRAINT chk_session_reports_report_type 
      CHECK (report_type IN (
        'executive_summary',
        'comm_analysis',
        'competency_heatmap',
        'action_plan',
        'skipped_answers',
        'session_competency_evaluation'
      ));
    `);
    console.log('   ✔ Successfully updated chk_session_reports_report_type.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
