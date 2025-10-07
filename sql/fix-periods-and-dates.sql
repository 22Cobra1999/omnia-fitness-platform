-- Script para corregir períodos y fechas
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Corregir períodos en ejercicios_detalles
-- Los ejercicios que tienen periodo_id 37 en ejecuciones_ejercicio deben ser periodo 1
UPDATE ejercicios_detalles 
SET periodo = 1
WHERE id IN (
  SELECT DISTINCT ejercicio_id 
  FROM ejecuciones_ejercicio 
  WHERE periodo_id = 37
);

-- Los ejercicios que tienen periodo_id 38 en ejecuciones_ejercicio deben ser periodo 2
UPDATE ejercicios_detalles 
SET periodo = 2
WHERE id IN (
  SELECT DISTINCT ejercicio_id 
  FROM ejecuciones_ejercicio 
  WHERE periodo_id = 38
);

-- PASO 2: Verificar que los períodos se actualizaron correctamente
SELECT 
  'PERIODOS EN EJERCICIOS_DETALLES' as seccion,
  periodo,
  COUNT(*) as count
FROM ejercicios_detalles 
GROUP BY periodo
ORDER BY periodo;

-- PASO 3: Calcular nuevas fechas para período 1 (periodo_id 37)
-- Período 1: fechas desde start_date (2025-09-22)
UPDATE ejecuciones_ejercicio 
SET fecha_ejercicio = (
  -- Calcular fecha basada en semana y día desde 2025-09-22
  '2025-09-22'::date + 
  (ejercicios_detalles.semana - 1) * 7 + 
  (ejercicios_detalles.dia - 1)
)::date
FROM ejercicios_detalles 
WHERE ejecuciones_ejercicio.ejercicio_id = ejercicios_detalles.id 
  AND ejecuciones_ejercicio.periodo_id = 37
  AND ejercicios_detalles.periodo = 1;

-- PASO 4: Calcular nuevas fechas para período 2 (periodo_id 38)
-- Período 2: fechas desde 4 semanas después (2025-10-20)
UPDATE ejecuciones_ejercicio 
SET fecha_ejercicio = (
  -- Calcular fecha basada en semana y día desde 2025-10-20 (4 semanas después)
  '2025-10-20'::date + 
  (ejercicios_detalles.semana - 1) * 7 + 
  (ejercicios_detalles.dia - 1)
)::date
FROM ejercicios_detalles 
WHERE ejecuciones_ejercicio.ejercicio_id = ejercicios_detalles.id 
  AND ejecuciones_ejercicio.periodo_id = 38
  AND ejercicios_detalles.periodo = 2;

-- PASO 5: Verificar el resultado
SELECT 
  'RESULTADO FINAL' as seccion,
  ee.periodo_id,
  ed.periodo,
  COUNT(*) as count,
  MIN(ee.fecha_ejercicio) as fecha_min,
  MAX(ee.fecha_ejercicio) as fecha_max
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
GROUP BY ee.periodo_id, ed.periodo
ORDER BY ee.periodo_id, ed.periodo;

-- PASO 6: Mostrar algunas fechas de ejemplo
SELECT 
  'EJEMPLOS DE FECHAS' as seccion,
  ee.id,
  ee.ejercicio_id,
  ee.periodo_id,
  ee.fecha_ejercicio,
  ed.periodo,
  ed.semana,
  ed.dia,
  ed.orden,
  ed.nombre_ejercicio
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
ORDER BY ee.periodo_id, ed.orden
LIMIT 10;






























