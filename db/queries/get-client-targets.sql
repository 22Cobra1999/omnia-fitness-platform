-- Query para obtener las metas diarias del cliente basadas en su compra más reciente
-- Esto reemplazará las metas fijas en los anillos de actividad

WITH client_latest_purchase AS (
  -- Obtener la compra más reciente del cliente por tipo de actividad
  SELECT 
    b.client_id,
    a.type,
    a.id as activity_id,
    a.title,
    b.created_at as purchase_date,
    ROW_NUMBER() OVER (PARTITION BY b.client_id, a.type ORDER BY b.created_at DESC) as rn
  FROM banco b
  JOIN activities a ON b.activity_id = a.id
  WHERE b.client_id = $1 
    AND b.payment_status = 'completed'
    AND a.type IN ('fitness', 'nutrition')
),
client_targets AS (
  -- Obtener metas de la compra más reciente por tipo
  SELECT 
    client_id,
    type,
    activity_id,
    title,
    COALESCE(a.daily_kcal_target, 500) as kcal_target,
    COALESCE(a.daily_minutes_target, 60) as minutes_target,
    COALESCE(a.daily_exercises_target, 3) as exercises_target,
    COALESCE(a.daily_plates_target, 4) as plates_target,
    COALESCE(a.program_duration_days, 30) as program_duration_days
  FROM client_latest_purchase clp
  JOIN activities a ON clp.activity_id = a.id
  WHERE clp.rn = 1
)
-- Retornar metas por tipo de actividad
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
  END as items_label,
  program_duration_days
FROM client_targets
ORDER BY type;

-- Query alternativa: obtener metas combinadas si tiene ambos tipos
SELECT 
  MAX(CASE WHEN type = 'fitness' THEN kcal_target END) as fitness_kcal,
  MAX(CASE WHEN type = 'fitness' THEN minutes_target END) as fitness_minutes,
  MAX(CASE WHEN type = 'fitness' THEN exercises_target END) as fitness_exercises,
  MAX(CASE WHEN type = 'nutrition' THEN kcal_target END) as nutrition_kcal,
  MAX(CASE WHEN type = 'nutrition' THEN plates_target END) as nutrition_plates
FROM client_targets;
