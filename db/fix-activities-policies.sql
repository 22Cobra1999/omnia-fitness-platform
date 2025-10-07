-- Crear una política que permita a todos los usuarios ver todas las actividades
CREATE POLICY "Allow all users to view all activities" ON activities
  FOR SELECT
  USING (true);

-- Crear una política que permita a los coaches ver sus propias actividades
CREATE POLICY "Allow coaches to manage their own activities" ON activities
  FOR ALL
  USING (coach_id = auth.uid());
