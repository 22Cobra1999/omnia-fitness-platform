-- Permitir que cualquier usuario autenticado pueda crear inscripciones
ALTER TABLE activity_enrollments ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan estar bloqueando inserciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver sus inscripciones" ON activity_enrollments;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear inscripciones" ON activity_enrollments;
DROP POLICY IF EXISTS "Coaches pueden ver inscripciones de sus actividades" ON activity_enrollments;

-- Crear políticas permisivas
CREATE POLICY "Usuarios autenticados pueden ver sus inscripciones"
ON activity_enrollments
FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden crear inscripciones"
ON activity_enrollments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Coaches pueden ver inscripciones de sus actividades"
ON activity_enrollments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM activities a
  WHERE a.id = activity_enrollments.activity_id
  AND a.coach_id = auth.uid()
));
