-- Script para verificar la estructura de client_exercise_customizations

-- 1. Verificar si la tabla existe
SELECT 
  'Verificando tabla client_exercise_customizations' as status,
  COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'client_exercise_customizations';

-- 2. Ver la estructura de la tabla
SELECT 
  'Estructura de client_exercise_customizations' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'client_exercise_customizations'
ORDER BY ordinal_position;

-- 3. Ver si hay triggers o funciones relacionadas
SELECT 
  'Triggers en client_exercise_customizations' as status,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'client_exercise_customizations';

-- 4. Ver funciones que mencionan client_exercise_customizations
SELECT 
  'Funciones relacionadas' as status,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%client_exercise_customizations%';

-- 5. Ver si hay datos en la tabla
SELECT 
  'Datos en client_exercise_customizations' as status,
  COUNT(*) as total_records
FROM client_exercise_customizations;
