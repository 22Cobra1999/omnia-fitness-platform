-- Verificar si la tabla coach_plans existe
CREATE TABLE IF NOT EXISTS coach_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurarse de que la tabla coaches tenga los campos necesarios
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS specialty VARCHAR(50),
ADD COLUMN IF NOT EXISTS specialty_detail VARCHAR(100),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Crear políticas de seguridad para coach_plans
ALTER TABLE coach_plans ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY coach_plans_select_policy ON coach_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción solo a administradores y al propio coach
CREATE POLICY coach_plans_insert_policy ON coach_plans
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = coach_id
    ) OR 
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Política para permitir actualización solo a administradores y al propio coach
CREATE POLICY coach_plans_update_policy ON coach_plans
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = coach_id
    ) OR 
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Política para permitir eliminación solo a administradores y al propio coach
CREATE POLICY coach_plans_delete_policy ON coach_plans
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = coach_id
    ) OR 
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );
