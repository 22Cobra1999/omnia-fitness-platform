-- Query simplificada: Progreso semanal por categoría
-- Para comparar con los anillos de actividad

-- Opción 1: Semana actual (fitness)
SELECT 
  generate_series.date as dia,
  'fitness' as categoria,
  COALESCE(COUNT(DISTINCT t.key), 0) as ejercicios_completados,
  3 as ejercicios_objetivo,
  COALESCE(SUM(t.value::numeric), 0) as minutos_completados,
  60 as minutos_objetivo,
  COALESCE(SUM(c.value::numeric), 0) as kcal_completados,
  500 as kcal_objetivo
FROM (
  SELECT date_trunc('week', CURRENT_DATE)::date + generate_series(0, 6) as date
) generate_series
LEFT JOIN progreso_cliente pc ON generate_series.date = pc.fecha 
  AND pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
LEFT JOIN jsonb_each_text(pc.minutos_json) t(key, value) ON true
LEFT JOIN jsonb_each_text(pc.calorias_json) c(key, value) ON c.key = t.key
GROUP BY generate_series.date

UNION ALL

-- Opción 1: Semana actual (nutricion)
SELECT 
  generate_series.date as dia,
  'nutricion' as categoria,
  COALESCE(COUNT(DISTINCT t.key), 0) as platos_completados,
  4 as platos_objetivo,
  0 as minutos_completados,
  0 as minutos_objetivo,
  0 as kcal_completados,
  400 as kcal_objetivo
FROM (
  SELECT date_trunc('week', CURRENT_DATE)::date + generate_series(0, 6) as date
) generate_series
LEFT JOIN progreso_cliente_nutricion pcn ON generate_series.date = pcn.fecha 
  AND pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
LEFT JOIN jsonb_object_keys(pcn.ejercicios_completados) t(key) ON true
GROUP BY generate_series.date
ORDER BY dia, categoria;

-- Opción 2: Últimos 7 días reales (fitness)
SELECT 
  pc.fecha as dia,
  'fitness' as categoria,
  COUNT(DISTINCT t.key) as ejercicios_completados,
  3 as ejercicios_objetivo,
  COALESCE(SUM(t.value::numeric), 0) as minutos_completados,
  60 as minutos_objetivo,
  COALESCE(SUM(c.value::numeric), 0) as kcal_completados,
  500 as kcal_objetivo
FROM progreso_cliente pc 
CROSS JOIN jsonb_each_text(pc.minutos_json) t(key, value)
LEFT JOIN jsonb_each_text(pc.calorias_json) c(key, value) ON c.key = t.key
WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pc.fecha
ORDER BY pc.fecha DESC
LIMIT 7

UNION ALL

-- Opción 2: Últimos 7 días reales (nutricion)
SELECT 
  pcn.fecha as dia,
  'nutricion' as categoria,
  COUNT(DISTINCT t.key) as platos_completados,
  4 as platos_objetivo,
  0 as minutos_completados,
  0 as minutos_objetivo,
  0 as kcal_completados,
  400 as kcal_objetivo
FROM progreso_cliente_nutricion pcn 
CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados) t(key)
WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pcn.fecha
ORDER BY pcn.fecha DESC
LIMIT 7;
