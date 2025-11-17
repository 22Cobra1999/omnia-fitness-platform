-- Actualizar la columna categoria a 'nutricion' para actividades que tienen datos en nutrition_program_details
-- pero su categoria no es 'nutricion' o 'nutrition'

-- Primero, verificar qué actividades tienen datos en nutrition_program_details
-- pero categoria incorrecta
SELECT 
  a.id,
  a.title,
  a.categoria as categoria_actual,
  COUNT(npd.id) as total_platos
FROM public.activities a
INNER JOIN public.nutrition_program_details npd ON a.id = npd.activity_id
WHERE a.categoria NOT IN ('nutricion', 'nutrition')
GROUP BY a.id, a.title, a.categoria
ORDER BY a.id;

-- Actualizar las actividades que tienen datos en nutrition_program_details
-- pero su categoria no es 'nutricion' o 'nutrition'
UPDATE public.activities
SET categoria = 'nutricion',
    updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT a.id
  FROM public.activities a
  INNER JOIN public.nutrition_program_details npd ON a.id = npd.activity_id
  WHERE a.categoria NOT IN ('nutricion', 'nutrition')
);

-- Verificar el resultado
SELECT 
  a.id,
  a.title,
  a.categoria,
  COUNT(npd.id) as total_platos
FROM public.activities a
LEFT JOIN public.nutrition_program_details npd ON a.id = npd.activity_id
WHERE a.categoria = 'nutricion'
GROUP BY a.id, a.title, a.categoria
ORDER BY a.id;

