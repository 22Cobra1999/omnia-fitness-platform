-- Script para verificar y corregir una fila específica en planes_uso_coach
-- Reemplaza '3e934fbf-e54b-4edd-a929-103682bf9e25' con el ID del plan que quieres verificar

-- 1. Verificar el estado actual de la fila
SELECT 
  id,
  coach_id,
  plan_type,
  storage_limit_gb,
  storage_used_gb,
  storage_available_gb,
  status,
  started_at,
  expires_at,
  created_at,
  updated_at,
  renewal_count,
  mercadopago_subscription_id,
  -- Verificaciones
  CASE 
    WHEN started_at IS NULL THEN '❌ started_at NULL'
    WHEN expires_at IS NULL THEN '❌ expires_at NULL'
    WHEN started_at IS NOT NULL AND expires_at IS NOT NULL 
         AND expires_at != (started_at + INTERVAL '31 days') THEN '⚠️ expires_at no es started_at + 31 días'
    WHEN renewal_count IS NULL THEN '❌ renewal_count NULL'
    WHEN storage_limit_gb IS NULL THEN '❌ storage_limit_gb NULL'
    WHEN storage_used_gb IS NULL THEN '❌ storage_used_gb NULL'
    WHEN status IS NULL THEN '❌ status NULL'
    ELSE '✅ Todos los campos tienen valores válidos'
  END as estado_verificacion,
  -- Calcular expires_at esperado
  CASE 
    WHEN started_at IS NOT NULL THEN started_at + INTERVAL '31 days'
    ELSE NULL
  END as expires_at_esperado
FROM planes_uso_coach
WHERE id = '3e934fbf-e54b-4edd-a929-103682bf9e25';

-- 2. Corregir valores faltantes o incorrectos
UPDATE planes_uso_coach
SET 
  -- Si started_at es NULL, usar created_at o NOW()
  started_at = COALESCE(started_at, created_at, NOW()),
  
  -- Si expires_at es NULL o no es started_at + 31 días, calcularlo correctamente
  expires_at = CASE 
    WHEN started_at IS NOT NULL THEN started_at + INTERVAL '31 days'
    ELSE COALESCE(expires_at, created_at + INTERVAL '31 days', NOW() + INTERVAL '31 days')
  END,
  
  -- Si renewal_count es NULL, establecerlo en 0
  renewal_count = COALESCE(renewal_count, 0),
  
  -- Si storage_limit_gb es NULL, establecer según plan_type
  storage_limit_gb = CASE 
    WHEN storage_limit_gb IS NULL THEN
      CASE plan_type
        WHEN 'free' THEN 1.00
        WHEN 'basico' THEN 5.00
        WHEN 'black' THEN 25.00
        WHEN 'premium' THEN 100.00
        ELSE 1.00
      END
    ELSE storage_limit_gb
  END,
  
  -- Si storage_used_gb es NULL, establecerlo en 0
  storage_used_gb = COALESCE(storage_used_gb, 0.000000),
  
  -- Si status es NULL, establecerlo en 'active'
  status = COALESCE(status, 'active'),
  
  -- Actualizar updated_at
  updated_at = NOW()
WHERE id = '3e934fbf-e54b-4edd-a929-103682bf9e25';

-- 3. Verificar después de la corrección
SELECT 
  id,
  coach_id,
  plan_type,
  storage_limit_gb,
  storage_used_gb,
  storage_available_gb,
  status,
  started_at,
  expires_at,
  created_at,
  updated_at,
  renewal_count,
  mercadopago_subscription_id,
  -- Verificar que expires_at = started_at + 31 días
  CASE 
    WHEN expires_at = (started_at + INTERVAL '31 days') THEN '✅ expires_at correcto'
    ELSE '⚠️ expires_at no coincide con started_at + 31 días'
  END as verificacion_expires_at,
  -- Calcular días hasta expiración
  EXTRACT(DAY FROM (expires_at - NOW())) as dias_hasta_expiracion
FROM planes_uso_coach
WHERE id = '3e934fbf-e54b-4edd-a929-103682bf9e25';

