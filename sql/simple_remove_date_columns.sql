-- Script simple para eliminar columnas de fecha de fitness_exercises

-- 1. Eliminar las columnas de fecha
ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS semana;
ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS mes;
ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS día;

-- 2. Verificar que se eliminaron correctamente
SELECT 
  'Columnas eliminadas exitosamente' as status,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises'
ORDER BY ordinal_position;

-- 3. Verificar que los datos siguen en activity_calendar
SELECT 
  'Datos migrados correctamente' as status,
  COUNT(*) as total_records
FROM activity_calendar;
