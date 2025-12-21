-- =====================================================
-- CORREGIR STATUS DE ENROLLMENTS SEGÚN LÓGICA
-- =====================================================
-- 
-- LÓGICA DE STATUS:
-- 1. "expirada": expiration_date pasó y start_date IS NULL
-- 2. "finalizada": program_end_date pasó O status explícito 'finalizada'/'completed'
-- 3. "activa": status 'activa' y start_date IS NOT NULL y NO está finalizada
-- 4. "pendiente": por defecto (no empezó y no expiró)
--
-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- ANÁLISIS DE CADA ENROLLMENT:
-- =====================================================
-- ID 145: status='activa', expiration_date='2025-10-19' (pasó), start_date='2025-10-09' (empezó), program_end_date=null
--   → Status correcto: 'activa' (empezó y no está finalizada) ✅
--
-- ID 168: status='activa', expiration_date='2025-10-30' (pasó), start_date='2025-10-20' (empezó), program_end_date='2025-12-19' (pasó)
--   → Status correcto: 'finalizada' (program_end_date pasó) ❌ CORREGIR
--
-- ID 181: status='pendiente', expiration_date='2025-12-18' (pasó), start_date=null, program_end_date=null
--   → Status correcto: 'expirada' (expiration_date pasó sin empezar) ❌ CORREGIR
--
-- ID 191: status='pendiente', expiration_date='2025-12-22' (aún no pasa), start_date=null, program_end_date=null
--   → Status correcto: 'pendiente' (no empezó y no expiró) ✅
--
-- ID 203: status='activa', expiration_date='2025-12-27' (aún no pasa), start_date='2025-12-22' (empezó), program_end_date='2026-01-18' (aún no pasa)
--   → Status correcto: 'activa' (empezó y no está finalizada) ✅

-- =====================================================
-- QUERY PARA ACTUALIZAR STATUS
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
-- VERIFICACIÓN: Ver status antes y después
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
    -- EXPIRADA: expiration_date pasó y no empezó
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN 'expirada'
    
    -- FINALIZADA: program_end_date pasó
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN 'finalizada'
    
    -- ACTIVA: empezó y no está finalizada
    WHEN ae.start_date IS NOT NULL
         AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
    THEN 'activa'
    
    -- PENDIENTE: por defecto
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

-- CORREGIR STATUS DE ENROLLMENTS SEGÚN LÓGICA
-- =====================================================
-- 
-- LÓGICA DE STATUS:
-- 1. "expirada": expiration_date pasó y start_date IS NULL
-- 2. "finalizada": program_end_date pasó O status explícito 'finalizada'/'completed'
-- 3. "activa": status 'activa' y start_date IS NOT NULL y NO está finalizada
-- 4. "pendiente": por defecto (no empezó y no expiró)
--
-- Asumiendo fecha actual: 2025-12-21

-- =====================================================
-- ANÁLISIS DE CADA ENROLLMENT:
-- =====================================================
-- ID 145: status='activa', expiration_date='2025-10-19' (pasó), start_date='2025-10-09' (empezó), program_end_date=null
--   → Status correcto: 'activa' (empezó y no está finalizada) ✅
--
-- ID 168: status='activa', expiration_date='2025-10-30' (pasó), start_date='2025-10-20' (empezó), program_end_date='2025-12-19' (pasó)
--   → Status correcto: 'finalizada' (program_end_date pasó) ❌ CORREGIR
--
-- ID 181: status='pendiente', expiration_date='2025-12-18' (pasó), start_date=null, program_end_date=null
--   → Status correcto: 'expirada' (expiration_date pasó sin empezar) ❌ CORREGIR
--
-- ID 191: status='pendiente', expiration_date='2025-12-22' (aún no pasa), start_date=null, program_end_date=null
--   → Status correcto: 'pendiente' (no empezó y no expiró) ✅
--
-- ID 203: status='activa', expiration_date='2025-12-27' (aún no pasa), start_date='2025-12-22' (empezó), program_end_date='2026-01-18' (aún no pasa)
--   → Status correcto: 'activa' (empezó y no está finalizada) ✅

-- =====================================================
-- QUERY PARA ACTUALIZAR STATUS
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
-- VERIFICACIÓN: Ver status antes y después
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
    -- EXPIRADA: expiration_date pasó y no empezó
    WHEN ae.expiration_date IS NOT NULL 
         AND ae.expiration_date < CURRENT_DATE 
         AND ae.start_date IS NULL 
    THEN 'expirada'
    
    -- FINALIZADA: program_end_date pasó
    WHEN ae.program_end_date IS NOT NULL 
         AND ae.program_end_date < CURRENT_DATE 
    THEN 'finalizada'
    
    -- ACTIVA: empezó y no está finalizada
    WHEN ae.start_date IS NOT NULL
         AND (ae.program_end_date IS NULL OR ae.program_end_date >= CURRENT_DATE)
    THEN 'activa'
    
    -- PENDIENTE: por defecto
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

