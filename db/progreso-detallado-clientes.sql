-- Query detallada del progreso de clientes activos

SELECT 
  c.full_name as "Cliente",
  a.title as "Actividad",
  pa.created_at as "Fecha Inicio",
  EXTRACT(DAYS FROM NOW() - pa.created_at) as "Días Activo",
  COUNT(DISTINCT oe.id) as "Total Ejercicios",
  COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) as "Completados",
  COUNT(DISTINCT CASE WHEN ee.completado = false OR ee.completado IS NULL THEN oe.id END) as "Pendientes",
  ROUND((COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) * 100.0 / COUNT(DISTINCT oe.id)), 2) as "% Progreso",
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) = 0 THEN '🔴 Sin progreso'
    WHEN COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) = COUNT(DISTINCT oe.id) THEN '🟢 Completado'
    WHEN (COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) * 100.0 / COUNT(DISTINCT oe.id)) < 25 THEN '🟡 Progreso bajo'
    WHEN (COUNT(DISTINCT CASE WHEN ee.completado = true THEN ee.id END) * 100.0 / COUNT(DISTINCT oe.id)) < 75 THEN '🟠 Progreso medio'
    ELSE '🟢 Progreso alto'
  END as "Estado",
  -- Última actividad
  MAX(ee.completed_at) as "Última Actividad"
FROM activity_enrollments ae
JOIN clients c ON c.id = ae.client_id
JOIN activities a ON a.id = ae.activity_id
JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
LEFT JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id AND ee.ejercicio_id = oe.ejercicio_id
WHERE ae.status = 'active'
  AND pa.id IS NOT NULL  -- Solo los que comenzaron
GROUP BY 
  c.id, c.full_name, 
  a.id, a.title, 
  pa.created_at
ORDER BY 
  "% Progreso" DESC,  -- Mejor progreso primero
  "Días Activo" DESC;







































