import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

async function main() {
  const adapter = new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL']));
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- Executing Safe SQL Rename Migration: competency_levels -> criteria ---');

    await prisma.$executeRawUnsafe(`
      -- 1. Rename table competency_levels to criteria
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'competency_levels') THEN
          ALTER TABLE "competency_levels" RENAME TO "criteria";
          RAISE NOTICE 'Renamed table competency_levels to criteria';
        END IF;
      END $$;

      -- 2. Rename foreign key columns
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'question_bank_criteria' AND column_name = 'competency_level_id'
        ) THEN
          ALTER TABLE "question_bank_criteria" RENAME COLUMN "competency_level_id" TO "criteria_id";
          RAISE NOTICE 'Renamed column competency_level_id to criteria_id in question_bank_criteria';
        END IF;

        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'session_question_criteria' AND column_name = 'competency_level_id'
        ) THEN
          ALTER TABLE "session_question_criteria" RENAME COLUMN "competency_level_id" TO "criteria_id";
          RAISE NOTICE 'Renamed column competency_level_id to criteria_id in session_question_criteria';
        END IF;
      END $$;

      -- 3. Rename Constraints & Indexes
      ALTER INDEX IF EXISTS "competency_levels_pkey" RENAME TO "criteria_pkey";
      ALTER INDEX IF EXISTS "competency_levels_competency_level_key" RENAME TO "criteria_competency_level_key";
      ALTER INDEX IF EXISTS "competency_levels_code_key" RENAME TO "criteria_code_key";
      ALTER INDEX IF EXISTS "idx_competency_levels_competency" RENAME TO "idx_criteria_competency";
      ALTER INDEX IF EXISTS "idx_competency_levels_level" RENAME TO "idx_criteria_level";
      ALTER INDEX IF EXISTS "idx_question_bank_criteria_level_id" RENAME TO "idx_question_bank_criteria_criteria_id";
      ALTER INDEX IF EXISTS "idx_session_question_criteria_level_id" RENAME TO "idx_session_question_criteria_criteria_id";
    `);

    console.log('--- Safe SQL Rename Migration Completed Successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
