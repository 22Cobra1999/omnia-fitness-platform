-- Query para clasificar enrollments según la lógica definida
-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- LÓGICA DE CLASIFICACIÓN:
-- =====================================================
-- 1. POR EMPEZAR:
--    - status = 'pendiente' O start_date IS NULL
--    - Y expiration_date NO ha pasado (o es NULL)
--
-- 2. EN CURSO:
--    - status = 'activa' Y start_date IS NOT NULL
--    - Y program_end_date NO ha pasado (o es NULL)
--
-- 3. FINALIZADAS:
--    - expiration_date pasó Y start_date IS NULL (expirado sin empezar)
--    - O program_end_date pasó (programa finalizado)

SELECT 
  ae.id,
  ae.activity_id,
  ae.client_id,
  ae.status,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar,
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa,
  CURRENT_DATE as fecha_hoy,
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
    
    -- Caso especial: activa pero sin start_date (inconsistencia)
    WHEN ae.status = 'activa' AND ae.start_date IS NULL
    THEN 'POR EMPEZAR (Inconsistencia: activa sin start_date)'
    
    ELSE 'INDEFINIDO'
  END as clasificacion,
  
  -- Información adicional
  CASE 
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE AND ae.start_date IS NULL
    THEN 'Expirado: ' || (CURRENT_DATE - ae.expiration_date) || ' días desde expiración'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date < CURRENT_DATE
    THEN 'Finalizado: ' || (CURRENT_DATE - ae.program_end_date) || ' días desde finalización'
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
-- RESUMEN POR CLASIFICACIÓN
-- =====================================================
SELECT 
  CASE 
    WHEN expiration_date IS NOT NULL AND expiration_date < CURRENT_DATE AND start_date IS NULL 
    THEN 'FINALIZADA (Expirado sin empezar)'
    WHEN program_end_date IS NOT NULL AND program_end_date < CURRENT_DATE 
    THEN 'FINALIZADA (Programa finalizado)'
    WHEN status = 'activa' AND start_date IS NOT NULL AND (program_end_date IS NULL OR program_end_date >= CURRENT_DATE)
    THEN 'EN CURSO'
    WHEN (status = 'pendiente' OR start_date IS NULL) AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
    THEN 'POR EMPEZAR'
    ELSE 'INDEFINIDO'
  END as clasificacion,
  COUNT(*) as cantidad
FROM activity_enrollments
WHERE id IN (145, 168, 181, 191, 203)
GROUP BY clasificacion
ORDER BY cantidad DESC;

-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- LÓGICA DE CLASIFICACIÓN:
-- =====================================================
-- 1. POR EMPEZAR:
--    - status = 'pendiente' O start_date IS NULL
--    - Y expiration_date NO ha pasado (o es NULL)
--
-- 2. EN CURSO:
--    - status = 'activa' Y start_date IS NOT NULL
--    - Y program_end_date NO ha pasado (o es NULL)
--
-- 3. FINALIZADAS:
--    - expiration_date pasó Y start_date IS NULL (expirado sin empezar)
--    - O program_end_date pasó (programa finalizado)

SELECT 
  ae.id,
  ae.activity_id,
  ae.client_id,
  ae.status,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar,
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa,
  CURRENT_DATE as fecha_hoy,
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
    
    -- Caso especial: activa pero sin start_date (inconsistencia)
    WHEN ae.status = 'activa' AND ae.start_date IS NULL
    THEN 'POR EMPEZAR (Inconsistencia: activa sin start_date)'
    
    ELSE 'INDEFINIDO'
  END as clasificacion,
  
  -- Información adicional
  CASE 
    WHEN ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE AND ae.start_date IS NULL
    THEN 'Expirado: ' || (CURRENT_DATE - ae.expiration_date) || ' días desde expiración'
    WHEN ae.program_end_date IS NOT NULL AND ae.program_end_date < CURRENT_DATE
    THEN 'Finalizado: ' || (CURRENT_DATE - ae.program_end_date) || ' días desde finalización'
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
-- RESUMEN POR CLASIFICACIÓN
-- =====================================================
SELECT 
  CASE 
    WHEN expiration_date IS NOT NULL AND expiration_date < CURRENT_DATE AND start_date IS NULL 
    THEN 'FINALIZADA (Expirado sin empezar)'
    WHEN program_end_date IS NOT NULL AND program_end_date < CURRENT_DATE 
    THEN 'FINALIZADA (Programa finalizado)'
    WHEN status = 'activa' AND start_date IS NOT NULL AND (program_end_date IS NULL OR program_end_date >= CURRENT_DATE)
    THEN 'EN CURSO'
    WHEN (status = 'pendiente' OR start_date IS NULL) AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
    THEN 'POR EMPEZAR'
    ELSE 'INDEFINIDO'
  END as clasificacion,
  COUNT(*) as cantidad
FROM activity_enrollments
WHERE id IN (145, 168, 181, 191, 203)
GROUP BY clasificacion
ORDER BY cantidad DESC;

