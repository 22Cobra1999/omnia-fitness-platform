-- Verificar que el producto de nutrición se creó correctamente
-- Producto ID: 90

-- 1. Ver el producto en activities
SELECT 
  id,
  title,
  description,
  categoria,
  type,
  difficulty,
  workshop_type,
  price,
  capacity
FROM public.activities
WHERE id = 90;

-- 2. Ver los platos en nutrition_program_details
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
  created_at
FROM public.nutrition_program_details
WHERE activity_id = 90;

-- 3. Ver la planificación en planificacion_ejercicios
SELECT *
FROM public.planificacion_ejercicios
WHERE actividad_id = 90;

