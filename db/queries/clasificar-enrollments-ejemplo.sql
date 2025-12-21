-- Clasificación de enrollments según la lógica definida
-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- ANÁLISIS DE CADA ENROLLMENT:
-- =====================================================

-- ID 145:
--   - status: 'activa'
--   - expiration_date: '2025-10-19' (ya pasó)
--   - start_date: '2025-10-09' (sí empezó)
--   - program_end_date: null
--   CLASIFICACIÓN: EN CURSO
--   Razón: Tiene start_date, status activa, program_end_date es null (no finalizado)

-- ID 168:
--   - status: 'activa'
--   - expiration_date: '2025-10-30' (ya pasó)
--   - start_date: '2025-10-20' (sí empezó)
--   - program_end_date: '2025-12-19' (ya pasó - 2 días atrás)
--   CLASIFICACIÓN: FINALIZADA
--   Razón: program_end_date ya pasó (programa finalizado)

-- ID 181:
--   - status: 'pendiente'
--   - expiration_date: '2025-12-18' (ya pasó - 3 días atrás)
--   - start_date: null (no empezó)
--   - program_end_date: null
--   CLASIFICACIÓN: FINALIZADA
--   Razón: expiration_date pasó y no tiene start_date (expirado sin empezar)

-- ID 191:
--   - status: 'pendiente'
--   - expiration_date: '2025-12-22' (aún no pasa - 1 día más)
--   - start_date: null (no empezó)
--   - program_end_date: null
--   CLASIFICACIÓN: POR EMPEZAR
--   Razón: No empezó y expiration_date aún no pasa

-- ID 203:
--   - status: 'activa'
--   - expiration_date: '2025-12-27' (aún no pasa - 6 días más)
--   - start_date: '2025-12-22' (sí empezó)
--   - program_end_date: '2026-01-18' (aún no pasa - 28 días más)
--   CLASIFICACIÓN: EN CURSO
--   Razón: Empezó y program_end_date aún no pasa

-- =====================================================
-- QUERY PARA CLASIFICAR:
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
  
  -- Clasificación
  CASE 
    -- FINALIZADAS: expiration_date pasó y no empezó
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN 'FINALIZADA (Expirado sin empezar)'
    
    -- FINALIZADAS: program_end_date pasó
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN 'FINALIZADA (Programa finalizado)'
    
    -- EN CURSO: activa y empezó y no finalizado
    WHEN ae.status = 'activa' 
         AND ae.start_date IS NOT NULL
         AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
    THEN 'EN CURSO'
    
    -- POR EMPEZAR: pendiente o sin start_date y no expirado
    WHEN (ae.status = 'pendiente' OR ae.start_date IS NULL)
         AND (ae.expiration_date IS NULL OR ae.expiration_date >= CURRENT_DATE)
    THEN 'POR EMPEZAR'
    
    ELSE 'INDEFINIDO'
  END as clasificacion,
  
  -- Información adicional
  CASE 
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE AND ae.start_date IS NULL
    THEN 'Expirado hace ' || (CURRENT_DATE - ae.expiration_date) || ' días'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date < CURRENT_DATE
    THEN 'Finalizado hace ' || (CURRENT_DATE - ae.program_end_date) || ' días'
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date >= CURRENT_DATE AND ae.start_date IS NULL
    THEN 'Quedan ' || (ae.expiration_date - CURRENT_DATE) || ' días para empezar'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date >= CURRENT_DATE
    THEN 'Quedan ' || (ae.program_end_date - CURRENT_DATE) || ' días para finalizar'
    ELSE ''
  END as info_adicional

FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
ORDER BY ae.id;

-- =====================================================
-- RESUMEN POR CLASIFICACIÓN:
-- =====================================================
-- FINALIZADAS: 2 (ID 168, ID 181)
-- EN CURSO: 2 (ID 145, ID 203)
-- POR EMPEZAR: 1 (ID 191)

-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- ANÁLISIS DE CADA ENROLLMENT:
-- =====================================================

-- ID 145:
--   - status: 'activa'
--   - expiration_date: '2025-10-19' (ya pasó)
--   - start_date: '2025-10-09' (sí empezó)
--   - program_end_date: null
--   CLASIFICACIÓN: EN CURSO
--   Razón: Tiene start_date, status activa, program_end_date es null (no finalizado)

-- ID 168:
--   - status: 'activa'
--   - expiration_date: '2025-10-30' (ya pasó)
--   - start_date: '2025-10-20' (sí empezó)
--   - program_end_date: '2025-12-19' (ya pasó - 2 días atrás)
--   CLASIFICACIÓN: FINALIZADA
--   Razón: program_end_date ya pasó (programa finalizado)

-- ID 181:
--   - status: 'pendiente'
--   - expiration_date: '2025-12-18' (ya pasó - 3 días atrás)
--   - start_date: null (no empezó)
--   - program_end_date: null
--   CLASIFICACIÓN: FINALIZADA
--   Razón: expiration_date pasó y no tiene start_date (expirado sin empezar)

-- ID 191:
--   - status: 'pendiente'
--   - expiration_date: '2025-12-22' (aún no pasa - 1 día más)
--   - start_date: null (no empezó)
--   - program_end_date: null
--   CLASIFICACIÓN: POR EMPEZAR
--   Razón: No empezó y expiration_date aún no pasa

-- ID 203:
--   - status: 'activa'
--   - expiration_date: '2025-12-27' (aún no pasa - 6 días más)
--   - start_date: '2025-12-22' (sí empezó)
--   - program_end_date: '2026-01-18' (aún no pasa - 28 días más)
--   CLASIFICACIÓN: EN CURSO
--   Razón: Empezó y program_end_date aún no pasa

-- =====================================================
-- QUERY PARA CLASIFICAR:
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
  
  -- Clasificación
  CASE 
    -- FINALIZADAS: expiration_date pasó y no empezó
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN 'FINALIZADA (Expirado sin empezar)'
    
    -- FINALIZADAS: program_end_date pasó
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN 'FINALIZADA (Programa finalizado)'
    
    -- EN CURSO: activa y empezó y no finalizado
    WHEN ae.status = 'activa' 
         AND ae.start_date IS NOT NULL
         AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
    THEN 'EN CURSO'
    
    -- POR EMPEZAR: pendiente o sin start_date y no expirado
    WHEN (ae.status = 'pendiente' OR ae.start_date IS NULL)
         AND (ae.expiration_date IS NULL OR ae.expiration_date >= CURRENT_DATE)
    THEN 'POR EMPEZAR'
    
    ELSE 'INDEFINIDO'
  END as clasificacion,
  
  -- Información adicional
  CASE 
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE AND ae.start_date IS NULL
    THEN 'Expirado hace ' || (CURRENT_DATE - ae.expiration_date) || ' días'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date < CURRENT_DATE
    THEN 'Finalizado hace ' || (CURRENT_DATE - ae.program_end_date) || ' días'
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date >= CURRENT_DATE AND ae.start_date IS NULL
    THEN 'Quedan ' || (ae.expiration_date - CURRENT_DATE) || ' días para empezar'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date >= CURRENT_DATE
    THEN 'Quedan ' || (ae.program_end_date - CURRENT_DATE) || ' días para finalizar'
    ELSE ''
  END as info_adicional

FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
ORDER BY ae.id;

-- =====================================================
-- RESUMEN POR CLASIFICACIÓN:
-- =====================================================
-- FINALIZADAS: 2 (ID 168, ID 181)
-- EN CURSO: 2 (ID 145, ID 203)
-- POR EMPEZAR: 1 (ID 191)

