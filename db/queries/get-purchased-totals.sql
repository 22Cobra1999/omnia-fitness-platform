-- Query para obtener las metas del cliente basadas en el total de lo comprado
-- Las metas son la suma completa de ejercicios/platos/kcal que compró

-- Obtener el total de ejercicios/platos/kcal comprados por tipo
WITH purchased_totals AS (
  SELECT 
    b.client_id,
    a.type,
    -- Para fitness, contar ejercicios únicos (necesita verificar estructura JSON)
    CASE 
      WHEN a.type = 'fitness' THEN 
        COALESCE((SELECT COUNT(DISTINCT "key") 
                 FROM jsonb_object_keys(COALESCE(a.ejercicios_completados, '{}'))), 0)
      ELSE 0 
    END as total_exercises,
    -- Para nutrición, contar platos
    CASE 
      WHEN a.type = 'nutrition' THEN 
        COALESCE((SELECT COUNT(DISTINCT "key") 
                 FROM jsonb_object_keys(COALESCE(a.ejercicios_completados, '{}'))), 0)
      ELSE 0 
    END as total_plates,
    -- Sumar kcal totales del programa (si existen en JSON)
    COALESCE(
      (SELECT SUM(value::numeric) 
       FROM jsonb_each_text(COALESCE(a.calorias_json, '{}'))), 0
    ) as total_kcal,
    -- Sumar minutos totales del programa (si existen en JSON)
    COALESCE(
      (SELECT SUM(value::numeric) 
       FROM jsonb_each_text(COALESCE(a.minutos_json, '{}'))), 0
    ) as total_minutes
  FROM banco b
  JOIN activities a ON b.activity_id = a.id
  WHERE b.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
    AND b.payment_status = 'completed'
    AND a.type IN ('fitness', 'nutrition')
),
-- Agregar totales por tipo de actividad
aggregated_totals AS (
  SELECT 
    client_id,
    type,
    SUM(total_exercises) as exercises_target,
    SUM(total_plates) as plates_target,
    SUM(total_kcal) as kcal_target,
    SUM(total_minutes) as minutes_target
  FROM purchased_totals
  GROUP BY client_id, type
)
-- Retornar metas formateadas
SELECT 
  type,
  kcal_target,
  minutes_target,
  CASE 
    WHEN type = 'fitness' THEN exercises_target
    WHEN type = 'nutrition' THEN plates_target
    ELSE exercises_target
  END as items_target,
  CASE 
    WHEN type = 'fitness' THEN 'ejercicios'
    WHEN type = 'nutrition' THEN 'platos'
    ELSE 'ejercicios'
  END as items_label
FROM aggregated_totals
ORDER BY type;
