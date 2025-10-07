-- Script para eliminar las columnas de fecha de fitness_exercises
-- Estas columnas ahora están en la tabla activity_calendar

-- 1. Verificar las columnas actuales de fitness_exercises
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises' 
ORDER BY ordinal_position;

-- 2. Eliminar las columnas de fecha (comentado por seguridad)
-- Descomenta estas líneas cuando estés seguro de que la migración fue exitosa

-- ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS semana;
-- ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS mes;
-- ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS día;

-- 3. Verificar que las columnas fueron eliminadas
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'fitness_exercises' 
-- ORDER BY ordinal_position;
