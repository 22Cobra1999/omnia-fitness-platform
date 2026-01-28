-- Migration to fix coach data visibility
-- Date: 2025-01-27

-- Enable RLS
ALTER TABLE public.ejercicios_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_program_details ENABLE ROW LEVEL SECURITY;

-- Policy for coaches to see their own exercises
DROP POLICY IF EXISTS "Coaches can manage their own exercises" ON public.ejercicios_detalles;
CREATE POLICY "Coaches can manage their own exercises"
ON public.ejercicios_detalles
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Policy for coaches to see their own nutrition details
DROP POLICY IF EXISTS "Coaches can manage their own nutrition details" ON public.nutrition_program_details;
CREATE POLICY "Coaches can manage their own nutrition details"
ON public.nutrition_program_details
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Additional SELECT policy for authenticated users if needed (e.g. clients seeing their assigned exercises)
-- This might already exist, but let's ensure it doesn't conflict
-- If a user is a client, they should see exercises assigned to them.
-- In Generic mode, activity_id is null or contains mappings.
-- For now, let's focus on the coach visibility.
