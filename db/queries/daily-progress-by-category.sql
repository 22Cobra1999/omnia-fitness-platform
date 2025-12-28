-- Query para mostrar progreso diario por categoría
-- Muestra fecha, categoría, variables completadas y objetivos

-- 1. Progreso fitness por día
SELECT 
  pc.fecha as fecha,
  'fitness' as categoria,
  COUNT(DISTINCT t."key") as ejercicios_completados,
  COALESCE(SUM(t.value::numeric), 0) as minutos_completados,
  COALESCE(SUM(c.value::numeric), 0) as kcal_completados,
  -- Objetivos (metas dinámicas - por ahora valores por defecto)
  3 as ejercicios_objetivo,
  60 as minutos_objetivo,
  500 as kcal_objetivo
FROM progreso_cliente pc 
CROSS JOIN jsonb_each_text(pc.minutos_json) t("key", value)
LEFT JOIN jsonb_each_text(pc.calorias_json) c("key", value) ON c."key" = t."key"
WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pc.fecha

UNION ALL

-- 2. Progreso nutrición por día
SELECT 
  pcn.fecha as fecha,
  'nutricion' as categoria,
  COUNT(DISTINCT t."key") as platos_completados,
  0 as minutos_completados,
  0 as kcal_completados,
  -- Objetivos (metas dinámicas - por ahora valores por defecto)
  4 as platos_objetivo,
  0 as minutos_objetivo,
  400 as kcal_objetivo
FROM progreso_cliente_nutricion pcn 
CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados) t("key")
WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pcn.fecha

ORDER BY fecha DESC, categoria;
