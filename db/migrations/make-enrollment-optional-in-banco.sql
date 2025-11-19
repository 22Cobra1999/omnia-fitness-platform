-- Migración: Hacer enrollment_id opcional y agregar activity_id y client_id a banco
-- Esto permite crear el enrollment solo cuando el pago sea exitoso

-- 1. Hacer enrollment_id nullable
ALTER TABLE banco
  ALTER COLUMN enrollment_id DROP NOT NULL;

-- 2. Agregar activity_id y client_id para poder crear el enrollment después
ALTER TABLE banco
  ADD COLUMN IF NOT EXISTS activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_banco_activity_id ON banco(activity_id);
CREATE INDEX IF NOT EXISTS idx_banco_client_id ON banco(client_id);
CREATE INDEX IF NOT EXISTS idx_banco_activity_client ON banco(activity_id, client_id);

-- 4. Comentarios
COMMENT ON COLUMN banco.enrollment_id IS 'ID del enrollment (se crea cuando el pago es aprobado)';
COMMENT ON COLUMN banco.activity_id IS 'ID de la actividad que se está comprando';
COMMENT ON COLUMN banco.client_id IS 'ID del cliente que está comprando';

