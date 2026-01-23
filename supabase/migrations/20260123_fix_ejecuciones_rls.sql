-- Check and fix RLS policies for ejecuciones_taller

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ejecuciones_taller';

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can view their own executions" ON ejecuciones_taller;
DROP POLICY IF EXISTS "Clients can insert their own executions" ON ejecuciones_taller;
DROP POLICY IF EXISTS "Clients can update their own executions" ON ejecuciones_taller;
DROP POLICY IF EXISTS "Coaches can manage their clients executions" ON ejecuciones_taller;

-- Recreate with proper permissions
CREATE POLICY "Clients can view their own executions"
ON ejecuciones_taller
FOR SELECT
USING (auth.uid() = cliente_id);

CREATE POLICY "Clients can insert their own executions"
ON ejecuciones_taller
FOR INSERT
WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Clients can update their own executions"
ON ejecuciones_taller
FOR UPDATE
USING (auth.uid() = cliente_id)
WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Coaches can manage their clients executions"
ON ejecuciones_taller
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM activities a
    WHERE a.id = ejecuciones_taller.actividad_id
    AND a.coach_id = auth.uid()
  )
);

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ejecuciones_taller'
ORDER BY ordinal_position;
