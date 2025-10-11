-- Verificar datos en organizacion_ejercicios para las actividades existentes

-- 1. Ver todas las actividades
SELECT 
  'ACTIVIDADES EXISTENTES' as seccion,
  id,
  title,
  type
FROM activities
ORDER BY id;

-- 2. Ver organizacion_ejercicios
SELECT 
  'ORGANIZACION EJERCICIOS' as seccion,
  activity_id,
  COUNT(*) as total_ejercicios,
  MIN(semana) as semana_min,
  MAX(semana) as semana_max
FROM organizacion_ejercicios
GROUP BY activity_id
ORDER BY activity_id;

-- 3. Verificar si hay ejercicios para las actividades específicas
SELECT 
  'EJERCICIOS POR ACTIVIDAD' as seccion,
  a.id as activity_id,
  a.title,
  a.type,
  COUNT(oe.id) as ejercicios_organizados
FROM activities a
LEFT JOIN organizacion_ejercicios oe ON oe.activity_id = a.id
GROUP BY a.id, a.title, a.type
ORDER BY a.id;








































