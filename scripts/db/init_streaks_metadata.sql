-- Add tracking columns for streaks
ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS last_streak_date DATE;
ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;

-- Initial data update - Simple approach: Mark current streaks as 1 if today or yesterday has completed activities
-- This is a one-time setup script
UPDATE public.activity_enrollments ae
SET 
  current_streak = 1,
  last_streak_date = sub.last_date
FROM (
  SELECT enrollment_id, MAX(fecha) as last_date
  FROM public.progreso_cliente
  WHERE (ejercicios_pendientes = '{}' OR ejercicios_pendientes IS NULL)
  GROUP BY enrollment_id
) sub
WHERE ae.id = sub.enrollment_id 
AND ae.current_streak = 0
AND (sub.last_date = CURRENT_DATE OR sub.last_date = CURRENT_DATE - 1);
