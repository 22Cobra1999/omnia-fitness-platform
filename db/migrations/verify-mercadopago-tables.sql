-- ================================================================
-- Query de Verificación: Tablas y Campos de MercadoPago
-- Ejecutar en Supabase SQL Editor para verificar que todo esté creado
-- ================================================================

-- 1. Verificar tablas principales
SELECT 
  'TABLAS' as tipo,
  table_name as nombre,
  CASE 
    WHEN table_name = 'coach_mercadopago_credentials' THEN '✅ Tabla de credenciales de coaches'
    WHEN table_name = 'client_mercadopago_credentials' THEN '✅ Tabla de credenciales de clientes'
    WHEN table_name = 'marketplace_commission_config' THEN '✅ Tabla de configuración de comisiones'
    WHEN table_name = 'banco' THEN '✅ Tabla banco (verificar campos abajo)'
    ELSE '❓ Tabla desconocida'
  END as descripcion,
  CASE 
    WHEN table_name IN ('coach_mercadopago_credentials', 'marketplace_commission_config', 'banco') THEN '✅ EXISTE'
    WHEN table_name = 'client_mercadopago_credentials' THEN '⚠️ NO EXISTE (aún no creada)'
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
ORDER BY table_name;

-- 2. Verificar campos en tabla 'banco'
SELECT 
  'CAMPOS EN BANCO' as tipo,
  column_name as nombre,
  data_type as tipo_dato,
  CASE 
    WHEN column_name = 'marketplace_fee' THEN '✅ Comisión de OMNIA'
    WHEN column_name = 'seller_amount' THEN '✅ Monto para el coach'
    WHEN column_name = 'coach_mercadopago_user_id' THEN '✅ ID de MP del coach'
    WHEN column_name = 'coach_access_token_encrypted' THEN '✅ Token OAuth del coach (encriptado)'
    WHEN column_name = 'mercadopago_payment_id' THEN '✅ ID del pago en MP'
    WHEN column_name = 'mercadopago_preference_id' THEN '✅ ID de la preferencia'
    WHEN column_name = 'mercadopago_status' THEN '✅ Estado en MP'
    ELSE '❓ Campo desconocido'
  END as descripcion,
  '✅ EXISTE' as estado
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
ORDER BY column_name;

-- 3. Verificar campos en tabla 'coach_mercadopago_credentials'
SELECT 
  'CAMPOS EN COACH_MP_CREDENTIALS' as tipo,
  column_name as nombre,
  data_type as tipo_dato,
  CASE 
    WHEN column_name = 'coach_id' THEN '✅ ID del coach'
    WHEN column_name = 'mercadopago_user_id' THEN '✅ ID de usuario en MP'
    WHEN column_name = 'access_token_encrypted' THEN '✅ Access token encriptado'
    WHEN column_name = 'refresh_token_encrypted' THEN '✅ Refresh token encriptado'
    WHEN column_name = 'token_expires_at' THEN '✅ Fecha de expiración'
    WHEN column_name = 'oauth_authorized' THEN '✅ Estado de autorización'
    WHEN column_name = 'oauth_authorized_at' THEN '✅ Fecha de autorización'
    ELSE '❓ Campo desconocido'
  END as descripcion,
  '✅ EXISTE' as estado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'coach_mercadopago_credentials'
ORDER BY column_name;

-- 4. Verificar campos en tabla 'marketplace_commission_config'
SELECT 
  'CAMPOS EN COMMISSION_CONFIG' as tipo,
  column_name as nombre,
  data_type as tipo_dato,
  CASE 
    WHEN column_name = 'commission_type' THEN '✅ Tipo de comisión (percentage/fixed)'
    WHEN column_name = 'commission_value' THEN '✅ Valor de comisión'
    WHEN column_name = 'min_commission' THEN '✅ Comisión mínima'
    WHEN column_name = 'max_commission' THEN '✅ Comisión máxima'
    WHEN column_name = 'is_active' THEN '✅ Estado activo'
    ELSE '❓ Campo desconocido'
  END as descripcion,
  '✅ EXISTE' as estado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketplace_commission_config'
ORDER BY column_name;

-- 5. Verificar índices
SELECT 
  'INDICES' as tipo,
  indexname as nombre,
  tablename as tabla,
  '✅ EXISTE' as estado
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%mercadopago%' 
    OR indexname LIKE '%mp%'
    OR indexname LIKE '%marketplace%'
    OR (tablename = 'banco' AND indexname LIKE '%coach%')
  )
ORDER BY tablename, indexname;

-- 6. Verificar función de cálculo de comisión
SELECT 
  'FUNCIONES' as tipo,
  routine_name as nombre,
  routine_type as tipo,
  CASE 
    WHEN routine_name = 'calculate_marketplace_commission' THEN '✅ Función para calcular comisiones'
    ELSE '❓ Función desconocida'
  END as descripcion,
  '✅ EXISTE' as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'calculate_marketplace_commission';

-- 7. Verificar datos de configuración
SELECT 
  'DATOS' as tipo,
  'marketplace_commission_config' as nombre,
  COUNT(*)::text || ' registro(s)' as descripcion,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ TIENE DATOS'
    ELSE '⚠️ SIN DATOS (ejecutar migración)'
  END as estado
FROM marketplace_commission_config
WHERE is_active = true;

-- 8. Verificar RLS habilitado
SELECT 
  'RLS' as tipo,
  tablename as nombre,
  CASE 
    WHEN rowsecurity = true THEN '✅ HABILITADO'
    ELSE '⚠️ DESHABILITADO'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'coach_mercadopago_credentials',
    'client_mercadopago_credentials',
    'marketplace_commission_config'
  );

-- ================================================================
-- RESUMEN FINAL
-- ================================================================
SELECT 
  'RESUMEN' as tipo,
  'Verificación Completa' as nombre,
  'Revisa los resultados arriba' as descripcion,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('coach_mercadopago_credentials', 'marketplace_commission_config', 'banco')
    ) = 3 
    AND (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'banco' 
      AND column_name IN ('marketplace_fee', 'seller_amount', 'coach_mercadopago_user_id')
    ) >= 3
    THEN '✅ TODO OK'
    ELSE '⚠️ FALTAN TABLAS O CAMPOS'
  END as estado;





