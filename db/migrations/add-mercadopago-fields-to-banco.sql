-- Migración: Agregar campos de Mercado Pago a la tabla banco
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas para Mercado Pago
ALTER TABLE banco
  ADD COLUMN IF NOT EXISTS mercadopago_payment_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS mercadopago_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_status TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_status_detail TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_payment_type_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_installments INTEGER,
  ADD COLUMN IF NOT EXISTS mercadopago_fee NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS mercadopago_net_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS mercadopago_currency_id TEXT DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS mercadopago_date_approved TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercadopago_date_created TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercadopago_date_last_updated TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercadopago_collector_id TEXT,
  ADD COLUMN IF NOT EXISTS webhook_received BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS webhook_data JSONB;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_banco_mercadopago_payment_id ON banco(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_banco_mercadopago_preference_id ON banco(mercadopago_preference_id);
CREATE INDEX IF NOT EXISTS idx_banco_mercadopago_status ON banco(mercadopago_status);
CREATE INDEX IF NOT EXISTS idx_banco_webhook_received ON banco(webhook_received);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN banco.mercadopago_payment_id IS 'ID único del pago en Mercado Pago';
COMMENT ON COLUMN banco.mercadopago_preference_id IS 'ID de la preferencia de pago creada en Mercado Pago';
COMMENT ON COLUMN banco.mercadopago_status IS 'Estado del pago en Mercado Pago: pending, approved, rejected, cancelled, refunded';
COMMENT ON COLUMN banco.mercadopago_status_detail IS 'Detalle del estado: accredited, pending_contingency, pending_review_manual, etc.';
COMMENT ON COLUMN banco.mercadopago_payment_type_id IS 'Tipo de pago: credit_card, debit_card, ticket, bank_transfer, etc.';
COMMENT ON COLUMN banco.mercadopago_installments IS 'Cantidad de cuotas del pago';
COMMENT ON COLUMN banco.mercadopago_fee IS 'Comisión cobrada por Mercado Pago';
COMMENT ON COLUMN banco.mercadopago_net_amount IS 'Monto neto recibido después de comisiones';
COMMENT ON COLUMN banco.mercadopago_currency_id IS 'Moneda del pago: ARS, USD, etc.';
COMMENT ON COLUMN banco.mercadopago_date_approved IS 'Fecha de aprobación del pago';
COMMENT ON COLUMN banco.mercadopago_date_created IS 'Fecha de creación del pago en Mercado Pago';
COMMENT ON COLUMN banco.mercadopago_date_last_updated IS 'Última fecha de actualización del pago';
COMMENT ON COLUMN banco.mercadopago_collector_id IS 'ID del vendedor/coach que recibe el pago';
COMMENT ON COLUMN banco.webhook_received IS 'Indica si se recibió el webhook de Mercado Pago';
COMMENT ON COLUMN banco.webhook_data IS 'Datos completos del webhook recibido de Mercado Pago (JSON)';









