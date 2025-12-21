-- Query para popular activity_enrollments con expiration_date y program_end_date
-- 
-- LÓGICA:
-- 1. expiration_date: created_at + 10 días (fecha límite para empezar el programa)
-- 2. program_end_date: última fecha de progreso_cliente/progreso_cliente_nutricion + 6 días
--    (solo para enrollments que ya empezaron, es decir, tienen start_date)

-- =====================================================
-- ACTUALIZAR expiration_date
-- =====================================================
-- Para todos los enrollments: created_at + 10 días
UPDATE activity_enrollments
SET expiration_date = (created_at::date + INTERVAL '10 days')::date
WHERE expiration_date IS NULL;

-- =====================================================
-- ACTUALIZAR program_end_date
-- =====================================================
-- Solo para enrollments que ya empezaron (tienen start_date)
-- program_end_date = última fecha de progreso + 6 días

-- Para actividades de fitness (progreso_cliente)
UPDATE activity_enrollments ae
SET program_end_date = (
  SELECT (MAX(pc.fecha) + INTERVAL '6 days')::date
  FROM progreso_cliente pc
  WHERE pc.actividad_id = ae.activity_id
    AND pc.cliente_id = ae.client_id
)
WHERE ae.start_date IS NOT NULL
  AND ae.program_end_date IS NULL
  AND EXISTS (
    SELECT 1 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
  );

-- Para actividades de nutrición (progreso_cliente_nutricion)
UPDATE activity_enrollments ae
SET program_end_date = (
  SELECT (MAX(pcn.fecha) + INTERVAL '6 days')::date
  FROM progreso_cliente_nutricion pcn
  WHERE pcn.actividad_id = ae.activity_id
    AND pcn.cliente_id = ae.client_id
)
WHERE ae.start_date IS NOT NULL
  AND ae.program_end_date IS NULL
  AND EXISTS (
    SELECT 1 
    FROM progreso_cliente_nutricion pcn
    WHERE pcn.actividad_id = ae.activity_id
      AND pcn.cliente_id = ae.client_id
  )
  AND NOT EXISTS (
    -- Solo si no tiene registros en progreso_cliente (para evitar duplicados)
    SELECT 1 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
  );

-- =====================================================
-- QUERY DE VERIFICACIÓN
-- =====================================================
-- Ver enrollments con sus fechas calculadas
SELECT 
  ae.id,
  ae.activity_id,
  ae.client_id,
  ae.status,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar, -- created_at + 10 días
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa, -- última fecha progreso + 6 días
  CASE 
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE 
      AND ae.start_date IS NULL 
    THEN 'Expirado sin empezar'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date < CURRENT_DATE 
    THEN 'Programa finalizado'
    WHEN ae.start_date IS NOT NULL 
    THEN 'En curso'
    ELSE 'Pendiente'
  END as estado
FROM activity_enrollments ae
ORDER BY ae.created_at DESC;

-- 
-- LÓGICA:
-- 1. expiration_date: created_at + 10 días (fecha límite para empezar el programa)
-- 2. program_end_date: última fecha de progreso_cliente/progreso_cliente_nutricion + 6 días
--    (solo para enrollments que ya empezaron, es decir, tienen start_date)

-- =====================================================
-- ACTUALIZAR expiration_date
-- =====================================================
-- Para todos los enrollments: created_at + 10 días
UPDATE activity_enrollments
SET expiration_date = (created_at::date + INTERVAL '10 days')::date
WHERE expiration_date IS NULL;

-- =====================================================
-- ACTUALIZAR program_end_date
-- =====================================================
-- Solo para enrollments que ya empezaron (tienen start_date)
-- program_end_date = última fecha de progreso + 6 días

-- Para actividades de fitness (progreso_cliente)
UPDATE activity_enrollments ae
SET program_end_date = (
  SELECT (MAX(pc.fecha) + INTERVAL '6 days')::date
  FROM progreso_cliente pc
  WHERE pc.actividad_id = ae.activity_id
    AND pc.cliente_id = ae.client_id
)
WHERE ae.start_date IS NOT NULL
  AND ae.program_end_date IS NULL
  AND EXISTS (
    SELECT 1 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
  );

-- Para actividades de nutrición (progreso_cliente_nutricion)
UPDATE activity_enrollments ae
SET program_end_date = (
  SELECT (MAX(pcn.fecha) + INTERVAL '6 days')::date
  FROM progreso_cliente_nutricion pcn
  WHERE pcn.actividad_id = ae.activity_id
    AND pcn.cliente_id = ae.client_id
)
WHERE ae.start_date IS NOT NULL
  AND ae.program_end_date IS NULL
  AND EXISTS (
    SELECT 1 
    FROM progreso_cliente_nutricion pcn
    WHERE pcn.actividad_id = ae.activity_id
      AND pcn.cliente_id = ae.client_id
  )
  AND NOT EXISTS (
    -- Solo si no tiene registros en progreso_cliente (para evitar duplicados)
    SELECT 1 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
  );

-- =====================================================
-- QUERY DE VERIFICACIÓN
-- =====================================================
-- Ver enrollments con sus fechas calculadas
SELECT 
  ae.id,
  ae.activity_id,
  ae.client_id,
  ae.status,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar, -- created_at + 10 días
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa, -- última fecha progreso + 6 días
  CASE 
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE 
      AND ae.start_date IS NULL 
    THEN 'Expirado sin empezar'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date < CURRENT_DATE 
    THEN 'Programa finalizado'
    WHEN ae.start_date IS NOT NULL 
    THEN 'En curso'
    ELSE 'Pendiente'
  END as estado
FROM activity_enrollments ae
ORDER BY ae.created_at DESC;

