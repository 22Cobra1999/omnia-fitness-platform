-- Verificar datos de nutrición para la actividad 90
-- Fecha: 2025-01-17

-- 1. Verificar si existe la actividad 90
SELECT 
  id,
  title,
  categoria,
  type,
  coach_id
FROM public.activities
WHERE id = 90;

-- 2. Verificar platos en nutrition_program_details para la actividad 90
SELECT 
  id,
  nombre,
  receta,
  calorías,
  proteínas,
  carbohidratos,
  grasas,
  activity_id,
  coach_id,
  client_id,
  created_at
FROM public.nutrition_program_details
WHERE activity_id = 90
ORDER BY created_at;

-- 3. Contar total de platos por actividad
SELECT 
  activity_id,
  COUNT(*) as total_platos
FROM public.nutrition_program_details
WHERE activity_id = 90
GROUP BY activity_id;

-- 4. Verificar estructura de la tabla nutrition_program_details
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nutrition_program_details'
ORDER BY ordinal_position;
