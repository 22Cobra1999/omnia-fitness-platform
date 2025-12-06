-- Migración para cambiar activity_id de integer a jsonb en nutrition_program_details
-- Esto permite que un plato aparezca en múltiples actividades, similar a ejercicios_detalles

-- 1. Agregar nueva columna temporal para migrar datos
ALTER TABLE public.nutrition_program_details 
ADD COLUMN IF NOT EXISTS activity_id_new jsonb;

-- 2. Migrar datos existentes: convertir activity_id integer a formato jsonb
-- Formato: { "activity_id": { "activo": true } }
UPDATE public.nutrition_program_details
SET activity_id_new = CASE
  WHEN activity_id IS NOT NULL THEN
    jsonb_build_object(
      activity_id::text, 
      jsonb_build_object('activo', COALESCE(is_active, true))
    )
  ELSE NULL
END
WHERE activity_id IS NOT NULL;

-- 3. Eliminar la columna antigua
ALTER TABLE public.nutrition_program_details 
DROP COLUMN IF EXISTS activity_id;

-- 4. Renombrar la nueva columna
ALTER TABLE public.nutrition_program_details 
RENAME COLUMN activity_id_new TO activity_id;

-- 5. Eliminar índices antiguos que usaban activity_id como integer
DROP INDEX IF EXISTS idx_nutrition_program_activity_id;
DROP INDEX IF EXISTS idx_nutrition_program_details_activity_id;
DROP INDEX IF EXISTS idx_nutrition_program_details_is_active;

-- 6. Crear nuevo índice GIN para búsquedas eficientes en JSONB
CREATE INDEX IF NOT EXISTS idx_nutrition_program_details_activity_id_gin 
ON public.nutrition_program_details 
USING gin (activity_id);

-- 7. Crear índice para búsquedas por coach_id (mantener el existente)
-- El índice idx_nutrition_program_coach_id ya existe, no es necesario recrearlo

-- 8. Agregar comentario a la columna
COMMENT ON COLUMN public.nutrition_program_details.activity_id IS 
'Mapa JSONB de actividades donde aparece este plato. Formato: {"activity_id": {"activo": true/false}}';

-- Verificar resultados
SELECT 
  COUNT(*) as total_platos,
  COUNT(activity_id) as platos_con_actividad,
  COUNT(*) FILTER (WHERE activity_id IS NOT NULL) as platos_con_activity_id
FROM public.nutrition_program_details;




