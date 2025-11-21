-- Corregir políticas RLS para planes_uso_coach
-- El id de coaches es el mismo que auth.uid(), así que podemos verificar directamente

-- Eliminar políticas existentes
DROP POLICY IF EXISTS planes_uso_coach_select_policy ON planes_uso_coach;
DROP POLICY IF EXISTS planes_uso_coach_insert_policy ON planes_uso_coach;
DROP POLICY IF EXISTS planes_uso_coach_update_policy ON planes_uso_coach;

-- Política: Los coaches pueden ver su propio plan
-- Verificamos directamente que auth.uid() = coach_id (ya que id de coaches = user_id)
CREATE POLICY planes_uso_coach_select_policy ON planes_uso_coach
  FOR SELECT USING (
    auth.uid() = coach_id OR 
    auth.role() = 'admin'
  );

-- Política: Los coaches pueden insertar su propio plan
CREATE POLICY planes_uso_coach_insert_policy ON planes_uso_coach
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id OR 
    auth.role() = 'admin'
  );

-- Política: Los coaches pueden actualizar su propio plan
CREATE POLICY planes_uso_coach_update_policy ON planes_uso_coach
  FOR UPDATE USING (
    auth.uid() = coach_id OR 
    auth.role() = 'admin'
  );






























