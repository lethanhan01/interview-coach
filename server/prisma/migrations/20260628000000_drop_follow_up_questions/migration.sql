-- DropForeignKey
ALTER TABLE "follow_up_questions" DROP CONSTRAINT "follow_up_questions_user_answer_id_fkey";

-- DropTable
DROP TABLE "follow_up_questions";
