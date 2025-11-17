-- Migración: Corregir políticas RLS para coach_mercadopago_credentials
-- Ejecutar en Supabase SQL Editor si hay errores 406

-- ================================================================
-- 1. Verificar que la tabla existe
-- ================================================================

-- Si la tabla no existe, crearla
CREATE TABLE IF NOT EXISTS coach_mercadopago_credentials (
  id BIGSERIAL PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mercadopago_user_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  oauth_authorized BOOLEAN DEFAULT FALSE,
  oauth_authorized_at TIMESTAMPTZ,
  oauth_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_coach_id ON coach_mercadopago_credentials(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_mp_user_id ON coach_mercadopago_credentials(mercadopago_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_authorized ON coach_mercadopago_credentials(oauth_authorized);

-- ================================================================
-- 2. Habilitar RLS
-- ================================================================

ALTER TABLE coach_mercadopago_credentials ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 3. Eliminar políticas existentes (si existen)
-- ================================================================

DROP POLICY IF EXISTS "Coaches can view their own credentials" ON coach_mercadopago_credentials;
DROP POLICY IF EXISTS "Coaches can insert their own credentials" ON coach_mercadopago_credentials;
DROP POLICY IF EXISTS "Coaches can update their own credentials" ON coach_mercadopago_credentials;
DROP POLICY IF EXISTS "Service role can manage all credentials" ON coach_mercadopago_credentials;

-- ================================================================
-- 4. Crear políticas RLS correctas
-- ================================================================

-- SELECT: Los coaches pueden ver sus propias credenciales
CREATE POLICY "Coaches can view their own credentials"
  ON coach_mercadopago_credentials
  FOR SELECT
  USING (auth.uid() = coach_id);

-- INSERT: Los coaches pueden insertar sus propias credenciales
-- (necesario para el flujo OAuth cuando se crea el registro inicial)
CREATE POLICY "Coaches can insert their own credentials"
  ON coach_mercadopago_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- UPDATE: Los coaches pueden actualizar sus propias credenciales
-- (necesario para actualizar tokens cuando expiran)
CREATE POLICY "Coaches can update their own credentials"
  ON coach_mercadopago_credentials
  FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Política para service role (para el callback de OAuth que se ejecuta en el servidor)
-- Esta política permite que el servicio backend actualice las credenciales
CREATE POLICY "Service role can manage all credentials"
  ON coach_mercadopago_credentials
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ================================================================
-- 5. Comentarios
-- ================================================================

COMMENT ON TABLE coach_mercadopago_credentials IS 'Credenciales OAuth de Mercado Pago para cada coach';
COMMENT ON COLUMN coach_mercadopago_credentials.coach_id IS 'ID del coach (referencia a auth.users)';
COMMENT ON COLUMN coach_mercadopago_credentials.mercadopago_user_id IS 'ID de usuario de Mercado Pago del coach';
COMMENT ON COLUMN coach_mercadopago_credentials.access_token_encrypted IS 'Access token OAuth encriptado';
COMMENT ON COLUMN coach_mercadopago_credentials.oauth_authorized IS 'Indica si el coach autorizó a OMNIA mediante OAuth';

