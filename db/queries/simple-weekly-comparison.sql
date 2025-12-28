-- Query ultra-simple: Comparación semanal para anillos
-- Sin sintaxis compleja para evitar errores del IDE

-- Opción 1: Datos recientes reales (como muestra el frontend ahora)
SELECT 
  pc.fecha as dia,
  'fitness' as categoria,
  COUNT(*) as ejercicios_completados,
  3 as ejercicios_objetivo,
  0 as minutos_completados,
  60 as minutos_objetivo,
  0 as kcal_completados,
  500 as kcal_objetivo
FROM progreso_cliente pc 
WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pc.fecha
ORDER BY pc.fecha DESC
LIMIT 7

UNION ALL

SELECT 
  pcn.fecha as dia,
  'nutricion' as categoria,
  COUNT(*) as platos_completados,
  4 as platos_objetivo,
  0 as minutos_completados,
  0 as minutos_objetivo,
  0 as kcal_completados,
  400 as kcal_objetivo
FROM progreso_cliente_nutricion pcn 
WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY pcn.fecha
ORDER BY pcn.fecha DESC
LIMIT 7;
