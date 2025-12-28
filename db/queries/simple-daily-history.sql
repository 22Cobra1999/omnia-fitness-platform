-- Query simple: historial diario del cliente
-- Muestra día, categoría y todas las variables completadas vs objetivos

-- Fitness por día
SELECT 
  pc.fecha as dia,
  'fitness' as categoria,
  COUNT(DISTINCT t."key") as ejercicios_completados,
  3 as ejercicios_objetivo,
  COALESCE(SUM(t.value::numeric), 0) as minutos_completados,
  60 as minutos_objetivo,
  COALESCE(SUM(c.value::numeric), 0) as kcal_completados,
  500 as kcal_objetivo,
  0 as proteinas_completadas,
  0 as carbohidratos_completados,
  0 as grasas_completadas
FROM progreso_cliente pc 
CROSS JOIN jsonb_each_text(pc.minutos_json) t("key", value)
LEFT JOIN jsonb_each_text(pc.calorias_json) c("key", value) ON c."key" = t."key"
WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pc.fecha

UNION ALL

-- Nutrición por día
SELECT 
  pcn.fecha as dia,
  'nutricion' as categoria,
  COUNT(DISTINCT t."key") as platos_completados,
  4 as platos_objetivo,
  0 as minutos_completados,
  0 as minutos_objetivo,
  0 as kcal_completados,
  400 as kcal_objetivo,
  0 as proteinas_completadas,
  0 as carbohidratos_completados,
  0 as grasas_completadas
FROM progreso_cliente_nutricion pcn 
CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados) t("key")
WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pcn.fecha

ORDER BY dia DESC, categoria;
