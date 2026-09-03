import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

async function main() {
  const adapter = new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL']));
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- Executing Safe SQL Rename Migration: Full SFIA 9 Taxonomy Standardization ---');

    await prisma.$executeRawUnsafe(`
      -- 1. Rename Tables
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'competencies') THEN
          ALTER TABLE "competencies" RENAME TO "skills";
          RAISE NOTICE 'Renamed table competencies to skills';
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'criteria') THEN
          ALTER TABLE "criteria" RENAME TO "skill_levels";
          RAISE NOTICE 'Renamed table criteria to skill_levels';
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_level_competencies') THEN
          ALTER TABLE "role_level_competencies" RENAME TO "role_skills";
          RAISE NOTICE 'Renamed table role_level_competencies to role_skills';
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_competencies') THEN
          ALTER TABLE "session_competencies" RENAME TO "session_skills";
          RAISE NOTICE 'Renamed table session_competencies to session_skills';
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'question_bank_criteria') THEN
          ALTER TABLE "question_bank_criteria" RENAME TO "question_bank_skill_levels";
          RAISE NOTICE 'Renamed table question_bank_criteria to question_bank_skill_levels';
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_question_criteria') THEN
          ALTER TABLE "session_question_criteria" RENAME TO "session_question_skill_levels";
          RAISE NOTICE 'Renamed table session_question_criteria to session_question_skill_levels';
        END IF;
      END $$;

      -- 2. Rename Columns
      DO $$
      BEGIN
        -- skill_levels: competency_id -> skill_id
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'skill_levels' AND column_name = 'competency_id'
        ) THEN
          ALTER TABLE "skill_levels" RENAME COLUMN "competency_id" TO "skill_id";
          RAISE NOTICE 'Renamed column competency_id to skill_id in skill_levels';
        END IF;

        -- role_skills: competency_id -> skill_id
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'role_skills' AND column_name = 'competency_id'
        ) THEN
          ALTER TABLE "role_skills" RENAME COLUMN "competency_id" TO "skill_id";
          RAISE NOTICE 'Renamed column competency_id to skill_id in role_skills';
        END IF;

        -- session_skills: competency_id -> skill_id
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'session_skills' AND column_name = 'competency_id'
        ) THEN
          ALTER TABLE "session_skills" RENAME COLUMN "competency_id" TO "skill_id";
          RAISE NOTICE 'Renamed column competency_id to skill_id in session_skills';
        END IF;

        -- question_bank_skill_levels: criteria_id -> skill_level_id
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'question_bank_skill_levels' AND column_name = 'criteria_id'
        ) THEN
          ALTER TABLE "question_bank_skill_levels" RENAME COLUMN "criteria_id" TO "skill_level_id";
          RAISE NOTICE 'Renamed column criteria_id to skill_level_id in question_bank_skill_levels';
        END IF;

        -- session_question_skill_levels: criteria_id -> skill_level_id
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'session_question_skill_levels' AND column_name = 'criteria_id'
        ) THEN
          ALTER TABLE "session_question_skill_levels" RENAME COLUMN "criteria_id" TO "skill_level_id";
          RAISE NOTICE 'Renamed column criteria_id to skill_level_id in session_question_skill_levels';
        END IF;
      END $$;

      -- 3. Rename Primary Keys & Constraints
      ALTER INDEX IF EXISTS "competencies_pkey" RENAME TO "skills_pkey";
      ALTER INDEX IF EXISTS "criteria_pkey" RENAME TO "skill_levels_pkey";
      ALTER INDEX IF EXISTS "role_level_competencies_pkey" RENAME TO "role_skills_pkey";
      ALTER INDEX IF EXISTS "session_competencies_pkey" RENAME TO "session_skills_pkey";
      ALTER INDEX IF EXISTS "question_bank_criteria_pkey" RENAME TO "question_bank_skill_levels_pkey";
      ALTER INDEX IF EXISTS "session_question_criteria_pkey" RENAME TO "session_question_skill_levels_pkey";

      -- 4. Rename Unique Constraints & Unique Indexes
      ALTER INDEX IF EXISTS "competencies_code_key" RENAME TO "skills_code_key";
      ALTER INDEX IF EXISTS "criteria_competency_level_key" RENAME TO "skill_levels_skill_level_key";
      ALTER INDEX IF EXISTS "criteria_code_key" RENAME TO "skill_levels_code_key";
      ALTER INDEX IF EXISTS "role_level_competencies_unique" RENAME TO "role_skills_unique";
      ALTER INDEX IF EXISTS "session_competencies_session_competency_key" RENAME TO "session_skills_session_skill_key";
      ALTER INDEX IF EXISTS "question_bank_criteria_unique" RENAME TO "question_bank_skill_levels_unique";
      ALTER INDEX IF EXISTS "session_question_criteria_unique" RENAME TO "session_question_skill_levels_unique";

      -- 5. Rename Secondary Indexes
      ALTER INDEX IF EXISTS "idx_competencies_category_code" RENAME TO "idx_skills_category_code";
      ALTER INDEX IF EXISTS "idx_competencies_subcategory_code" RENAME TO "idx_skills_subcategory_code";
      ALTER INDEX IF EXISTS "idx_criteria_competency" RENAME TO "idx_skill_levels_skill";
      ALTER INDEX IF EXISTS "idx_criteria_level" RENAME TO "idx_skill_levels_level";
      ALTER INDEX IF EXISTS "idx_role_level_competencies_role" RENAME TO "idx_role_skills_role";
      ALTER INDEX IF EXISTS "idx_session_competencies_session" RENAME TO "idx_session_skills_session";
      ALTER INDEX IF EXISTS "idx_question_bank_criteria_criteria_id" RENAME TO "idx_question_bank_skill_levels_skill_level_id";
      ALTER INDEX IF EXISTS "idx_session_question_criteria_criteria_id" RENAME TO "idx_session_question_skill_levels_skill_level_id";
    `);

    console.log('--- Safe SFIA 9 Rename Migration Completed Successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
