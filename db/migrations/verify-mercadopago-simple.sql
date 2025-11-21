-- ================================================================
-- VERIFICACIÓN SIMPLE: Tablas y Campos de MercadoPago
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- Verificación rápida de tablas
SELECT 
  'TABLA' as tipo,
  table_name as nombre,
  CASE 
    WHEN table_name = 'coach_mercadopago_credentials' THEN '✅ Credenciales de coaches'
    WHEN table_name = 'client_mercadopago_credentials' THEN '⚠️ Credenciales de clientes (aún no creada)'
    WHEN table_name = 'marketplace_commission_config' THEN '✅ Configuración de comisiones'
    WHEN table_name = 'banco' THEN '✅ Tabla banco'
    ELSE '❓'
  END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'coach_mercadopago_credentials',
    'client_mercadopago_credentials',
    'marketplace_commission_config',
    'banco'
  )
ORDER BY 
  CASE 
    WHEN table_name = 'banco' THEN 1
    WHEN table_name = 'coach_mercadopago_credentials' THEN 2
    WHEN table_name = 'marketplace_commission_config' THEN 3
    WHEN table_name = 'client_mercadopago_credentials' THEN 4
  END;

-- Verificación de campos críticos en 'banco'
SELECT 
  'CAMPO EN BANCO' as tipo,
  column_name as nombre,
  CASE 
    WHEN column_name IN ('marketplace_fee', 'seller_amount', 'coach_mercadopago_user_id', 'mercadopago_payment_id', 'mercadopago_status') 
    THEN '✅ CRÍTICO'
    ELSE '✅ OPCIONAL'
  END as importancia
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'banco'
  AND column_name IN (
    'marketplace_fee',
    'seller_amount',
    'coach_mercadopago_user_id',
    'coach_access_token_encrypted',
    'mercadopago_payment_id',
    'mercadopago_preference_id',
    'mercadopago_status'
  )
ORDER BY 
  CASE 
    WHEN column_name IN ('marketplace_fee', 'seller_amount', 'mercadopago_payment_id') THEN 1
    ELSE 2
  END;

-- Verificación de campos en 'coach_mercadopago_credentials'
SELECT 
  'CAMPO EN COACH_MP' as tipo,
  column_name as nombre,
  '✅' as estado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'coach_mercadopago_credentials'
  AND column_name IN (
    'coach_id',
    'mercadopago_user_id',
    'access_token_encrypted',
    'oauth_authorized'
  )
ORDER BY column_name;

-- Verificar si hay datos de configuración
SELECT 
  'DATOS' as tipo,
  'Comisión configurada' as nombre,
  commission_value::text || '%' as valor,
  CASE WHEN is_active THEN '✅ ACTIVA' ELSE '⚠️ INACTIVA' END as estado
FROM marketplace_commission_config
WHERE is_active = true
LIMIT 1;

-- Verificar función de cálculo
SELECT 
  'FUNCIÓN' as tipo,
  routine_name as nombre,
  '✅ EXISTE' as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'calculate_marketplace_commission';








