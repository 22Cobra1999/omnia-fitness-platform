-- Verificar las políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'activity_enrollments';

-- Eliminar políticas restrictivas si existen
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar inscripciones" ON activity_enrollments;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias inscripciones" ON activity_enrollments;
DROP POLICY IF EXISTS "Coaches pueden ver inscripciones de sus actividades" ON activity_enrollments;

-- Crear políticas permisivas
CREATE POLICY "Usuarios autenticados pueden insertar inscripciones"
ON activity_enrollments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios pueden ver sus propias inscripciones"
ON activity_enrollments
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM activities a
    WHERE a.id = activity_id AND a.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches pueden ver inscripciones de sus actividades"
ON activity_enrollments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM activities a
    WHERE a.id = activity_id AND a.coach_id = auth.uid()
  )
);

-- Asegurarse de que RLS está habilitado
ALTER TABLE activity_enrollments ENABLE ROW LEVEL SECURITY;
