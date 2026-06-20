-- DropTable
DROP TABLE IF EXISTS "reverse_questions";

-- AlterTable
ALTER TABLE "interview_sessions" DROP COLUMN IF EXISTS "reverse_q_eval_json";
