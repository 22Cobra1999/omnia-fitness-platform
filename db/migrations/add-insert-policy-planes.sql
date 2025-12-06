-- Agregar política INSERT para planes_uso_coach
-- Ejecutar este SQL si ya creaste la tabla pero falta la política INSERT

CREATE POLICY planes_uso_coach_insert_policy ON planes_uso_coach
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = coach_id
    ) OR 
    auth.role() = 'admin'
  );




































