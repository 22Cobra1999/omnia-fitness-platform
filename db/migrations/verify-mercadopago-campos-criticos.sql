-- ================================================================
-- VERIFICACIÓN DE CAMPOS CRÍTICOS: MercadoPago
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- 1. Verificar campos CRÍTICOS en tabla 'banco'
SELECT 
  'BANCO - Campos Críticos' as seccion,
  column_name as campo,
  data_type as tipo,
  CASE 
    WHEN column_name = 'marketplace_fee' THEN '✅ Comisión de OMNIA'
    WHEN column_name = 'seller_amount' THEN '✅ Monto para el coach'
    WHEN column_name = 'coach_mercadopago_user_id' THEN '✅ ID de MP del coach'
    WHEN column_name = 'coach_access_token_encrypted' THEN '✅ Token OAuth del coach'
    WHEN column_name = 'mercadopago_payment_id' THEN '✅ ID del pago en MP'
    WHEN column_name = 'mercadopago_preference_id' THEN '✅ ID de la preferencia'
    WHEN column_name = 'mercadopago_status' THEN '✅ Estado del pago'
    ELSE '❓ Campo adicional'
  END as descripcion,
  CASE 
    WHEN column_name IN ('marketplace_fee', 'seller_amount', 'coach_mercadopago_user_id', 'mercadopago_payment_id', 'mercadopago_status') 
    THEN '🔴 CRÍTICO'
    ELSE '🟡 IMPORTANTE'
  END as prioridad
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
    WHEN column_name IN ('coach_mercadopago_user_id', 'mercadopago_status') THEN 2
    ELSE 3
  END;

-- 2. Verificar campos CRÍTICOS en 'coach_mercadopago_credentials'
SELECT 
  'COACH_MP_CREDENTIALS - Campos Críticos' as seccion,
  column_name as campo,
  data_type as tipo,
  CASE 
    WHEN column_name = 'coach_id' THEN '✅ ID del coach'
    WHEN column_name = 'mercadopago_user_id' THEN '✅ ID de usuario en MP'
    WHEN column_name = 'access_token_encrypted' THEN '✅ Access token encriptado'
    WHEN column_name = 'refresh_token_encrypted' THEN '✅ Refresh token encriptado'
    WHEN column_name = 'oauth_authorized' THEN '✅ Estado de autorización'
    WHEN column_name = 'token_expires_at' THEN '✅ Fecha de expiración'
    ELSE '❓ Campo adicional'
  END as descripcion,
  CASE 
    WHEN column_name IN ('coach_id', 'mercadopago_user_id', 'access_token_encrypted', 'oauth_authorized') 
    THEN '🔴 CRÍTICO'
    ELSE '🟡 IMPORTANTE'
  END as prioridad
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'coach_mercadopago_credentials'
  AND column_name IN (
    'coach_id',
    'mercadopago_user_id',
    'access_token_encrypted',
    'refresh_token_encrypted',
    'oauth_authorized',
    'token_expires_at'
  )
ORDER BY 
  CASE 
    WHEN column_name IN ('coach_id', 'mercadopago_user_id', 'access_token_encrypted', 'oauth_authorized') THEN 1
    ELSE 2
  END;

-- 3. RESUMEN: Verificar que TODOS los campos críticos existan
SELECT 
  'RESUMEN' as seccion,
  CASE 
    WHEN (
      -- Verificar campos críticos en banco
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'banco' 
      AND column_name IN ('marketplace_fee', 'seller_amount', 'mercadopago_payment_id', 'mercadopago_status')
    ) = 4
    AND (
      -- Verificar campos críticos en coach_mercadopago_credentials
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'coach_mercadopago_credentials' 
      AND column_name IN ('coach_id', 'mercadopago_user_id', 'access_token_encrypted', 'oauth_authorized')
    ) = 4
    THEN '✅ TODOS LOS CAMPOS CRÍTICOS EXISTEN'
    ELSE '⚠️ FALTAN CAMPOS CRÍTICOS'
  END as estado,
  (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'banco' 
    AND column_name IN ('marketplace_fee', 'seller_amount', 'mercadopago_payment_id', 'mercadopago_status')
  )::text || ' de 4 campos críticos en banco' as detalle_banco,
  (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coach_mercadopago_credentials' 
    AND column_name IN ('coach_id', 'mercadopago_user_id', 'access_token_encrypted', 'oauth_authorized')
  )::text || ' de 4 campos críticos en coach_mercadopago_credentials' as detalle_coach;








