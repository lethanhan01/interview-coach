ALTER TABLE "interview_sessions"
ADD COLUMN "remaining_seconds" INTEGER;

ALTER TABLE "interview_sessions"
ADD CONSTRAINT "chk_interview_sessions_remaining_seconds"
CHECK ("remaining_seconds" IS NULL OR "remaining_seconds" >= 0);
