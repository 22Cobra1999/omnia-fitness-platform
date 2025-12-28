-- Query para mostrar TODOS los días de la semana actual (incluyendo días sin actividad)
-- Esto nos permitirá ver qué días faltan por completar

-- Generar todos los días de la semana actual (lunes a domingo)
WITH week_dates AS (
  SELECT 
    generate_series(
      date_trunc('week', CURRENT_DATE)::date,  -- Lunes de esta semana
      date_trunc('week', CURRENT_DATE)::date + 6,  -- Domingo de esta semana
      '1 day'::interval
    )::date as fecha
),
-- Obtener progreso real de fitness por día
fitness_progress AS (
  SELECT 
    pc.fecha,
    COUNT(DISTINCT t."key") as ejercicios_completados,
    COALESCE(SUM(t.value::numeric), 0) as minutos_completados,
    COALESCE(SUM(c.value::numeric), 0) as kcal_completados
  FROM progreso_cliente pc 
  CROSS JOIN jsonb_each_text(pc.minutos_json) t("key", value)
  LEFT JOIN jsonb_each_text(pc.calorias_json) c("key", value) ON c."key" = t."key"
  WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  GROUP BY pc.fecha
),
-- Obtener progreso real de nutrición por día
nutrition_progress AS (
  SELECT 
    pcn.fecha,
    COUNT(DISTINCT t."key") as platos_completados,
    0 as kcal_completados
  FROM progreso_cliente_nutricion pcn 
  CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados) t("key")
  WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  GROUP BY pcn.fecha
),
-- Combinar todo con la semana completa
complete_week AS (
  SELECT 
    wd.fecha,
    'fitness' as categoria,
    COALESCE(fp.ejercicios_completados, 0) as ejercicios_completados,
    COALESCE(fp.minutos_completados, 0) as minutos_completados,
    COALESCE(fp.kcal_completados, 0) as kcal_completados,
    3 as ejercicios_objetivo,
    60 as minutos_objetivo,
    500 as kcal_objetivo
  FROM week_dates wd
  LEFT JOIN fitness_progress fp ON wd.fecha = fp.fecha
  
  UNION ALL
  
  SELECT 
    wd.fecha,
    'nutricion' as categoria,
    COALESCE(np.platos_completados, 0) as ejercicios_completados,
    0 as minutos_completados,
    COALESCE(np.kcal_completados, 0) as kcal_completados,
    4 as ejercicios_objetivo,
    0 as minutos_objetivo,
    400 as kcal_objetivo
  FROM week_dates wd
  LEFT JOIN nutrition_progress np ON wd.fecha = np.fecha
)
-- Mostrar resultados con porcentajes
SELECT 
  to_char(fecha, 'Day') as dia_semana,
  fecha,
  categoria,
  ejercicios_completados,
  minutos_completados,
  kcal_completados,
  ejercicios_objetivo,
  minutos_objetivo,
  kcal_objetivo,
  CASE 
    WHEN ejercicios_objetivo = 0 THEN 0
    ELSE ROUND((ejercicios_completados::numeric / ejercicios_objetivo) * 100, 1)
  END as ejercicios_pct,
  CASE 
    WHEN minutos_objetivo = 0 THEN 0
    ELSE ROUND((minutos_completados::numeric / minutos_objetivo) * 100, 1)
  END as minutos_pct,
  CASE 
    WHEN kcal_objetivo = 0 THEN 0
    ELSE ROUND((kcal_completados::numeric / kcal_objetivo) * 100, 1)
  END as kcal_pct
FROM complete_week
ORDER BY fecha, categoria;
