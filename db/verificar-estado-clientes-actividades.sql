-- Query para verificar estado de clientes con actividades compradas
-- Muestra: compras, inicio, ejercicios pendientes, fechas

-- 1. RESUMEN GENERAL DE COMPRAS Y PROGRESO
SELECT 
  'RESUMEN GENERAL' as seccion,
  COUNT(DISTINCT ae.id) as total_inscripciones,
  COUNT(DISTINCT CASE WHEN ae.status = 'active' THEN ae.id END) as inscripciones_activas,
  COUNT(DISTINCT CASE WHEN pa.id IS NOT NULL THEN ae.id END) as clientes_que_comenzaron,
  COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) as ejercicios_completados,
  COUNT(DISTINCT CASE WHEN ee.completado = false OR ee.completado IS NULL THEN oe.id END) as ejercicios_pendientes
FROM activity_enrollments ae
LEFT JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
LEFT JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id;

-- 2. DETALLE POR CLIENTE Y ACTIVIDAD
SELECT 
  'DETALLE POR CLIENTE' as seccion,
  c.full_name as cliente,
  c.email,
  a.title as actividad,
  a.type as tipo_actividad,
  ae.status as estado_inscripcion,
  ae.amount_paid as monto_pagado,
  ae.payment_date as fecha_compra,
  pa.created_at as fecha_inicio,
  COUNT(DISTINCT oe.id) as total_ejercicios,
  COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) as ejercicios_completados,
  COUNT(DISTINCT CASE WHEN ee.completado = false OR ee.completado IS NULL THEN oe.id END) as ejercicios_pendientes,
  CASE 
    WHEN COUNT(DISTINCT oe.id) > 0 THEN 
      ROUND((COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) * 100.0 / COUNT(DISTINCT oe.id)), 2)
    ELSE 0 
  END as porcentaje_progreso,
  CASE 
    WHEN pa.id IS NULL THEN 'No comenzó'
    WHEN COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) = 0 THEN 'Comenzó pero sin progreso'
    WHEN COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) = COUNT(DISTINCT oe.id) THEN 'Completado'
    ELSE 'En progreso'
  END as estado_progreso
FROM activity_enrollments ae
JOIN clients c ON c.id = ae.client_id
JOIN activities a ON a.id = ae.activity_id
LEFT JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
LEFT JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
GROUP BY c.id, c.full_name, c.email, a.id, a.title, a.type, ae.status, ae.amount_paid, ae.payment_date, pa.created_at
ORDER BY ae.payment_date DESC, c.full_name;

-- 3. CLIENTES QUE NO HAN COMENZADO
SELECT 
  'CLIENTES SIN INICIAR' as seccion,
  c.full_name as cliente,
  c.email,
  a.title as actividad,
  ae.payment_date as fecha_compra,
  ae.amount_paid as monto_pagado,
  EXTRACT(DAYS FROM NOW() - ae.payment_date) as dias_desde_compra
FROM activity_enrollments ae
JOIN clients c ON c.id = ae.client_id
JOIN activities a ON a.id = ae.activity_id
LEFT JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
WHERE pa.id IS NULL
  AND ae.status = 'active'
ORDER BY ae.payment_date ASC;

-- 4. CLIENTES CON PROGRESO BAJO (menos del 25%)
SELECT 
  'PROGRESO BAJO' as seccion,
  c.full_name as cliente,
  c.email,
  a.title as actividad,
  pa.created_at as fecha_inicio,
  COUNT(DISTINCT oe.id) as total_ejercicios,
  COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) as ejercicios_completados,
  ROUND((COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) * 100.0 / COUNT(DISTINCT oe.id)), 2) as porcentaje_progreso,
  EXTRACT(DAYS FROM NOW() - pa.created_at) as dias_desde_inicio
FROM activity_enrollments ae
JOIN clients c ON c.id = ae.client_id
JOIN activities a ON a.id = ae.activity_id
JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
LEFT JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
WHERE ae.status = 'active'
  AND COUNT(DISTINCT oe.id) > 0
GROUP BY c.id, c.full_name, c.email, a.id, a.title, pa.created_at
HAVING (COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) * 100.0 / COUNT(DISTINCT oe.id)) < 25
ORDER BY porcentaje_progreso ASC;

-- 5. ESTADÍSTICAS POR TIPO DE ACTIVIDAD
SELECT 
  'ESTADÍSTICAS POR TIPO' as seccion,
  a.type as tipo_actividad,
  COUNT(DISTINCT ae.id) as total_inscripciones,
  COUNT(DISTINCT CASE WHEN pa.id IS NOT NULL THEN ae.id END) as clientes_que_comenzaron,
  ROUND((COUNT(DISTINCT CASE WHEN pa.id IS NOT NULL THEN ae.id END) * 100.0 / COUNT(DISTINCT ae.id)), 2) as porcentaje_inicio,
  AVG(CASE WHEN pa.id IS NOT NULL THEN 
    (SELECT COUNT(*) FROM ejecuciones_ejercicio ee2 
     JOIN periodos_asignados pa2 ON pa2.id = ee2.periodo_id 
     WHERE pa2.enrollment_id = ae.id AND ee2.completado = true)
  END) as promedio_ejercicios_completados
FROM activity_enrollments ae
JOIN activities a ON a.id = ae.activity_id
LEFT JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
WHERE ae.status = 'active'
GROUP BY a.type
ORDER BY total_inscripciones DESC;

-- 6. ACTIVIDADES MÁS POPULARES
SELECT 
  'ACTIVIDADES POPULARES' as seccion,
  a.title as actividad,
  a.type as tipo,
  a.price as precio,
  COUNT(DISTINCT ae.id) as total_compras,
  COUNT(DISTINCT CASE WHEN pa.id IS NOT NULL THEN ae.id END) as clientes_activos,
  SUM(ae.amount_paid) as ingresos_totales,
  ROUND(AVG(ae.amount_paid), 2) as precio_promedio_pagado
FROM activity_enrollments ae
JOIN activities a ON a.id = ae.activity_id
LEFT JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
WHERE ae.status = 'active'
GROUP BY a.id, a.title, a.type, a.price
ORDER BY total_compras DESC, ingresos_totales DESC;

































