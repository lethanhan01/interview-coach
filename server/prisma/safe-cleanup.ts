import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

async function main() {
  const adapter = new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL']));
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- Cleaning up mock/legacy tables while preserving Users & QuestionBank ---');

    await prisma.$executeRawUnsafe(`
      -- Drop old legacy and junction tables if they exist
      DROP TABLE IF EXISTS "question_bank_criteria_new" CASCADE;
      DROP TABLE IF EXISTS "session_question_criteria_new" CASCADE;
      DROP TABLE IF EXISTS "question_bank_competencies" CASCADE;
      DROP TABLE IF EXISTS "question_bank_criteria" CASCADE;
      DROP TABLE IF EXISTS "session_question_criteria" CASCADE;
      DROP TABLE IF EXISTS "session_competencies" CASCADE;
      DROP TABLE IF EXISTS "role_level_competencies" CASCADE;
      DROP TABLE IF EXISTS "skill_competency_mappings" CASCADE;
      DROP TABLE IF EXISTS "competency_levels" CASCADE;
      DROP TABLE IF EXISTS "competency_criteria" CASCADE;
      DROP TABLE IF EXISTS "competencies" CASCADE;
      DROP TABLE IF EXISTS "competency_subcategories" CASCADE;
      DROP TABLE IF EXISTS "competency_categories" CASCADE;
      DROP TABLE IF EXISTS "rubric_criteria" CASCADE;
      DROP TABLE IF EXISTS "rubric_categories" CASCADE;
      DROP TABLE IF EXISTS "rubric_versions" CASCADE;

      -- Remove legacy foreign key on interview_sessions if present
      ALTER TABLE IF EXISTS "interview_sessions" DROP COLUMN IF EXISTS "rubric_version_id" CASCADE;
      ALTER TABLE IF EXISTS "interview_sessions" ADD COLUMN IF NOT EXISTS "sfia_version" VARCHAR(20) DEFAULT '9.0.0';
    `);

    console.log('--- Cleanup completed successfully. Ready for prisma db push ---');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
