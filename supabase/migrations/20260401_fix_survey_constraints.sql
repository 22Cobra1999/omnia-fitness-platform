-- ==============================================================================
-- MIGRATION: FIX SURVEY CONSTRAINTS & COLUMNS
-- Ensures survey submission works for multiple enrollments of same activity.
-- ==============================================================================

-- 1. DROP OLD CONSTRAINTS THAT CAUSE COLLISIONS
ALTER TABLE public.activity_surveys 
DROP CONSTRAINT IF EXISTS activity_surveys_activity_id_client_id_null_version_key;

-- 2. ADD DEFINITIVE UNIQUE CONSTRAINT PER ENROLLMENT
-- This allows a user to rate the same activity multiple times if they have different enrollments (e.g. they renewed)
-- If enrollment_id is null (unlikely but possible), it might need a fallback, but for now we focus on enrollments.
ALTER TABLE public.activity_surveys
DROP CONSTRAINT IF EXISTS activity_surveys_client_id_enrollment_id_key;

ALTER TABLE public.activity_surveys
ADD CONSTRAINT activity_surveys_client_id_enrollment_id_key UNIQUE (client_id, enrollment_id);

-- 3. ENSURE COLUMNS EXIST (Just in case they were added manually but not via migration)
ALTER TABLE public.activity_surveys
ADD COLUMN IF NOT EXISTS would_repeat BOOLEAN,
ADD COLUMN IF NOT EXISTS calificacion_omnia INT,
ADD COLUMN IF NOT EXISTS comentarios_omnia TEXT;
