-- AlterTable: add transcription_status column to user_answers
ALTER TABLE "user_answers" ADD COLUMN IF NOT EXISTS "transcription_status" TEXT;
