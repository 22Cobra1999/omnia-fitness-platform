-- =====================================================
-- AGREGAR 'expirada' AL CONSTRAINT DE STATUS
-- =====================================================
-- 
-- El constraint actual solo permite: 'pendiente', 'activa', 'finalizada', 'pausada', 'cancelada'
-- Necesitamos agregar 'expirada' para indicar cuando expiration_date pasó sin empezar

-- Paso 1: Eliminar el constraint existente
ALTER TABLE activity_enrollments
DROP CONSTRAINT IF EXISTS activity_enrollments_status_check;

-- Paso 2: Crear el nuevo constraint con 'expirada' incluido
ALTER TABLE activity_enrollments
ADD CONSTRAINT activity_enrollments_status_check
CHECK (status IN ('pendiente', 'activa', 'finalizada', 'pausada', 'cancelada', 'expirada'));

-- Verificar que se creó correctamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'activity_enrollments'::regclass
  AND conname = 'activity_enrollments_status_check';

-- AGREGAR 'expirada' AL CONSTRAINT DE STATUS
-- =====================================================
-- 
-- El constraint actual solo permite: 'pendiente', 'activa', 'finalizada', 'pausada', 'cancelada'
-- Necesitamos agregar 'expirada' para indicar cuando expiration_date pasó sin empezar

-- Paso 1: Eliminar el constraint existente
ALTER TABLE activity_enrollments
DROP CONSTRAINT IF EXISTS activity_enrollments_status_check;

-- Paso 2: Crear el nuevo constraint con 'expirada' incluido
ALTER TABLE activity_enrollments
ADD CONSTRAINT activity_enrollments_status_check
CHECK (status IN ('pendiente', 'activa', 'finalizada', 'pausada', 'cancelada', 'expirada'));

-- Verificar que se creó correctamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'activity_enrollments'::regclass
  AND conname = 'activity_enrollments_status_check';

