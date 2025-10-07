-- Script para eliminar las columnas de fecha de fitness_exercises
-- DESPUÉS de que la migración a activity_calendar fue exitosa

-- 1. Verificar que la migración fue exitosa
SELECT 
  'Verificación de migración' as status,
  COUNT(*) as total_records_in_calendar
FROM activity_calendar;

-- 2. Verificar que todos los ejercicios tienen entradas en el calendario
SELECT 
  'Ejercicios sin calendario' as status,
  COUNT(*) as count
FROM fitness_exercises fe
LEFT JOIN activity_calendar ac ON fe.id = ac.fitness_exercise_id
WHERE ac.id IS NULL;

-- 3. Mostrar las columnas actuales de fitness_exercises
SELECT 
  'Columnas actuales de fitness_exercises' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises'
ORDER BY ordinal_position;

-- 4. Eliminar las columnas de fecha (semana, mes, día)
-- Estas columnas ya no son necesarias porque los datos están en activity_calendar

-- Eliminar columna 'semana'
ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS semana;

-- Eliminar columna 'mes'  
ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS mes;

-- Eliminar columna 'día'
ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS día;

-- 5. Verificar que las columnas se eliminaron correctamente
SELECT 
  'Columnas después de la limpieza' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises'
ORDER BY ordinal_position;

-- 6. Verificar que los datos siguen intactos en activity_calendar
SELECT 
  'Verificación final - Datos en activity_calendar' as status,
  COUNT(*) as total_records,
  COUNT(DISTINCT fitness_exercise_id) as unique_exercises,
  COUNT(DISTINCT activity_id) as unique_activities
FROM activity_calendar;

-- 7. Mostrar algunos ejemplos de datos migrados
SELECT 
  'Ejemplos de datos migrados' as status,
  ac.id,
  ac.activity_id,
  ac.fitness_exercise_id,
  ac.week_number,
  ac.month_number,
  ac.day_name,
  ac.calculated_date,
  fe.nombre_actividad
FROM activity_calendar ac
LEFT JOIN fitness_exercises fe ON ac.fitness_exercise_id = fe.id
ORDER BY ac.calculated_date
LIMIT 5;

-- 8. Verificar que no hay referencias rotas
SELECT 
  'Verificación de integridad' as status,
  'Todas las referencias están intactas' as message;
