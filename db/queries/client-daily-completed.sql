-- Query para identificar qué ejercicios/platos están completos por día
-- Muestra el detalle de cada item completado para poder sumar correctamente

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
    (m.value->>'proteinas')::numeric * 4 +
    COALESCE((m.value->>'proteina')::numeric, 0) * 4 +
    COALESCE((m.value->>'carbohidratos')::numeric, 0) * 4 +
    COALESCE((m.value->>'carbs')::numeric, 0) * 4 +
    COALESCE((m.value->>'grasas')::numeric, 0) * 9 +
    COALESCE((m.value->>'grasa')::numeric, 0) * 9,
    0
  ) as kcal
FROM progreso_cliente_nutricion pcn 
CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados::jsonb) t("key")
LEFT JOIN jsonb_each(pcn.macros::jsonb) m ON m."key" = t."key"
WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

ORDER BY fecha DESC, tipo, ejercicio_id;
