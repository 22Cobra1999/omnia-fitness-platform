-- Query agregada por día para sumar kcal, minutos y ejercicios/platos completados
-- Agrupa los datos individuales para obtener totales diarios por tipo de actividad

WITH completed_items AS (
  -- Detalle de fitness (progreso_cliente)
  SELECT 
    pc.cliente_id,
    pc.fecha,
    t."key" as ejercicio_id,
    t.value as minutos,
    'fitness' as tipo,
    COALESCE(c.value::numeric, 0) as kcal
  FROM progreso_cliente pc 
  CROSS JOIN jsonb_each_text(pc.minutos_json::jsonb) t("key", value)
  LEFT JOIN jsonb_each_text(pc.calorias_json::jsonb) c("key", value) ON c."key" = t."key"
  WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

  UNION ALL

  -- Detalle de nutrición (progreso_cliente_nutricion)
  SELECT 
    pcn.cliente_id,
    pcn.fecha,
    t."key" as plato_id,
    '0' as minutos,
    'nutricion' as tipo,
    COALESCE(
      (m.value::json->>'proteinas')::numeric * 4 +
      COALESCE((m.value::json->>'proteina')::numeric, 0) * 4 +
      COALESCE((m.value::json->>'carbohidratos')::numeric, 0) * 4 +
      COALESCE((m.value::json->>'carbs')::numeric, 0) * 4 +
      COALESCE((m.value::json->>'grasas')::numeric, 0) * 9 +
      COALESCE((m.value::json->>'grasa')::numeric, 0) * 9,
      0
    ) as kcal
  FROM progreso_cliente_nutricion pcn 
  CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados::jsonb) t("key")
  LEFT JOIN jsonb_each(pcn.macros::jsonb) m ON m."key" = t."key"
  WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
)

-- Agregado por día y tipo
SELECT 
  cliente_id,
  fecha,
  tipo,
  COUNT(*) as items_completados,
  COALESCE(SUM(minutos::numeric), 0) as minutos_totales,
  COALESCE(SUM(kcal), 0) as kcal_totales
FROM completed_items
GROUP BY cliente_id, fecha, tipo
ORDER BY fecha DESC, tipo;

-- Vista combinada por día (fitness + nutricion)
SELECT 
  cliente_id,
  fecha,
  COUNT(*) as items_totales,
  COALESCE(SUM(CASE WHEN tipo = 'fitness' THEN minutos::numeric ELSE 0 END), 0) as minutos_fitness,
  COALESCE(SUM(CASE WHEN tipo = 'fitness' THEN 1 ELSE 0 END), 0) as ejercicios_fitness,
  COALESCE(SUM(CASE WHEN tipo = 'nutricion' THEN 1 ELSE 0 END), 0) as platos_nutricion,
  COALESCE(SUM(kcal), 0) as kcal_totales
FROM completed_items
GROUP BY cliente_id, fecha
ORDER BY fecha DESC;
