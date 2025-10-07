-- Debug del progreso del cliente Franco
-- Verificar paso a paso qué está pasando

-- 1. VERIFICAR INSCRIPCIONES DEL CLIENTE
SELECT 
  'INSCRIPCIONES' as seccion,
  ae.id as enrollment_id,
  ae.client_id,
  ae.activity_id,
  ae.status,
  ae.start_date,
  ae.amount_paid,
  a.title as actividad
FROM activity_enrollments ae
JOIN activities a ON a.id = ae.activity_id
WHERE ae.client_id = (SELECT id FROM clients WHERE email LIKE '%hotmail%' LIMIT 1);

-- 2. VERIFICAR PERÍODOS ASIGNADOS
SELECT 
  'PERIODOS ASIGNADOS' as seccion,
  pa.id as periodo_id,
  pa.enrollment_id,
  pa.created_at,
  pa.duracion_semanas
FROM periodos_asignados pa
WHERE pa.enrollment_id IN (
  SELECT ae.id FROM activity_enrollments ae 
  WHERE ae.client_id = (SELECT id FROM clients WHERE email LIKE '%hotmail%' LIMIT 1)
);

-- 3. VERIFICAR EJERCICIOS ORGANIZADOS PARA LAS ACTIVIDADES
SELECT 
  'EJERCICIOS ORGANIZADOS' as seccion,
  oe.id as organizacion_id,
  oe.activity_id,
  oe.semana,
  oe.dia,
  oe.bloque,
  oe.ejercicio_id,
  ed.nombre_ejercicio
FROM organizacion_ejercicios oe
JOIN ejercicios_detalles ed ON ed.id = oe.ejercicio_id
WHERE oe.activity_id IN (
  SELECT ae.activity_id FROM activity_enrollments ae 
  WHERE ae.client_id = (SELECT id FROM clients WHERE email LIKE '%hotmail%' LIMIT 1)
)
ORDER BY oe.activity_id, oe.semana, oe.dia, oe.bloque;

-- 4. VERIFICAR EJECUCIONES DE EJERCICIOS
SELECT 
  'EJECUCIONES' as seccion,
  ee.id as ejecucion_id,
  ee.periodo_id,
  ee.ejercicio_id,
  ee.completado,
  ee.fecha_ejecucion,
  ee.completed_at
FROM ejecuciones_ejercicio ee
WHERE ee.periodo_id IN (
  SELECT pa.id FROM periodos_asignados pa
  WHERE pa.enrollment_id IN (
    SELECT ae.id FROM activity_enrollments ae 
    WHERE ae.client_id = (SELECT id FROM clients WHERE email LIKE '%hotmail%' LIMIT 1)
  )
);

-- 5. VERIFICAR INTENSIDADES DISPONIBLES
SELECT 
  'INTENSIDADES' as seccion,
  i.id as intensidad_id,
  i.ejercicio_id,
  i.nombre as nivel_intensidad,
  i.reps,
  i.series,
  i.peso,
  ed.nombre_ejercicio
FROM intensidades i
JOIN ejercicios_detalles ed ON ed.id = i.ejercicio_id
WHERE i.ejercicio_id IN (
  SELECT DISTINCT oe.ejercicio_id FROM organizacion_ejercicios oe
  WHERE oe.activity_id IN (
    SELECT ae.activity_id FROM activity_enrollments ae 
    WHERE ae.client_id = (SELECT id FROM clients WHERE email LIKE '%hotmail%' LIMIT 1)
  )
)
ORDER BY i.ejercicio_id, i.orden;

































