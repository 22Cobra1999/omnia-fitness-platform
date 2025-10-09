-- Query para clientes que compraron pero no han comenzado la actividad

SELECT 
  c.full_name as "Cliente",
  c.email as "Email", 
  a.title as "Actividad",
  a.type as "Tipo",
  ae.amount_paid as "Monto Pagado",
  ae.payment_date as "Fecha Compra",
  EXTRACT(DAYS FROM NOW() - ae.payment_date) as "Días desde Compra",
  COUNT(DISTINCT oe.id) as "Total Ejercicios Disponibles"
FROM activity_enrollments ae
JOIN clients c ON c.id = ae.client_id
JOIN activities a ON a.id = ae.activity_id
LEFT JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
LEFT JOIN organizacion_ejercicios oe ON oe.activity_id = ae.activity_id
WHERE pa.id IS NULL  -- No tienen período asignado = no comenzaron
  AND ae.status = 'active'
GROUP BY 
  c.id, c.full_name, c.email, 
  a.id, a.title, a.type, 
  ae.amount_paid, ae.payment_date
ORDER BY 
  ae.payment_date ASC;  -- Más antiguos primero (más urgente contactar)







































