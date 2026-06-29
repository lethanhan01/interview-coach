-- CreateEnum
CREATE TYPE "QuestionSessionType" AS ENUM ('hr', 'technical');

-- CreateTable
CREATE TABLE "context_packs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rubric_json" JSONB NOT NULL,
    "scoring_weights" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "context_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bank" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "session_type" "QuestionSessionType" NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "context_pack_id" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "competency_domain" TEXT NOT NULL,
    "applicable_roles" TEXT[],
    "applicable_levels" TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimated_time_min" INTEGER,
    "translations" JSONB,
    "content_json" JSONB,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_bank_id" UUID NOT NULL,
    "session_id" UUID,
    "user_id" UUID NOT NULL,
    "used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'candidate',
    "status" TEXT NOT NULL DEFAULT 'active',
    "profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "full_name" TEXT,
    "target_position" TEXT,
    "target_role_category" TEXT,
    "target_level" TEXT,
    "preferred_tech_stack" TEXT,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "default_language" TEXT NOT NULL DEFAULT 'vi',
    "tts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "personality" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "file_url" TEXT,
    "original_filename" TEXT,
    "parsed_text" TEXT,
    "parsed_json" JSONB,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "parser_version" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content_json" JSONB NOT NULL,
    "generated_by_model" TEXT,
    "prompt_version" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "saved_job_description_id" UUID,
    "job_description" TEXT NOT NULL,
    "jd_source" TEXT NOT NULL,
    "jd_url" TEXT,
    "job_title" TEXT,
    "session_type" TEXT NOT NULL,
    "num_questions" INTEGER NOT NULL DEFAULT 5,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "persona" TEXT NOT NULL DEFAULT 'neutral_tech_lead',
    "mode" TEXT NOT NULL DEFAULT 'practice',
    "duration_min" INTEGER NOT NULL DEFAULT 30,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "context_pack_id" TEXT NOT NULL,
    "show_prep_card" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'generating',
    "opening_transcript" TEXT,
    "overall_score" INTEGER,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_job_descriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_website" TEXT,
    "job_title" TEXT NOT NULL,
    "headcount" TEXT,
    "location" TEXT,
    "requirements" TEXT NOT NULL,
    "job_content" TEXT NOT NULL,
    "tech_stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "benefits" TEXT,
    "salary" TEXT,
    "bonus" TEXT,
    "last_used_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_job_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_bank_id" UUID,
    "question_text" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "question_category" TEXT NOT NULL,
    "competency_domain" TEXT NOT NULL,
    "rubric_json" JSONB NOT NULL,
    "estimated_time_min" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer_mode" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "audio_file_url" TEXT,
    "audio_duration_seconds" INTEGER,
    "audio_size_bytes" INTEGER,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "voice_metrics_json" JSONB,
    "transcription_status" TEXT,
    "feedback_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_answer_id" UUID NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "model_answer" TEXT NOT NULL,
    "key_takeaway" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "dimension_scores" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotated_segments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ai_feedback_id" UUID NOT NULL,
    "segment_text" TEXT NOT NULL,
    "start_index" INTEGER NOT NULL,
    "end_index" INTEGER NOT NULL,
    "highlight_level" TEXT NOT NULL,
    "annotation" TEXT NOT NULL,
    "suggestion" TEXT,
    "improved_version" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotated_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_quality_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID,
    "job_type" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "latency_ms" INTEGER NOT NULL,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "error_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_quality_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_question_bank_context_pack" ON "question_bank"("context_pack_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_question_bank_session_type_difficulty" ON "question_bank"("session_type", "difficulty") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_question_usage_bank_used" ON "question_usage"("question_bank_id", "used_at");

-- CreateIndex
CREATE INDEX "idx_question_usage_user_used" ON "question_usage"("user_id", "used_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "resumes_user_id_active_idx" ON "resumes"("user_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "session_reports_session_id_report_type_version_key" ON "session_reports"("session_id", "report_type", "version");

-- CreateIndex
CREATE INDEX "idx_interview_sessions_created_at" ON "interview_sessions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_interview_sessions_saved_jd" ON "interview_sessions"("saved_job_description_id");

-- CreateIndex
CREATE INDEX "idx_interview_sessions_user_created" ON "interview_sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_interview_sessions_user_id" ON "interview_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_saved_job_descriptions_user_updated" ON "saved_job_descriptions"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_saved_job_descriptions_user_company_title" ON "saved_job_descriptions"("user_id", "company_name", "job_title");

-- CreateIndex
CREATE INDEX "idx_session_questions_session_id" ON "session_questions"("session_id");

-- CreateIndex
CREATE INDEX "idx_session_questions_session_id_text" ON "session_questions"("session_id", "question_text");

-- CreateIndex
CREATE UNIQUE INDEX "session_questions_session_id_order_index_key" ON "session_questions"("session_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_user_answers_question_id" ON "user_answers"("question_id");

-- CreateIndex
CREATE INDEX "idx_user_answers_session_id" ON "user_answers"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_answers_session_id_question_id_key" ON "user_answers"("session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_feedbacks_user_answer_id_key" ON "ai_feedbacks"("user_answer_id");

-- CreateIndex
CREATE INDEX "idx_ai_feedbacks_user_answer_id" ON "ai_feedbacks"("user_answer_id") WHERE (user_answer_id IS NOT NULL);

-- CreateIndex
CREATE INDEX "idx_annotated_segments_feedback_id" ON "annotated_segments"("ai_feedback_id");

-- CreateIndex
CREATE INDEX "idx_ai_quality_log_created_at" ON "ai_quality_log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ai_quality_log_job_type_created" ON "ai_quality_log"("job_type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_context_pack_id_fkey" FOREIGN KEY ("context_pack_id") REFERENCES "context_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_usage" ADD CONSTRAINT "question_usage_question_bank_id_fkey" FOREIGN KEY ("question_bank_id") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reports" ADD CONSTRAINT "session_reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_context_pack_id_fkey" FOREIGN KEY ("context_pack_id") REFERENCES "context_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_saved_job_description_id_fkey" FOREIGN KEY ("saved_job_description_id") REFERENCES "saved_job_descriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_job_descriptions" ADD CONSTRAINT "saved_job_descriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_question_bank_id_fkey" FOREIGN KEY ("question_bank_id") REFERENCES "question_bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "session_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_user_answer_id_fkey" FOREIGN KEY ("user_answer_id") REFERENCES "user_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotated_segments" ADD CONSTRAINT "annotated_segments_ai_feedback_id_fkey" FOREIGN KEY ("ai_feedback_id") REFERENCES "ai_feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
