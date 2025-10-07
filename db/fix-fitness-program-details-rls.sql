-- db/fix-fitness-program-details-rls.sql
-- Habilita RLS si no está habilitado (necesario para que las políticas funcionen)
ALTER TABLE fitness_program_details ENABLE ROW LEVEL SECURITY;

-- Opcional: Elimina políticas existentes que puedan estar causando conflicto (usar con precaución)
-- DROP POLICY IF EXISTS "Allow all users to view fitness program details" ON fitness_program_details;
-- DROP POLICY IF EXISTS "Allow coaches to manage fitness program details" ON fitness_program_details;

-- Política para permitir a los clientes actualizar sus propios detalles de programa de fitness
-- Esto es crucial para que startActivity pueda escribir la scheduled_date
CREATE POLICY "Allow clients to update their own fitness program details" ON fitness_program_details
  FOR UPDATE
  TO authenticated -- O el rol específico de tus clientes
  USING (auth.uid() = client_id);

-- Política para permitir a los clientes ver sus propios detalles de programa de fitness
CREATE POLICY "Allow clients to view their own fitness program details" ON fitness_program_details
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Política para permitir a los coaches insertar nuevos detalles de programa de fitness (si es necesario)
-- Esto es para cuando un coach crea un programa y se duplican los detalles
CREATE POLICY "Allow coaches to insert fitness program details" ON fitness_program_details
  FOR INSERT
  TO authenticated -- Asumiendo que los coaches también son 'authenticated'
  WITH CHECK (true); -- O una condición más específica si los coaches solo pueden insertar para sí mismos
