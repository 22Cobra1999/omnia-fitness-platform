-- =====================================================
-- SCRIPT COMPLETO: Popular fechas y corregir status
-- =====================================================
-- Ejecutar en este orden:
-- 0. Actualizar constraint para permitir 'expirada'
-- 1. Popular expiration_date y program_end_date
-- 2. Corregir status según la lógica

-- =====================================================
-- PASO 0: Actualizar constraint para permitir 'expirada'
-- =====================================================
ALTER TABLE activity_enrollments
DROP CONSTRAINT IF EXISTS activity_enrollments_status_check;

ALTER TABLE activity_enrollments
ADD CONSTRAINT activity_enrollments_status_check
CHECK (status IN ('pendiente', 'activa', 'finalizada', 'pausada', 'cancelada', 'expirada'));

-- =====================================================
-- PASO 1: Popular expiration_date (created_at + 10 días)
-- =====================================================
UPDATE activity_enrollments
SET expiration_date = (created_at::date + INTERVAL '10 days')::date
WHERE expiration_date IS NULL;

-- =====================================================
-- PASO 2: Popular program_end_date (última fecha progreso + 6 días)
-- =====================================================

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
    SELECT 1 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
  );

-- =====================================================
-- PASO 3: Corregir status según la lógica
-- =====================================================

-- 1. Actualizar a "expirada": expiration_date pasó y no empezó
UPDATE activity_enrollments
SET 
  status = 'expirada',
  updated_at = NOW()
WHERE expiration_date IS NOT NULL
  AND expiration_date < CURRENT_DATE
  AND start_date IS NULL
  AND status != 'expirada';

-- 2. Actualizar a "finalizada": program_end_date pasó
UPDATE activity_enrollments
SET 
  status = 'finalizada',
  updated_at = NOW()
WHERE program_end_date IS NOT NULL
  AND program_end_date < CURRENT_DATE
  AND status != 'finalizada';

-- 3. Actualizar a "activa": empezó y no está finalizada
UPDATE activity_enrollments
SET 
  status = 'activa',
  updated_at = NOW()
WHERE start_date IS NOT NULL
  AND (program_end_date IS NULL OR program_end_date >= CURRENT_DATE)
  AND status != 'activa'
  AND status != 'finalizada'
  AND status != 'expirada';

-- 4. Actualizar a "pendiente": no empezó y no expiró
UPDATE activity_enrollments
SET 
  status = 'pendiente',
  updated_at = NOW()
WHERE start_date IS NULL
  AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
  AND status != 'pendiente'
  AND status != 'expirada';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT 
  ae.id,
  ae.activity_id,
  ae.status as status_actual,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar,
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa,
  CURRENT_DATE as fecha_hoy,
  CASE 
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN 'expirada'
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN 'finalizada'
    WHEN ae.start_date IS NOT NULL
         AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
    THEN 'activa'
    ELSE 'pendiente'
  END as status_correcto,
  CASE 
    WHEN ae.status = CASE 
      WHEN ae.expiration_date IS NOT NULL 
           AND ae.expiration_date < CURRENT_DATE 
           AND ae.start_date IS NULL 
      THEN 'expirada'
      WHEN ae.program_end_date IS NOT NULL 
           AND ae.program_end_date < CURRENT_DATE 
      THEN 'finalizada'
      WHEN ae.start_date IS NOT NULL
           AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
      THEN 'activa'
      ELSE 'pendiente'
    END
    THEN '✅ Correcto'
    ELSE '❌ Incorrecto'
  END as estado
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
ORDER BY ae.id;


-- =====================================================
-- Ejecutar en este orden:
-- 0. Actualizar constraint para permitir 'expirada'
-- 1. Popular expiration_date y program_end_date
-- 2. Corregir status según la lógica

-- =====================================================
-- PASO 0: Actualizar constraint para permitir 'expirada'
-- =====================================================
ALTER TABLE activity_enrollments
DROP CONSTRAINT IF EXISTS activity_enrollments_status_check;

ALTER TABLE activity_enrollments
ADD CONSTRAINT activity_enrollments_status_check
CHECK (status IN ('pendiente', 'activa', 'finalizada', 'pausada', 'cancelada', 'expirada'));

-- =====================================================
-- PASO 1: Popular expiration_date (created_at + 10 días)
-- =====================================================
UPDATE activity_enrollments
SET expiration_date = (created_at::date + INTERVAL '10 days')::date
WHERE expiration_date IS NULL;

-- =====================================================
-- PASO 2: Popular program_end_date (última fecha progreso + 6 días)
-- =====================================================

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
    SELECT 1 
    FROM progreso_cliente pc
    WHERE pc.actividad_id = ae.activity_id
      AND pc.cliente_id = ae.client_id
  );

-- =====================================================
-- PASO 3: Corregir status según la lógica
-- =====================================================

-- 1. Actualizar a "expirada": expiration_date pasó y no empezó
UPDATE activity_enrollments
SET 
  status = 'expirada',
  updated_at = NOW()
WHERE expiration_date IS NOT NULL
  AND expiration_date < CURRENT_DATE
  AND start_date IS NULL
  AND status != 'expirada';

-- 2. Actualizar a "finalizada": program_end_date pasó
UPDATE activity_enrollments
SET 
  status = 'finalizada',
  updated_at = NOW()
WHERE program_end_date IS NOT NULL
  AND program_end_date < CURRENT_DATE
  AND status != 'finalizada';

-- 3. Actualizar a "activa": empezó y no está finalizada
UPDATE activity_enrollments
SET 
  status = 'activa',
  updated_at = NOW()
WHERE start_date IS NOT NULL
  AND (program_end_date IS NULL OR program_end_date >= CURRENT_DATE)
  AND status != 'activa'
  AND status != 'finalizada'
  AND status != 'expirada';

-- 4. Actualizar a "pendiente": no empezó y no expiró
UPDATE activity_enrollments
SET 
  status = 'pendiente',
  updated_at = NOW()
WHERE start_date IS NULL
  AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
  AND status != 'pendiente'
  AND status != 'expirada';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT 
  ae.id,
  ae.activity_id,
  ae.status as status_actual,
  ae.created_at::date as fecha_compra,
  ae.expiration_date as fecha_limite_empezar,
  ae.start_date as fecha_inicio,
  ae.program_end_date as fecha_fin_programa,
  CURRENT_DATE as fecha_hoy,
  CASE 
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN 'expirada'
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN 'finalizada'
    WHEN ae.start_date IS NOT NULL
         AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
    THEN 'activa'
    ELSE 'pendiente'
  END as status_correcto,
  CASE 
    WHEN ae.status = CASE 
      WHEN ae.expiration_date IS NOT NULL 
           AND ae.expiration_date < CURRENT_DATE 
           AND ae.start_date IS NULL 
      THEN 'expirada'
      WHEN ae.program_end_date IS NOT NULL 
           AND ae.program_end_date < CURRENT_DATE 
      THEN 'finalizada'
      WHEN ae.start_date IS NOT NULL
           AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
      THEN 'activa'
      ELSE 'pendiente'
    END
    THEN '✅ Correcto'
    ELSE '❌ Incorrecto'
  END as estado
FROM activity_enrollments ae
WHERE ae.id IN (145, 168, 181, 191, 203)
ORDER BY ae.id;

