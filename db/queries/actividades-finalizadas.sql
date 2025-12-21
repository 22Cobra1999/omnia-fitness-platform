-- Query para identificar actividades finalizadas
-- Una actividad está finalizada si:
-- 1. expiration_date ya pasó (fecha para empezar expirada)
-- 2. O la última fecha de progreso_cliente ya pasó
-- 3. O la última fecha de progreso_cliente_nutricion ya pasó (para nutrición)

-- Opción 1: Usando subconsulta (más legible)
SELECT 
  ae.*,
  CASE 
    -- 1. expiration_date ya pasó (fecha para empezar expirada)
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
    THEN true
    
    -- 2. Última fecha de progreso_cliente ya pasó
    WHEN (
      SELECT MAX(pc.fecha) 
      FROM progreso_cliente pc
      WHERE pc.actividad_id = ae.activity_id 
        AND pc.cliente_id = ae.client_id
    ) < CURRENT_DATE
    THEN true
    
    -- 3. Para nutrición, verificar también progreso_cliente_nutricion
    WHEN (
      SELECT MAX(pcn.fecha) 
      FROM progreso_cliente_nutricion pcn
      WHERE pcn.actividad_id = ae.activity_id 
        AND pcn.cliente_id = ae.client_id
    ) < CURRENT_DATE
    THEN true
    
    ELSE false
  END as is_finished
FROM activity_enrollments ae
WHERE (
  -- expiration_date ya pasó
  (ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE)
  OR
  -- Última fecha de progreso_cliente ya pasó
  (
    SELECT MAX(pc.fecha) 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id 
      AND pc.cliente_id = ae.client_id
  ) < CURRENT_DATE
  OR
  -- Última fecha de progreso_cliente_nutricion ya pasó
  (
    SELECT MAX(pcn.fecha) 
    FROM progreso_cliente_nutricion pcn
    WHERE pcn.actividad_id = ae.activity_id 
      AND pcn.cliente_id = ae.client_id
  ) < CURRENT_DATE
);

-- Opción 2: Usando LEFT JOIN (más eficiente para grandes volúmenes)
SELECT DISTINCT
  ae.*,
  CASE 
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
    THEN true
    WHEN COALESCE(last_progress.fecha, '1900-01-01'::date) < CURRENT_DATE
    THEN true
    WHEN COALESCE(last_nutrition.fecha, '1900-01-01'::date) < CURRENT_DATE
    THEN true
    ELSE false
  END as is_finished
FROM activity_enrollments ae
LEFT JOIN LATERAL (
  SELECT MAX(fecha) as fecha
  FROM progreso_cliente
  WHERE actividad_id = ae.activity_id 
    AND cliente_id = ae.client_id
) last_progress ON true
LEFT JOIN LATERAL (
  SELECT MAX(fecha) as fecha
  FROM progreso_cliente_nutricion
  WHERE actividad_id = ae.activity_id 
    AND cliente_id = ae.client_id
) last_nutrition ON true
WHERE (
  (ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE)
  OR last_progress.fecha < CURRENT_DATE
  OR last_nutrition.fecha < CURRENT_DATE
);

-- Una actividad está finalizada si:
-- 1. expiration_date ya pasó (fecha para empezar expirada)
-- 2. O la última fecha de progreso_cliente ya pasó
-- 3. O la última fecha de progreso_cliente_nutricion ya pasó (para nutrición)

-- Opción 1: Usando subconsulta (más legible)
SELECT 
  ae.*,
  CASE 
    -- 1. expiration_date ya pasó (fecha para empezar expirada)
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
    THEN true
    
    -- 2. Última fecha de progreso_cliente ya pasó
    WHEN (
      SELECT MAX(pc.fecha) 
      FROM progreso_cliente pc
      WHERE pc.actividad_id = ae.activity_id 
        AND pc.cliente_id = ae.client_id
    ) < CURRENT_DATE
    THEN true
    
    -- 3. Para nutrición, verificar también progreso_cliente_nutricion
    WHEN (
      SELECT MAX(pcn.fecha) 
      FROM progreso_cliente_nutricion pcn
      WHERE pcn.actividad_id = ae.activity_id 
        AND pcn.cliente_id = ae.client_id
    ) < CURRENT_DATE
    THEN true
    
    ELSE false
  END as is_finished
FROM activity_enrollments ae
WHERE (
  -- expiration_date ya pasó
  (ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE)
  OR
  -- Última fecha de progreso_cliente ya pasó
  (
    SELECT MAX(pc.fecha) 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id 
      AND pc.cliente_id = ae.client_id
  ) < CURRENT_DATE
  OR
  -- Última fecha de progreso_cliente_nutricion ya pasó
  (
    SELECT MAX(pcn.fecha) 
    FROM progreso_cliente_nutricion pcn
    WHERE pcn.actividad_id = ae.activity_id 
      AND pcn.cliente_id = ae.client_id
  ) < CURRENT_DATE
);

-- Opción 2: Usando LEFT JOIN (más eficiente para grandes volúmenes)
SELECT DISTINCT
  ae.*,
  CASE 
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
    THEN true
    WHEN COALESCE(last_progress.fecha, '1900-01-01'::date) < CURRENT_DATE
    THEN true
    WHEN COALESCE(last_nutrition.fecha, '1900-01-01'::date) < CURRENT_DATE
    THEN true
    ELSE false
  END as is_finished
FROM activity_enrollments ae
LEFT JOIN LATERAL (
  SELECT MAX(fecha) as fecha
  FROM progreso_cliente
  WHERE actividad_id = ae.activity_id 
    AND cliente_id = ae.client_id
) last_progress ON true
LEFT JOIN LATERAL (
  SELECT MAX(fecha) as fecha
  FROM progreso_cliente_nutricion
  WHERE actividad_id = ae.activity_id 
    AND cliente_id = ae.client_id
) last_nutrition ON true
WHERE (
  (ae.expiration_date IS NOT NULL AND ae.expiration_date < CURRENT_DATE)
  OR last_progress.fecha < CURRENT_DATE
  OR last_nutrition.fecha < CURRENT_DATE
);

