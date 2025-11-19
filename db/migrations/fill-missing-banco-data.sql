-- Migración: Rellenar datos faltantes en registros de banco
-- Ejecutar en Supabase SQL Editor

-- 1. Rellenar activity_id y client_id desde enrollment_id
UPDATE banco
SET 
  activity_id = ae.activity_id,
  client_id = ae.client_id
FROM activity_enrollments ae
WHERE banco.enrollment_id = ae.id
  AND (banco.activity_id IS NULL OR banco.client_id IS NULL);

-- 2. Rellenar coach_mercadopago_user_id y coach_access_token_encrypted
-- Caso A: Si tiene enrollment_id, obtener desde enrollment -> activity -> coach
UPDATE banco
SET 
  coach_mercadopago_user_id = cmc.mercadopago_user_id,
  coach_access_token_encrypted = cmc.access_token_encrypted
FROM activity_enrollments ae
JOIN activities a ON ae.activity_id = a.id
JOIN coach_mercadopago_credentials cmc ON a.coach_id = cmc.coach_id
WHERE banco.enrollment_id = ae.id
  AND banco.coach_mercadopago_user_id IS NULL
  AND cmc.oauth_authorized = true;

-- Caso B: Si tiene activity_id pero no enrollment_id, obtener directamente desde activity -> coach
UPDATE banco
SET 
  coach_mercadopago_user_id = cmc.mercadopago_user_id,
  coach_access_token_encrypted = cmc.access_token_encrypted
FROM activities a
JOIN coach_mercadopago_credentials cmc ON a.coach_id = cmc.coach_id
WHERE banco.activity_id = a.id
  AND banco.coach_mercadopago_user_id IS NULL
  AND cmc.oauth_authorized = true;

-- 3. Rellenar enrollment_id si tiene activity_id y client_id pero no enrollment_id
-- (Solo si existe un enrollment activo para esa combinación)
UPDATE banco
SET 
  enrollment_id = ae.id
FROM activity_enrollments ae
WHERE banco.activity_id = ae.activity_id
  AND banco.client_id = ae.client_id
  AND banco.enrollment_id IS NULL
  AND ae.status = 'activa'
  AND NOT EXISTS (
    SELECT 1 FROM banco b2 
    WHERE b2.enrollment_id = ae.id 
    AND b2.id != banco.id
  );

-- 4. Verificar los resultados
SELECT 
  id,
  enrollment_id,
  activity_id,
  client_id,
  coach_mercadopago_user_id,
  CASE 
    WHEN coach_mercadopago_user_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_coach_mp,
  CASE 
    WHEN activity_id IS NOT NULL AND client_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as tiene_activity_client,
  payment_status,
  external_reference
FROM banco
WHERE enrollment_id IS NOT NULL OR activity_id IS NOT NULL
ORDER BY id;

