-- Script para limpiar registros duplicados en nutrition_program_details
-- Fecha: 2025-01-25
-- Problema: Registros duplicados con is_active = false y activity_id = 93

-- NOTA: Este script elimina los registros duplicados específicos mencionados en el INSERT
-- IDs a eliminar: 739, 740, 741, 742, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763

-- 1. Verificar registros antes de eliminar
SELECT 
  id,
  nombre,
  receta,
  calorias,
  activity_id,
  activity_id_new,
  is_active,
  tipo,
  created_at
FROM public.nutrition_program_details
WHERE id IN (739, 740, 741, 742, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763)
ORDER BY nombre, created_at;

-- 2. Identificar duplicados basados en nombre, receta y calorías
-- Mantener solo el registro más antiguo (primero creado) de cada grupo
WITH duplicates AS (
  SELECT 
    id,
    nombre,
    receta,
    calorias,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LOWER(TRIM(nombre)), 
        COALESCE(LOWER(TRIM(receta)), ''), 
        COALESCE(calorias::text, '')
      ORDER BY created_at ASC, id ASC
    ) as rn
  FROM public.nutrition_program_details
  WHERE 
    coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
    AND (
      -- Filtrar registros problemáticos
      (activity_id::text LIKE '%"93"%' OR activity_id::text = '93' OR activity_id_new::text LIKE '%"93"%')
      OR is_active = false
      OR id IN (739, 740, 741, 742, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763)
    )
)
-- 3. Mostrar qué se va a eliminar
SELECT 
  'DUPLICADOS A ELIMINAR' as accion,
  id,
  nombre,
  receta,
  calorias,
  created_at,
  rn
FROM duplicates
WHERE rn > 1
ORDER BY nombre, created_at;

-- 4. Eliminar duplicados (mantener solo el primero, eliminar los demás)
-- COMENTAR ESTA SECCIÓN HASTA VERIFICAR QUE LOS RESULTADOS SON CORRECTOS
/*
DELETE FROM public.nutrition_program_details
WHERE id IN (
  SELECT id 
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          LOWER(TRIM(nombre)), 
          COALESCE(LOWER(TRIM(receta)), ''), 
          COALESCE(calorias::text, '')
        ORDER BY created_at ASC, id ASC
      ) as rn
    FROM public.nutrition_program_details
    WHERE 
      coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
      AND (
        (activity_id::text LIKE '%"93"%' OR activity_id::text = '93' OR activity_id_new::text LIKE '%"93"%')
        OR is_active = false
        OR id IN (739, 740, 741, 742, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763)
      )
  ) sub
  WHERE rn > 1
);
*/

-- 5. Verificar duplicados restantes después de la limpieza
SELECT 
  nombre,
  COUNT(*) as cantidad,
  STRING_AGG(id::text, ', ' ORDER BY id) as ids,
  STRING_AGG(created_at::text, ', ' ORDER BY created_at) as fechas_creacion
FROM public.nutrition_program_details
WHERE 
  coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND (
    (activity_id::text LIKE '%"93"%' OR activity_id::text = '93' OR activity_id_new::text LIKE '%"93"%')
    OR is_active = false
  )
GROUP BY LOWER(TRIM(nombre)), COALESCE(LOWER(TRIM(receta)), ''), COALESCE(calorias::text, '')
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- 6. Verificar estructura final
SELECT 
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE is_active = true) as activos,
  COUNT(*) FILTER (WHERE is_active = false) as inactivos,
  COUNT(*) FILTER (WHERE activity_id::text LIKE '%"93"%' OR activity_id::text = '93') as con_actividad_93,
  COUNT(*) FILTER (WHERE activity_id_new IS NOT NULL) as con_activity_id_new
FROM public.nutrition_program_details
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

