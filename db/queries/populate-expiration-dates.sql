-- =====================================================
-- QUERY: Popular expiration_date y program_end_date en enrollments existentes
-- =====================================================
-- 
-- Esta query actualiza los enrollments existentes con:
-- 1. expiration_date = created_at + dias_acceso (o 10 días por defecto)
-- 2. program_end_date = última fecha de progreso_cliente (si ya empezó)

-- =====================================================
-- PASO 1: Actualizar expiration_date para enrollments que no han empezado
-- =====================================================
-- expiration_date = created_at + dias_acceso (o 10 días si no está definido)

UPDATE activity_enrollments ae
SET expiration_date = (
    CASE 
        -- Si la actividad tiene dias_acceso, usarlo
        WHEN a.dias_acceso IS NOT NULL AND a.dias_acceso > 0 
        THEN (ae.created_at::DATE + (a.dias_acceso || ' days')::INTERVAL)::DATE
        -- Si no, usar 10 días por defecto
        ELSE (ae.created_at::DATE + INTERVAL '10 days')::DATE
    END
),
updated_at = NOW()
FROM activities a
WHERE ae.activity_id = a.id
  AND ae.start_date IS NULL  -- Solo para los que no han empezado
  AND ae.expiration_date IS NULL;  -- Solo si no tiene expiration_date

-- =====================================================
-- PASO 2: Actualizar program_end_date para enrollments que ya empezaron
-- =====================================================
-- program_end_date = MAX(fecha) de progreso_cliente o progreso_cliente_nutricion

-- Para actividades de fitness (progreso_cliente)
UPDATE activity_enrollments ae
SET program_end_date = (
    SELECT MAX(pc.fecha)
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
),
updated_at = NOW()
WHERE ae.start_date IS NOT NULL  -- Solo los que ya empezaron
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
    SELECT MAX(pcn.fecha)
    FROM progreso_cliente_nutricion pcn
    WHERE pcn.actividad_id = ae.activity_id
      AND pcn.cliente_id = ae.client_id
),
updated_at = NOW()
WHERE ae.start_date IS NOT NULL  -- Solo los que ya empezaron
  AND ae.program_end_date IS NULL
  AND EXISTS (
      SELECT 1 
      FROM progreso_cliente_nutricion pcn
      WHERE pcn.actividad_id = ae.activity_id
        AND pcn.cliente_id = ae.client_id
  )
  AND NOT EXISTS (
      -- Solo si no tiene datos en progreso_cliente (prioridad a fitness)
      SELECT 1 
      FROM progreso_cliente pc
      WHERE pc.actividad_id = ae.activity_id
        AND pc.cliente_id = ae.client_id
  );

-- =====================================================
-- VERIFICACIÓN: Ver los resultados
-- =====================================================
SELECT 
    ae.id,
    ae.activity_id,
    ae.client_id,
    ae.status,
    ae.created_at::DATE as fecha_compra,
    ae.start_date as fecha_inicio,
    ae.expiration_date as fecha_expiracion_empezar,
    ae.program_end_date as fecha_fin_programa,
    ae.coach_extended_end_date as fecha_extendida_coach,
    ae.coach_extended_days as dias_extendidos,
    a.title as actividad,
    a.dias_acceso,
    -- Calcular días restantes para empezar
    CASE 
        WHEN ae.start_date IS NULL AND ae.expiration_date IS NOT NULL
        THEN ae.expiration_date - CURRENT_DATE
        ELSE NULL
    END as dias_restantes_empezar,
    -- Calcular días desde finalización
    CASE 
        WHEN ae.start_date IS NOT NULL 
             AND COALESCE(ae.coach_extended_end_date, ae.program_end_date) IS NOT NULL
        THEN CURRENT_DATE - COALESCE(ae.coach_extended_end_date, ae.program_end_date)
        ELSE NULL
    END as dias_desde_finalizacion
FROM activity_enrollments ae
JOIN activities a ON a.id = ae.activity_id
ORDER BY ae.created_at DESC;

-- =====================================================
-- QUERY ESPECÍFICA: Para los enrollments del INSERT proporcionado
-- =====================================================
-- Actualizar solo los IDs específicos mencionados

UPDATE activity_enrollments ae
SET expiration_date = (
    CASE 
        WHEN a.dias_acceso IS NOT NULL AND a.dias_acceso > 0 
        THEN (ae.created_at::DATE + (a.dias_acceso || ' days')::INTERVAL)::DATE
        ELSE (ae.created_at::DATE + INTERVAL '10 days')::DATE
    END
),
updated_at = NOW()
FROM activities a
WHERE ae.activity_id = a.id
  AND ae.id IN (145, 168, 181, 191, 203)
  AND ae.start_date IS NULL
  AND ae.expiration_date IS NULL;

-- Actualizar program_end_date para los que ya empezaron
UPDATE activity_enrollments ae
SET program_end_date = (
    SELECT MAX(pc.fecha)
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
),
updated_at = NOW()
WHERE ae.id IN (145, 168, 203)  -- Los que tienen start_date
  AND ae.start_date IS NOT NULL
  AND ae.program_end_date IS NULL
  AND EXISTS (
      SELECT 1 
      FROM progreso_cliente pc
      WHERE pc.actividad_id = ae.activity_id
        AND pc.cliente_id = ae.client_id
  );

-- Verificar los resultados específicos
SELECT 
    ae.id,
    ae.activity_id,
    ae.status,
    ae.created_at::DATE as fecha_compra,
    ae.start_date as fecha_inicio,
    ae.expiration_date as fecha_expiracion_empezar,
    ae.program_end_date as fecha_fin_programa,
    a.title as actividad,
    a.dias_acceso
FROM activity_enrollments ae
JOIN activities a ON a.id = ae.activity_id
WHERE ae.id IN (145, 168, 181, 191, 203)
ORDER BY ae.id;

