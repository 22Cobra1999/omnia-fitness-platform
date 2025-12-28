-- Query para verificar duplicados en los datos de progreso
-- Muestra si hay múltiples registros del mismo ejercicio/plato en el mismo día

-- Verificar duplicados en fitness
SELECT 
  cliente_id,
  fecha,
  t."key" as ejercicio_id,
  COUNT(*) as repeticiones,
  STRING_AGG(t.value::text, ', ') as minutos_repetidos
FROM progreso_cliente pc 
CROSS JOIN jsonb_each_text(pc.minutos_json::jsonb) t("key", value)
WHERE pc.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY cliente_id, fecha, t."key"
HAVING COUNT(*) > 1
ORDER BY fecha DESC, ejercicio_id;

-- Verificar duplicados en nutrición
SELECT 
  cliente_id,
  fecha,
  t."key" as plato_id,
  COUNT(*) as repeticiones
FROM progreso_cliente_nutricion pcn 
CROSS JOIN jsonb_object_keys(pcn.ejercicios_completados::jsonb) t("key")
WHERE pcn.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY cliente_id, fecha, t."key"
HAVING COUNT(*) > 1
ORDER BY fecha DESC, plato_id;

-- Verificar múltiples filas de progreso para el mismo día y cliente
SELECT 
  'progreso_cliente' as tabla,
  cliente_id,
  fecha,
  COUNT(*) as filas_progreso,
  STRING_AGG(id::text, ', ') as ids_registros
FROM progreso_cliente
WHERE cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY cliente_id, fecha
HAVING COUNT(*) > 1
ORDER BY fecha DESC;

-- Verificar múltiples filas de progreso de nutrición para el mismo día y cliente
SELECT 
  'progreso_cliente_nutricion' as tabla,
  cliente_id,
  fecha,
  COUNT(*) as filas_progreso,
  STRING_AGG(id::text, ', ') as ids_registros
FROM progreso_cliente_nutricion
WHERE cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY cliente_id, fecha
HAVING COUNT(*) > 1
ORDER BY fecha DESC;
