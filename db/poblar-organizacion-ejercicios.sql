-- Script para poblar organizacion_ejercicios con datos de ejemplo
-- para las actividades existentes

-- 1. Ver actividades existentes
SELECT 
  'ACTIVIDADES EXISTENTES' as seccion,
  id,
  title,
  type
FROM activities
ORDER BY id;

-- 2. Crear ejercicios organizados para la actividad de yoga (ID 48)
INSERT INTO organizacion_ejercicios (activity_id, semana, dia, ejercicio_id, bloque, orden)
SELECT 
  48 as activity_id,
  generate_series(1, 3) as semana,  -- 3 semanas
  generate_series(1, 7) as dia,     -- 7 días por semana
  (SELECT id FROM ejercicios_detalles ORDER BY RANDOM() LIMIT 1) as ejercicio_id,
  1 as bloque,
  generate_series(1, 21) as orden   -- 21 ejercicios total (3 semanas x 7 días)
ON CONFLICT (activity_id, semana, dia, bloque, orden) DO NOTHING;

-- 3. Crear ejercicios organizados para el programa de fuerza (ID 59)
INSERT INTO organizacion_ejercicios (activity_id, semana, dia, ejercicio_id, bloque, orden)
SELECT 
  59 as activity_id,
  generate_series(1, 8) as semana,  -- 8 semanas
  generate_series(1, 7) as dia,     -- 7 días por semana
  (SELECT id FROM ejercicios_detalles ORDER BY RANDOM() LIMIT 1) as ejercicio_id,
  1 as bloque,
  generate_series(1, 56) as orden   -- 56 ejercicios total (8 semanas x 7 días)
ON CONFLICT (activity_id, semana, dia, bloque, orden) DO NOTHING;

-- 4. Verificar resultado
SELECT 
  'RESULTADO ORGANIZACION EJERCICIOS' as seccion,
  activity_id,
  COUNT(*) as total_ejercicios,
  MIN(semana) as semana_min,
  MAX(semana) as semana_max
FROM organizacion_ejercicios
GROUP BY activity_id
ORDER BY activity_id;

































