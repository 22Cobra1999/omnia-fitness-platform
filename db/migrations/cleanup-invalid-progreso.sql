-- Eliminar registros de progreso_cliente que fueron creados incorrectamente
-- Estos registros fueron creados para días sin planificación (copiando de semanas anteriores)

-- Actividad 78: Solo tiene planificación para:
-- Semana 1: Lunes
-- Semana 2: Miércoles, Jueves

-- Registros incorrectos a eliminar:
-- ID 20-27 excepto 18-19 (que son correctos)

DELETE FROM progreso_cliente 
WHERE id IN (20, 21, 22, 23, 24, 25, 26, 27) 
  AND actividad_id = 78
  AND cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- Verificar que solo quedan registros con planificación válida
SELECT 
  id,
  fecha,
  to_char(fecha, 'Day') as dia_semana,
  ejercicios_completados,
  ejercicios_pendientes
FROM progreso_cliente
WHERE actividad_id = 78
  AND cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY fecha;




















