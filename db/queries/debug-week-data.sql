-- Query simple para debug de datos semanales
-- Muestra el problema del filtro de fechas

-- 1. Ver datos reales del cliente con fechas
SELECT 
  'DATOS REALES' as tipo,
  pc.fecha,
  'fitness' as categoria,
  COUNT(DISTINCT t."key") as ejercicios_completados,
  COALESCE(SUM(t.value::numeric), 0) as minutos_completados,
  COALESCE(SUM(c.value::numeric), 0) as kcal_completados
FROM progreso_cliente pc 
CROSS JOIN jsonb_each_text(pc.minutos_json) t("key", value)
LEFT JOIN jsonb_each_text(pc.calorias_json) c("key", value) ON c."key" = t."key"
WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pc.fecha
ORDER BY pc.fecha DESC

UNION ALL

-- 2. Ver qué fechas está buscando el frontend (semana actual)
SELECT 
  'SEMANA ACTUAL' as tipo,
  CURRENT_DATE as fecha,
  'fitness' as categoria,
  0 as ejercicios_completados,
  0 as minutos_completados,
  0 as kcal_completados

UNION ALL

-- 3. Ver fechas de los últimos 7 días
SELECT 
  'ULTIMOS 7 DIAS' as tipo,
  CURRENT_DATE - 7 as fecha,
  'fitness' as categoria,
  0 as ejercicios_completados,
  0 as minutos_completados,
  0 as kcal_completados

ORDER BY fecha DESC;
