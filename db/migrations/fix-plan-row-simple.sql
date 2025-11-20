-- Script simplificado para verificar y corregir la fila del plan
-- Ejecutar en Supabase SQL Editor

-- 1. Primero verificar el estado actual
SELECT 
  id,
  coach_id,
  plan_type,
  status,
  storage_limit_gb,
  storage_used_gb,
  storage_available_gb,
  started_at,
  expires_at,
  renewal_count,
  mercadopago_subscription_id,
  -- Verificar que expires_at = started_at + 31 días
  CASE 
    WHEN expires_at = (started_at + INTERVAL '31 days') THEN '✅ Correcto'
    ELSE '⚠️ expires_at debería ser started_at + 31 días'
  END as verificacion_fechas
FROM planes_uso_coach
WHERE id = '3e934fbf-e54b-4edd-a929-103682bf9e25';

-- 2. Corregir valores si es necesario (solo ajusta expires_at si no coincide)
UPDATE planes_uso_coach
SET 
  expires_at = started_at + INTERVAL '31 days',
  updated_at = NOW()
WHERE id = '3e934fbf-e54b-4edd-a929-103682bf9e25'
  AND (
    expires_at IS NULL 
    OR expires_at != (started_at + INTERVAL '31 days')
  );

-- 3. Verificar después de la corrección
SELECT 
  id,
  coach_id,
  plan_type,
  status,
  started_at,
  expires_at,
  EXTRACT(DAY FROM (expires_at - started_at)) as dias_entre_fechas,
  renewal_count,
  mercadopago_subscription_id,
  '✅ Verificación completada' as estado
FROM planes_uso_coach
WHERE id = '3e934fbf-e54b-4edd-a929-103682bf9e25';

