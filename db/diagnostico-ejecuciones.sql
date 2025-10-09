-- Diagnóstico completo para entender por qué no se insertan ejecuciones

-- 1. VERIFICAR DATOS BASE
SELECT 
  'DATOS BASE' as seccion,
  'activity_enrollments' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as activos
FROM activity_enrollments;

SELECT 
  'DATOS BASE' as seccion,
  'periodos_asignados' as tabla,
  COUNT(*) as total
FROM periodos_asignados;

SELECT 
  'DATOS BASE' as seccion,
  'organizacion_ejercicios' as tabla,
  COUNT(*) as total
FROM organizacion_ejercicios;

-- 2. VERIFICAR RELACIONES
SELECT 
  'RELACIONES' as seccion,
  ae.id as enrollment_id,
  ae.status,
  pa.id as periodo_id,
  oe.id as organizacion_id,
  oe.ejercicio_id
FROM activity_enrollments ae
JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
WHERE ae.status = 'active'
LIMIT 5;

-- 3. VERIFICAR EJECUCIONES EXISTENTES
SELECT 
  'EJECUCIONES EXISTENTES' as seccion,
  COUNT(*) as total_ejecuciones
FROM ejecuciones_ejercicio;

-- 4. VERIFICAR QUÉ EJECUCIONES FALTAN (DETALLADO)
SELECT 
  'EJECUCIONES FALTANTES DETALLADO' as seccion,
  pa.id as periodo_id,
  oe.ejercicio_id,
  ae.status as enrollment_status,
  ee.id as ejecucion_existente
FROM periodos_asignados pa
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
WHERE ae.status = 'active'
ORDER BY pa.id, oe.ejercicio_id
LIMIT 10;

-- 5. CONTAR EJECUCIONES FALTANTES
SELECT 
  'CONTEO EJECUCIONES FALTANTES' as seccion,
  COUNT(*) as total_faltantes
FROM periodos_asignados pa
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
WHERE ae.status = 'active'
  AND ee.id IS NULL;







































