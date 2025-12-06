-- Migración: Tablas y campos necesarios para Split Payment de Mercado Pago
-- Ejecutar en Supabase SQL Editor
-- VERSIÓN CORREGIDA (sin dependencia de user_roles)

-- ================================================================
-- 1. Agregar campos de Split Payment a tabla banco
-- ================================================================

ALTER TABLE banco
  ADD COLUMN IF NOT EXISTS marketplace_fee NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS seller_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS coach_mercadopago_user_id TEXT,
  ADD COLUMN IF NOT EXISTS coach_access_token_encrypted TEXT; -- Token encriptado

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_banco_coach_mp_user_id ON banco(coach_mercadopago_user_id);
CREATE INDEX IF NOT EXISTS idx_banco_marketplace_fee ON banco(marketplace_fee);

-- Comentarios
COMMENT ON COLUMN banco.marketplace_fee IS 'Comisión que recibe OMNIA (marketplace)';
COMMENT ON COLUMN banco.seller_amount IS 'Monto que recibe el coach (vendedor)';
COMMENT ON COLUMN banco.coach_mercadopago_user_id IS 'ID de Mercado Pago del coach';
COMMENT ON COLUMN banco.coach_access_token_encrypted IS 'Access token OAuth del coach (encriptado)';

-- ================================================================
-- 2. Crear tabla para credenciales de Mercado Pago de coaches
-- ================================================================

CREATE TABLE IF NOT EXISTS coach_mercadopago_credentials (
  id BIGSERIAL PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mercadopago_user_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL, -- Token encriptado
  refresh_token_encrypted TEXT, -- Refresh token encriptado
  token_expires_at TIMESTAMPTZ,
  oauth_authorized BOOLEAN DEFAULT FALSE,
  oauth_authorized_at TIMESTAMPTZ,
  oauth_code TEXT, -- Código temporal de OAuth
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_coach_id ON coach_mercadopago_credentials(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_mp_user_id ON coach_mercadopago_credentials(mercadopago_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_authorized ON coach_mercadopago_credentials(oauth_authorized);

-- Comentarios
COMMENT ON TABLE coach_mercadopago_credentials IS 'Credenciales OAuth de Mercado Pago para cada coach';
COMMENT ON COLUMN coach_mercadopago_credentials.mercadopago_user_id IS 'ID de usuario de Mercado Pago del coach';
COMMENT ON COLUMN coach_mercadopago_credentials.access_token_encrypted IS 'Access token OAuth encriptado';
COMMENT ON COLUMN coach_mercadopago_credentials.oauth_authorized IS 'Indica si el coach autorizó a OMNIA mediante OAuth';

-- ================================================================
-- 3. Crear tabla para configuración de comisiones del marketplace
-- ================================================================

CREATE TABLE IF NOT EXISTS marketplace_commission_config (
  id BIGSERIAL PRIMARY KEY,
  commission_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' o 'fixed'
  commission_value NUMERIC(5,2) NOT NULL, -- Porcentaje (ej: 15.00) o monto fijo
  min_commission NUMERIC(12,2),
  max_commission NUMERIC(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar configuración por defecto (15% de comisión)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM marketplace_commission_config WHERE is_active = TRUE) THEN
    INSERT INTO marketplace_commission_config (commission_type, commission_value, is_active, description)
    VALUES ('percentage', 15.00, TRUE, 'Comisión por defecto de OMNIA: 15%');
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE marketplace_commission_config IS 'Configuración de comisiones del marketplace (OMNIA)';
COMMENT ON COLUMN marketplace_commission_config.commission_type IS 'Tipo: percentage (porcentaje) o fixed (monto fijo)';
COMMENT ON COLUMN marketplace_commission_config.commission_value IS 'Valor: porcentaje (15.00 = 15%) o monto fijo';
COMMENT ON COLUMN marketplace_commission_config.min_commission IS 'Comisión mínima (solo para porcentaje)';
COMMENT ON COLUMN marketplace_commission_config.max_commission IS 'Comisión máxima (solo para porcentaje)';

-- ================================================================
-- 4. Habilitar RLS en las nuevas tablas
-- ================================================================

ALTER TABLE coach_mercadopago_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_commission_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para coach_mercadopago_credentials
-- Los coaches solo pueden ver sus propias credenciales
DROP POLICY IF EXISTS "Coaches can view their own credentials" ON coach_mercadopago_credentials;
CREATE POLICY "Coaches can view their own credentials"
  ON coach_mercadopago_credentials
  FOR SELECT
  USING (auth.uid() = coach_id);

-- Solo el sistema puede insertar/actualizar credenciales (usar service role)
-- No crear políticas de INSERT/UPDATE para usuarios normales por seguridad

-- Políticas RLS para marketplace_commission_config
-- Permitir lectura a todos los usuarios autenticados (la configuración es pública)
-- Solo el sistema puede modificar (usar service role)
DROP POLICY IF EXISTS "Authenticated users can view commission config" ON marketplace_commission_config;
CREATE POLICY "Authenticated users can view commission config"
  ON marketplace_commission_config
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- 5. Función para calcular comisión
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_marketplace_commission(
  amount NUMERIC,
  config_id BIGINT DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  config_record marketplace_commission_config%ROWTYPE;
  commission NUMERIC;
BEGIN
  -- Obtener configuración activa
  IF config_id IS NULL THEN
    SELECT * INTO config_record
    FROM marketplace_commission_config
    WHERE is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT * INTO config_record
    FROM marketplace_commission_config
    WHERE id = config_id;
  END IF;

  -- Si no hay configuración, retornar 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calcular comisión según tipo
  IF config_record.commission_type = 'percentage' THEN
    commission := (amount * config_record.commission_value) / 100;
    
    -- Aplicar límites si existen
    IF config_record.min_commission IS NOT NULL AND commission < config_record.min_commission THEN
      commission := config_record.min_commission;
    END IF;
    
    IF config_record.max_commission IS NOT NULL AND commission > config_record.max_commission THEN
      commission := config_record.max_commission;
    END IF;
  ELSE
    -- Comisión fija
    commission := config_record.commission_value;
  END IF;

  RETURN commission;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_marketplace_commission IS 'Calcula la comisión del marketplace basado en la configuración activa';















