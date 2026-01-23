-- Fix RLS policy for taller_progreso_temas to allow client inserts
-- Current error: "new row violates row-level security policy"

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can view their own workshop progress" ON taller_progreso_temas;
DROP POLICY IF EXISTS "Clients can insert their own workshop progress" ON taller_progreso_temas;
DROP POLICY IF EXISTS "Clients can update their own workshop progress" ON taller_progreso_temas;

-- Recreate with proper permissions
CREATE POLICY "Clients can view their own workshop progress"
ON taller_progreso_temas
FOR SELECT
USING (auth.uid() = cliente_id);

CREATE POLICY "Clients can insert their own workshop progress"
ON taller_progreso_temas
FOR INSERT
WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Clients can update their own workshop progress"
ON taller_progreso_temas
FOR UPDATE
USING (auth.uid() = cliente_id)
WITH CHECK (auth.uid() = cliente_id);

-- Also ensure coaches can manage their clients' progress
CREATE POLICY "Coaches can manage their clients workshop progress"
ON taller_progreso_temas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM activities a
    WHERE a.id = taller_progreso_temas.actividad_id
    AND a.coach_id = auth.uid()
  )
);
