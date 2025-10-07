-- Script simple para crear ejecuciones faltantes
-- Sin referencias a columnas que no existen

-- 1. VERIFICAR QUÉ EJECUCIONES FALTAN
SELECT 
  'EJECUCIONES FALTANTES' as seccion,
  COUNT(*) as total_faltantes
FROM periodos_asignados pa
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
WHERE ae.status = 'active'
  AND ee.id IS NULL;

-- 2. CREAR EJECUCIONES FALTANTES (VERSIÓN SIMPLE)
-- Sin ON CONFLICT porque no hay restricción única
INSERT INTO ejecuciones_ejercicio (
  periodo_id,
  ejercicio_id,
  intensidad_aplicada,
  duracion,
  calorias_estimadas,
  fecha_ejecucion,
  completado,
  peso_usado,
  repeticiones_realizadas,
  series_completadas,
  tiempo_real_segundos,
  nota_cliente,
  nota_coach,
  created_at,
  updated_at
)
SELECT 
  pa.id as periodo_id,
  oe.ejercicio_id,
  'Principiante' as intensidad_aplicada,
  30 as duracion,  -- 30 minutos por defecto
  0 as calorias_estimadas,
  CURRENT_DATE as fecha_ejecucion,
  false as completado,
  0 as peso_usado,
  0 as repeticiones_realizadas,
  0 as series_completadas,
  0 as tiempo_real_segundos,
  '' as nota_cliente,
  '' as nota_coach,
  NOW() as created_at,
  NOW() as updated_at
FROM periodos_asignados pa
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
WHERE ae.status = 'active'
  AND ee.id IS NULL;  -- Solo crear las que no existen

-- 3. VERIFICAR RESULTADO
SELECT 
  'RESULTADO' as seccion,
  COUNT(*) as total_ejecuciones_ahora
FROM ejecuciones_ejercicio;

-- 4. VERIFICAR PROGRESO DEL CLIENTE FRANCO
SELECT 
  'PROGRESO FRANCO' as seccion,
  c.full_name as cliente,
  a.title as actividad,
  COUNT(DISTINCT oe.id) as total_ejercicios,
  COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) as ejercicios_completados,
  COUNT(DISTINCT CASE WHEN ee.completado = false THEN ee.id END) as ejercicios_pendientes,
  ROUND((COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) * 100.0 / COUNT(DISTINCT oe.id)), 2) as porcentaje_progreso
FROM activity_enrollments ae
JOIN clients c ON c.id = ae.client_id
JOIN activities a ON a.id = ae.activity_id
JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
WHERE c.email LIKE '%hotmail%'
  AND ae.status = 'active'
GROUP BY c.id, c.full_name, a.id, a.title;
