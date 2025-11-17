ALTER TABLE public.coach_availability
ADD COLUMN IF NOT EXISTS available_days TEXT[],
ADD COLUMN IF NOT EXISTS available_hours TEXT[],
ADD COLUMN IF NOT EXISTS videocall_duration INTEGER;
