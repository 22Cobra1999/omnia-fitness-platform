-- Query simple para probar valores de anillos
-- Versión básica sin errores de sintaxis

-- 1. Ver compras del cliente y sus totales
SELECT 
  'COMPRAS TOTALES' as tipo,
  a.type as categoria,
  COUNT(*) as actividades_compradas,
  'Metas basadas en compras' as descripcion
FROM banco b
JOIN activities a ON b.activity_id = a.id
WHERE b.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND b.payment_status = 'completed'
  AND a.type IN ('fitness', 'nutrition')
GROUP BY a.type

UNION ALL

-- 2. Ver progreso reciente de fitness
SELECT 
  'PROGRESO FITNESS' as tipo,
  'fitness' as categoria,
  COUNT(*) as días_con_actividad,
  'Últimos 7 días fitness' as descripcion
FROM progreso_cliente pc
WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND pc.fecha >= CURRENT_DATE - 7
GROUP BY pc.fecha

UNION ALL

-- 3. Ver progreso reciente de nutrición
SELECT 
  'PROGRESO NUTRICION' as tipo,
  'nutricion' as categoria,
  COUNT(*) as días_con_actividad,
  'Últimos 7 días nutrición' as descripcion
FROM progreso_cliente_nutricion pcn
WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND pcn.fecha >= CURRENT_DATE - 7
GROUP BY pcn.fecha

ORDER BY categoria, tipo;
