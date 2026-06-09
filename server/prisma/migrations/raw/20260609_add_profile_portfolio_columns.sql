-- Keep the persisted user_profiles table aligned with the Prisma model.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS technical_skills JSONB,
  ADD COLUMN IF NOT EXISTS certifications JSONB,
  ADD COLUMN IF NOT EXISTS awards JSONB;
