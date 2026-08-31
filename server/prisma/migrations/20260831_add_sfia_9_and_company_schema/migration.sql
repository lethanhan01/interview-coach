-- =========================================================
-- SFIA 9 & COMPANY SCHEMA MIGRATION (ZERO DATA LOSS)
-- =========================================================

-- 1. Create competency_categories table
CREATE TABLE IF NOT EXISTS "competency_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competency_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "competency_categories_code_key" ON "competency_categories"("code");

-- 2. Create competency_subcategories table
CREATE TABLE IF NOT EXISTS "competency_subcategories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competency_subcategories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "competency_subcategories_code_key" ON "competency_subcategories"("code");
CREATE INDEX IF NOT EXISTS "idx_competency_subcategories_category_id" ON "competency_subcategories"("category_id");

-- 3. Create levels table (SFIA 9 - 7 Responsibility Levels & Generic Attributes)
CREATE TABLE IF NOT EXISTS "levels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "rank" INTEGER NOT NULL,
    "autonomy" TEXT,
    "influence" TEXT,
    "complexity" TEXT,
    "business_skills" TEXT,
    "knowledge" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "levels_code_key" ON "levels"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "levels_rank_key" ON "levels"("rank");

-- 4. Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_key" ON "roles"("code");

-- 5. Create competencies table (SFIA 9 Professional Skills)
CREATE TABLE IF NOT EXISTS "competencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rubric_version_id" UUID NOT NULL,
    "subcategory_id" UUID,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "overall_description" TEXT,
    "guidance_notes" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "competencies_rubric_version_code_key" ON "competencies"("rubric_version_id", "code");
CREATE INDEX IF NOT EXISTS "idx_competencies_rubric_version" ON "competencies"("rubric_version_id");
CREATE INDEX IF NOT EXISTS "idx_competencies_subcategory" ON "competencies"("subcategory_id");

-- 6. Create competency_criteria table (Skill Level Descriptions & Behavioral Indicators)
CREATE TABLE IF NOT EXISTS "competency_criteria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "competency_id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "level_description" TEXT NOT NULL,
    "behavioral_indicators" JSONB,
    "weight" DECIMAL(5,2),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competency_criteria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "competency_criteria_competency_level_key" ON "competency_criteria"("competency_id", "level_id");
CREATE INDEX IF NOT EXISTS "idx_competency_criteria_competency" ON "competency_criteria"("competency_id");
CREATE INDEX IF NOT EXISTS "idx_competency_criteria_level" ON "competency_criteria"("level_id");

-- 7. Create role_level_competencies table
CREATE TABLE IF NOT EXISTS "role_level_competencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "competency_id" UUID NOT NULL,
    "target_level_id" UUID NOT NULL,
    "default_weight" DECIMAL(5,2) NOT NULL,
    "priority" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_level_competencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_level_competencies_unique" ON "role_level_competencies"("role_id", "competency_id", "target_level_id");
CREATE INDEX IF NOT EXISTS "idx_role_level_competencies_role" ON "role_level_competencies"("role_id");

-- 8. Create skill_competency_mappings table
CREATE TABLE IF NOT EXISTS "skill_competency_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_name" VARCHAR NOT NULL,
    "competency_id" UUID NOT NULL,
    "relevance_weight" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_competency_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "skill_competency_mappings_skill_competency_key" ON "skill_competency_mappings"("skill_name", "competency_id");
CREATE INDEX IF NOT EXISTS "idx_skill_competency_mappings_skill_name" ON "skill_competency_mappings"("skill_name");

-- 9. Create company_profiles table
CREATE TABLE IF NOT EXISTS "company_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "website" VARCHAR,
    "description" TEXT,
    "industry" VARCHAR,
    "location" VARCHAR,
    "company_size" VARCHAR,
    "logo_url" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_company_profiles_name" ON "company_profiles"("name");

-- 10. Create session_competencies table
CREATE TABLE IF NOT EXISTS "session_competencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "competency_id" UUID NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "priority" INTEGER DEFAULT 1,
    "source" VARCHAR NOT NULL,
    "reasoning" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_competencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "session_competencies_session_competency_key" ON "session_competencies"("session_id", "competency_id");
CREATE INDEX IF NOT EXISTS "idx_session_competencies_session" ON "session_competencies"("session_id");

-- 11. Create question_bank_competencies table
CREATE TABLE IF NOT EXISTS "question_bank_competencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_bank_id" UUID NOT NULL,
    "competency_id" UUID NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bank_competencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "question_bank_competencies_unique" ON "question_bank_competencies"("question_bank_id", "competency_id");

-- 12. Create question_bank_criteria_new table
CREATE TABLE IF NOT EXISTS "question_bank_criteria_new" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_bank_id" UUID NOT NULL,
    "competency_criterion_id" UUID NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bank_criteria_new_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "question_bank_criteria_new_unique" ON "question_bank_criteria_new"("question_bank_id", "competency_criterion_id");

-- 13. Create session_question_criteria_new table
CREATE TABLE IF NOT EXISTS "session_question_criteria_new" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_question_id" UUID NOT NULL,
    "competency_criterion_id" UUID NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_question_criteria_new_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "session_question_criteria_new_unique" ON "session_question_criteria_new"("session_question_id", "competency_criterion_id");

