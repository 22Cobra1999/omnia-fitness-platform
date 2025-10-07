-- db/simplify-program-details-update-rls.sql

-- 1. Eliminar la política de actualización compleja existente para fitness_program_details
DROP POLICY IF EXISTS "fitness_program_client_update_policy" ON public.fitness_program_details;

-- 2. Crear una política de actualización más simple para fitness_program_details
-- Permite a los clientes autenticados actualizar sus propios detalles de programa de fitness
CREATE POLICY "Allow authenticated clients to update their own fitness program details" ON public.fitness_program_details
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- 3. Eliminar la política de actualización compleja existente para nutrition_program_details (asumiendo una similar)
-- Si tienes una política similar para nutrition_program_details, también la simplificaremos.
-- Puedes verificar su nombre con: SELECT policyname FROM pg_policies WHERE tablename = 'nutrition_program_details';
DROP POLICY IF EXISTS "nutrition_program_client_update_policy" ON public.nutrition_program_details;

-- 4. Crear una política de actualización más simple para nutrition_program_details
-- Permite a los clientes autenticados actualizar sus propios detalles de programa de nutrición
CREATE POLICY "Allow authenticated clients to update their own nutrition program details" ON public.nutrition_program_details
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Opcional: Asegurarse de que las políticas de SELECT también sean directas si no lo son ya
-- DROP POLICY IF EXISTS "fitness_program_client_select_policy" ON public.fitness_program_details;
-- CREATE POLICY "Allow authenticated clients to view their own fitness program details" ON public.fitness_program_details
--   FOR SELECT
--   TO authenticated
--   USING (client_id = auth.uid());

-- DROP POLICY IF EXISTS "nutrition_program_client_select_policy" ON public.nutrition_program_details;
-- CREATE POLICY "Allow authenticated clients to view their own nutrition program details" ON public.nutrition_program_details
--   FOR SELECT
--   TO authenticated
--   USING (client_id = auth.uid());
