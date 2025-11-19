-- Script de verificación: Verificar que todo esté configurado para webhooks
-- Ejecutar en Supabase SQL Editor para verificar la configuración

-- 1. Verificar estructura de tabla banco
SELECT 
  'BANCO - Estructura' as verificacion,
  column_name as columna,
  data_type as tipo,
  is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'banco'
  AND column_name IN (
    'enrollment_id',
    'activity_id',
    'client_id',
    'mercadopago_payment_id',
    'mercadopago_preference_id',
    'mercadopago_status',
    'marketplace_fee',
    'seller_amount',
    'payment_status'
  )
ORDER BY column_name;

-- 2. Verificar que enrollment_id es nullable
SELECT 
  'BANCO - enrollment_id nullable' as verificacion,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ Correcto (nullable)'
    ELSE '❌ ERROR: Debe ser nullable'
  END as estado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'banco'
  AND column_name = 'enrollment_id';

-- 3. Verificar que activity_id y client_id existen
SELECT 
  'BANCO - activity_id y client_id' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'banco' 
      AND column_name = 'activity_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'banco' 
      AND column_name = 'client_id'
    ) THEN '✅ Ambas columnas existen'
    ELSE '❌ ERROR: Faltan columnas'
  END as estado;

-- 4. Verificar tabla coach_mercadopago_credentials
SELECT 
  'COACH_MP_CREDENTIALS - Existe' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'coach_mercadopago_credentials'
    ) THEN '✅ Tabla existe'
    ELSE '❌ ERROR: Tabla no existe'
  END as estado;

-- 5. Verificar coaches conectados
SELECT 
  'COACHES CONECTADOS' as verificacion,
  COUNT(*) as total,
  COUNT(CASE WHEN oauth_authorized = true THEN 1 END) as autorizados
FROM coach_mercadopago_credentials;

-- 6. Verificar registros en banco sin enrollment_id (pendientes)
SELECT 
  'BANCO - Registros pendientes' as verificacion,
  COUNT(*) as total_pendientes,
  COUNT(CASE WHEN enrollment_id IS NULL AND activity_id IS NOT NULL THEN 1 END) as listos_para_enrollment
FROM banco
WHERE payment_status = 'pending'
  AND mercadopago_preference_id IS NOT NULL;

-- 7. Verificar registros completados
SELECT 
  'BANCO - Registros completados' as verificacion,
  COUNT(*) as total_completados,
  COUNT(CASE WHEN enrollment_id IS NOT NULL THEN 1 END) as con_enrollment
FROM banco
WHERE payment_status = 'completed'
  OR mercadopago_status = 'approved';

-- 8. Resumen final
SELECT 
  'RESUMEN' as verificacion,
  'Verifica que todas las verificaciones anteriores muestren ✅' as instruccion;

