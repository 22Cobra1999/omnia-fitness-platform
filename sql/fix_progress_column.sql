-- SOLUCIÓN DEFINITIVA: Agregar la columna progress faltante
-- Esta columna es requerida por el trigger que actualiza activity_enrollments

-- 1. Agregar la columna progress a activity_enrollments
ALTER TABLE activity_enrollments 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- 2. Actualizar todos los registros existentes con progress = 0
UPDATE activity_enrollments 
SET progress = 0 
WHERE progress IS NULL;

-- 3. Hacer la columna NOT NULL después de actualizar los valores
ALTER TABLE activity_enrollments 
ALTER COLUMN progress SET NOT NULL;

-- 4. Agregar comentario a la columna para documentación
COMMENT ON COLUMN activity_enrollments.progress IS 'Progreso del cliente en la actividad (0-100)';

-- 5. Verificar que la columna se agregó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activity_enrollments' 
AND column_name = 'progress'
AND table_schema = 'public';
