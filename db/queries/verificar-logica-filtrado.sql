-- Verificación de la lógica de filtrado
-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- VERIFICAR CLASIFICACIÓN DE ENROLLMENTS
-- =====================================================
SELECT 
  ae.id,
  ae.activity_id,
  ae.status,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar,
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa,
  CURRENT_DATE as fecha_hoy,
  
  -- Verificar lógica de finalización
  CASE 
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN true
    ELSE false
  END as expirado_sin_empezar,
  
  CASE 
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN true
    ELSE false
  END as programa_finalizado,
  
  CASE 
    WHEN (ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL)
         OR (ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE)
    THEN true
    ELSE false
  END as is_finished,
  
  -- Clasificación según tabs
  CASE 
    WHEN (ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL)
         OR (ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE)
    THEN 'FINALIZADA'
    WHEN ae.status = 'activa' 
         AND ae.start_date IS NOT NULL
         AND NOT (
           (ae.expiration_date IS NOT NULL 
            AND ae.expiration_date < CURRENT_DATE 
            AND ae.start_date IS NULL)
           OR (ae.program_end_date IS NOT NULL 
               AND ae.program_end_date < CURRENT_DATE)
         )
    THEN 'EN CURSO'
    WHEN (ae.status = 'pendiente' OR ae.start_date IS NULL)
         AND NOT (
           (ae.expiration_date IS NOT NULL 
            AND ae.expiration_date < CURRENT_DATE 
            AND ae.start_date IS NULL)
           OR (ae.program_end_date IS NOT NULL 
               AND ae.program_end_date < CURRENT_DATE)
         )
    THEN 'POR EMPEZAR'
    ELSE 'INDEFINIDO'
  END as clasificacion

FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
ORDER BY ae.id;

-- =====================================================
-- RESUMEN POR TAB
-- =====================================================
SELECT 
  'EN CURSO' as tab,
  COUNT(*) as cantidad
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
  AND ae.status = 'activa' 
  AND ae.start_date IS NOT NULL
  AND NOT (
    (ae.expiration_date IS NOT NULL 
     AND ae.expiration_date < CURRENT_DATE 
     AND ae.start_date IS NULL)
    OR (ae.program_end_date IS NOT NULL 
        AND ae.program_end_date < CURRENT_DATE)
  )

UNION ALL

SELECT 
  'POR EMPEZAR' as tab,
  COUNT(*) as cantidad
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
  AND (ae.status = 'pendiente' OR ae.start_date IS NULL)
  AND NOT (
    (ae.expiration_date IS NOT NULL 
     AND ae.expiration_date < CURRENT_DATE 
     AND ae.start_date IS NULL)
    OR (ae.program_end_date IS NOT NULL 
        AND ae.program_end_date < CURRENT_DATE)
  )

UNION ALL

SELECT 
  'FINALIZADAS' as tab,
  COUNT(*) as cantidad
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
  AND (
    (ae.expiration_date IS NOT NULL 
     AND ae.expiration_date < CURRENT_DATE 
     AND ae.start_date IS NULL)
    OR (ae.program_end_date IS NOT NULL 
        AND ae.program_end_date < CURRENT_DATE)
  );

-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- VERIFICAR CLASIFICACIÓN DE ENROLLMENTS
-- =====================================================
SELECT 
  ae.id,
  ae.activity_id,
  ae.status,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar,
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa,
  CURRENT_DATE as fecha_hoy,
  
  -- Verificar lógica de finalización
  CASE 
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN true
    ELSE false
  END as expirado_sin_empezar,
  
  CASE 
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN true
    ELSE false
  END as programa_finalizado,
  
  CASE 
    WHEN (ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL)
         OR (ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE)
    THEN true
    ELSE false
  END as is_finished,
  
  -- Clasificación según tabs
  CASE 
    WHEN (ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL)
         OR (ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE)
    THEN 'FINALIZADA'
    WHEN ae.status = 'activa' 
         AND ae.start_date IS NOT NULL
         AND NOT (
           (ae.expiration_date IS NOT NULL 
            AND ae.expiration_date < CURRENT_DATE 
            AND ae.start_date IS NULL)
           OR (ae.program_end_date IS NOT NULL 
               AND ae.program_end_date < CURRENT_DATE)
         )
    THEN 'EN CURSO'
    WHEN (ae.status = 'pendiente' OR ae.start_date IS NULL)
         AND NOT (
           (ae.expiration_date IS NOT NULL 
            AND ae.expiration_date < CURRENT_DATE 
            AND ae.start_date IS NULL)
           OR (ae.program_end_date IS NOT NULL 
               AND ae.program_end_date < CURRENT_DATE)
         )
    THEN 'POR EMPEZAR'
    ELSE 'INDEFINIDO'
  END as clasificacion

FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
ORDER BY ae.id;

-- =====================================================
-- RESUMEN POR TAB
-- =====================================================
SELECT 
  'EN CURSO' as tab,
  COUNT(*) as cantidad
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
  AND ae.status = 'activa' 
  AND ae.start_date IS NOT NULL
  AND NOT (
    (ae.expiration_date IS NOT NULL 
     AND ae.expiration_date < CURRENT_DATE 
     AND ae.start_date IS NULL)
    OR (ae.program_end_date IS NOT NULL 
        AND ae.program_end_date < CURRENT_DATE)
  )

UNION ALL

SELECT 
  'POR EMPEZAR' as tab,
  COUNT(*) as cantidad
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
  AND (ae.status = 'pendiente' OR ae.start_date IS NULL)
  AND NOT (
    (ae.expiration_date IS NOT NULL 
     AND ae.expiration_date < CURRENT_DATE 
     AND ae.start_date IS NULL)
    OR (ae.program_end_date IS NOT NULL 
        AND ae.program_end_date < CURRENT_DATE)
  )

UNION ALL

SELECT 
  'FINALIZADAS' as tab,
  COUNT(*) as cantidad
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
  AND (
    (ae.expiration_date IS NOT NULL 
     AND ae.expiration_date < CURRENT_DATE 
     AND ae.start_date IS NULL)
    OR (ae.program_end_date IS NOT NULL 
        AND ae.program_end_date < CURRENT_DATE)
  );

