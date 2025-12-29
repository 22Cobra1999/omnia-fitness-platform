-- Query simplificada para probar resultados de anillos
-- Muestra metas diarias y progreso real para fitness y nutrición

-- 1. Obtener metas totales compradas por el cliente
WITH purchased_totals AS (
  SELECT 
    b.client_id,
    a.type,
    -- Contar ejercicios/platos únicos comprados
    CASE 
      WHEN a.type = 'fitness' THEN 
        COALESCE((SELECT COUNT(DISTINCT "key") 
                 FROM jsonb_object_keys(COALESCE(a.ejercicios_completados, '{}'))), 0)
      ELSE 0 
    END as total_exercises,
    CASE 
      WHEN a.type = 'nutrition' THEN 
        COALESCE((SELECT COUNT(DISTINCT "key") 
                 FROM jsonb_object_keys(COALESCE(a.ejercicios_completados, '{}'))), 0)
      ELSE 0 
    END as total_plates,
    -- Sumar kcal/minutos totales comprados
    COALESCE((SELECT SUM(value::numeric) FROM jsonb_each_text(COALESCE(a.calorias_json, '{}'))), 0) as total_kcal,
    COALESCE((SELECT SUM(value::numeric) FROM jsonb_each_text(COALESCE(a.minutos_json, '{}'))), 0) as total_minutes
  FROM banco b
  JOIN activities a ON b.activity_id = a.id
  WHERE b.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
    AND b.payment_status = 'completed'
    AND a.type IN ('fitness', 'nutrition')
),
-- 2. Calcular metas diarias (dividir total por 30 días del programa)
daily_targets AS (
  SELECT 
    type,
    -- Metas diarias simples
    ROUND(SUM(total_kcal)::numeric / 30, 0) as daily_kcal_target,
    ROUND(SUM(total_minutes)::numeric / 30, 0) as daily_minutes_target,
    ROUND(SUM(CASE WHEN type = 'fitness' THEN total_exercises ELSE total_plates END)::numeric / 30, 0) as daily_items_target,
    -- Metas totales para referencia
    SUM(total_kcal) as total_kcal_purchased,
    SUM(total_minutes) as total_minutes_purchased,
    SUM(CASE WHEN type = 'fitness' THEN total_exercises ELSE total_plates END) as total_items_purchased
  FROM purchased_totals
  GROUP BY type
),
-- 3. Obtener progreso real diario (versión simplificada)
daily_progress AS (
  -- Fitness progress
  SELECT 
    pc.fecha,
    'fitness' as tipo,
    COALESCE(SUM(t.value::numeric), 0) as minutes_completed,
    COUNT(DISTINCT t."key") as items_completed,
    COALESCE(SUM(c.value::numeric), 0) as kcal_completed
  FROM progreso_cliente pc 
  CROSS JOIN jsonb_each_text(pc.minutos_json) t("key", value)
  LEFT JOIN jsonb_each_text(pc.calorias_json) c("key", value) ON c."key" = t."key"
  WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  GROUP BY pc.fecha
  
  UNION ALL
  
  -- Nutrition progress
  SELECT 
    pcn.fecha,
    'nutricion' as tipo,
    0 as minutes_completed,
    COUNT(DISTINCT t."key") as items_completed,
    0 as kcal_completed
  FROM progreso_cliente_nutricion pcn 
  CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados) t("key")
  WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  GROUP BY pcn.fecha
),
-- 4. Combinar metas y progreso
ring_results AS (
  SELECT 
    dp.fecha,
    dp.tipo,
    dt.daily_kcal_target,
    dt.daily_minutes_target,
    dt.daily_items_target,
    dp.kcal_completed,
    dp.minutes_completed,
    dp.items_completed,
    -- Calcular porcentajes de progreso
    CASE 
      WHEN dt.daily_kcal_target = 0 THEN 0
      ELSE ROUND((dp.kcal_completed::numeric / dt.daily_kcal_target) * 100, 1)
    END as kcal_progress_pct,
    CASE 
      WHEN dt.daily_minutes_target = 0 THEN 0
      ELSE ROUND((dp.minutes_completed::numeric / dt.daily_minutes_target) * 100, 1)
    END as minutes_progress_pct,
    CASE 
      WHEN dt.daily_items_target = 0 THEN 0
      ELSE ROUND((dp.items_completed::numeric / dt.daily_items_target) * 100, 1)
    END as items_progress_pct,
    -- Metas totales para referencia
    dt.total_kcal_purchased,
    dt.total_minutes_purchased,
    dt.total_items_purchased
  FROM daily_progress dp
  JOIN daily_targets dt ON dp.tipo = dt.type
  WHERE dp.fecha >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY dp.fecha DESC, dp.tipo
)
-- 5. Mostrar resultados esperados para los anillos
SELECT 
  fecha,
  tipo as categoria,
  daily_kcal_target as "Meta kcal/dia",
  kcal_completed as "Kcal completadas",
  kcal_progress_pct as "% kcal",
  daily_minutes_target as "Meta min/dia", 
  minutes_completed as "Min completados",
  minutes_progress_pct as "% min",
  daily_items_target as "Meta items/dia",
  items_completed as "Items completados",
  items_progress_pct as "% items",
  total_kcal_purchased as "Total kcal",
  total_minutes_purchased as "Total min",
  total_items_purchased as "Total items"
FROM ring_results;
