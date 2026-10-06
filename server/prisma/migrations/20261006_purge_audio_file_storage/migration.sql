-- AlterTable: Purge audio storage and transcription status fields from user_answers
ALTER TABLE "user_answers" 
  DROP COLUMN IF EXISTS "audio_file_url",
  DROP COLUMN IF EXISTS "audio_size_bytes",
  DROP COLUMN IF EXISTS "transcription_status";