ALTER TABLE "saved_job_descriptions" ADD COLUMN IF NOT EXISTS "company_profile_id" UUID;

ALTER TABLE "session_questions" ADD COLUMN IF NOT EXISTS "source" VARCHAR NOT NULL DEFAULT 'bank';
ALTER TABLE "session_questions" ADD COLUMN IF NOT EXISTS "question_type" VARCHAR;
ALTER TABLE "session_questions" ADD COLUMN IF NOT EXISTS "generation_model" VARCHAR;
ALTER TABLE "session_questions" ADD COLUMN IF NOT EXISTS "generation_metadata" JSONB;

-- Update context_pack_id CHECK constraints to allow 'sfia-v9'
ALTER TABLE "rubric_versions" DROP CONSTRAINT IF EXISTS "chk_rubric_versions_context_pack";
ALTER TABLE "rubric_versions" ADD CONSTRAINT "chk_rubric_versions_context_pack" CHECK (context_pack_id IN ('VN', 'Western', 'sfia-v9'));

ALTER TABLE "interview_sessions" DROP CONSTRAINT IF EXISTS "chk_interview_sessions_context_pack";
ALTER TABLE "interview_sessions" ADD CONSTRAINT "chk_interview_sessions_context_pack" CHECK (context_pack_id IN ('VN', 'Western', 'sfia-v9'));

ALTER TABLE "question_bank" DROP CONSTRAINT IF EXISTS "chk_question_bank_context_pack";
ALTER TABLE "question_bank" ADD CONSTRAINT "chk_question_bank_context_pack" CHECK (context_pack_id IN ('VN', 'Western', 'sfia-v9'));

-- 15. Foreign Key Constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competency_subcategories_category_id_fkey') THEN
        ALTER TABLE "competency_subcategories" ADD CONSTRAINT "competency_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "competency_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competencies_rubric_version_id_fkey') THEN
        ALTER TABLE "competencies" ADD CONSTRAINT "competencies_rubric_version_id_fkey" FOREIGN KEY ("rubric_version_id") REFERENCES "rubric_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competencies_subcategory_id_fkey') THEN
        ALTER TABLE "competencies" ADD CONSTRAINT "competencies_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "competency_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competency_criteria_competency_id_fkey') THEN
        ALTER TABLE "competency_criteria" ADD CONSTRAINT "competency_criteria_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competency_criteria_level_id_fkey') THEN
        ALTER TABLE "competency_criteria" ADD CONSTRAINT "competency_criteria_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_level_competencies_role_id_fkey') THEN
        ALTER TABLE "role_level_competencies" ADD CONSTRAINT "role_level_competencies_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_level_competencies_competency_id_fkey') THEN
        ALTER TABLE "role_level_competencies" ADD CONSTRAINT "role_level_competencies_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_level_competencies_target_level_id_fkey') THEN
        ALTER TABLE "role_level_competencies" ADD CONSTRAINT "role_level_competencies_target_level_id_fkey" FOREIGN KEY ("target_level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skill_competency_mappings_competency_id_fkey') THEN
        ALTER TABLE "skill_competency_mappings" ADD CONSTRAINT "skill_competency_mappings_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_job_descriptions_company_profile_id_fkey') THEN
        ALTER TABLE "saved_job_descriptions" ADD CONSTRAINT "saved_job_descriptions_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "company_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_competencies_session_id_fkey') THEN
        ALTER TABLE "session_competencies" ADD CONSTRAINT "session_competencies_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_competencies_competency_id_fkey') THEN
        ALTER TABLE "session_competencies" ADD CONSTRAINT "session_competencies_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_competencies_question_bank_id_fkey') THEN
        ALTER TABLE "question_bank_competencies" ADD CONSTRAINT "question_bank_competencies_question_bank_id_fkey" FOREIGN KEY ("question_bank_id") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_competencies_competency_id_fkey') THEN
        ALTER TABLE "question_bank_competencies" ADD CONSTRAINT "question_bank_competencies_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_criteria_new_question_bank_id_fkey') THEN
        ALTER TABLE "question_bank_criteria_new" ADD CONSTRAINT "question_bank_criteria_new_question_bank_id_fkey" FOREIGN KEY ("question_bank_id") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_criteria_new_competency_criterion_id_fkey') THEN
        ALTER TABLE "question_bank_criteria_new" ADD CONSTRAINT "question_bank_criteria_new_competency_criterion_id_fkey" FOREIGN KEY ("competency_criterion_id") REFERENCES "competency_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_question_criteria_new_session_question_id_fkey') THEN
        ALTER TABLE "session_question_criteria_new" ADD CONSTRAINT "session_question_criteria_new_session_question_id_fkey" FOREIGN KEY ("session_question_id") REFERENCES "session_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_question_criteria_new_competency_criterion_id_fkey') THEN
        ALTER TABLE "session_question_criteria_new" ADD CONSTRAINT "session_question_criteria_new_competency_criterion_id_fkey" FOREIGN KEY ("competency_criterion_id") REFERENCES "competency_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
