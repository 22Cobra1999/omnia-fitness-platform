-- Script para verificar la estructura de las tablas
-- Este script nos ayuda a entender qué columnas existen realmente

-- 1. Verificar estructura de activity_enrollments
SELECT 
  'activity_enrollments structure' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'activity_enrollments' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de fitness_exercises
SELECT 
  'fitness_exercises structure' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises' 
ORDER BY ordinal_position;

-- 3. Verificar si existe activity_calendar
SELECT 
  'activity_calendar structure' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'activity_calendar' 
ORDER BY ordinal_position;

-- 4. Verificar datos de ejemplo en activity_enrollments
SELECT 
  'activity_enrollments sample data' as info,
  *
FROM activity_enrollments 
LIMIT 3;

-- 5. Verificar datos de ejemplo en fitness_exercises
SELECT 
  'fitness_exercises sample data' as info,
  id,
  activity_id,
  client_id,
  coach_id,
  semana,
  mes,
  día,
  nombre_actividad
FROM fitness_exercises 
LIMIT 3;
