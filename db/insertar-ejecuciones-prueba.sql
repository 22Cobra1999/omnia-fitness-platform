-- Script de prueba para insertar ejecuciones de forma más simple

-- 1. PRIMERO VERIFICAR QUÉ TENEMOS
SELECT 
  'VERIFICACION INICIAL' as seccion,
  COUNT(*) as total_ejecuciones_antes
FROM ejecuciones_ejercicio;

-- 2. INSERTAR UNA EJECUCIÓN DE PRUEBA
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
  30 as duracion,
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
WHERE ae.status = 'active'
LIMIT 1;  -- Solo insertar 1 para probar

-- 3. VERIFICAR RESULTADO
SELECT 
  'VERIFICACION DESPUES' as seccion,
  COUNT(*) as total_ejecuciones_despues
FROM ejecuciones_ejercicio;

-- 4. VER LA EJECUCIÓN INSERTADA
SELECT 
  'EJECUCION INSERTADA' as seccion,
  id,
  periodo_id,
  ejercicio_id,
  intensidad_aplicada,
  duracion,
  completado,
  created_at
FROM ejecuciones_ejercicio
ORDER BY created_at DESC
LIMIT 1;

































