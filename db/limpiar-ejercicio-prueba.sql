-- Limpiar el ejercicio de prueba que creamos
DELETE FROM ejercicios_detalles 
WHERE nombre_ejercicio = 'Ejercicio de Prueba';

-- Verificar que se eliminó
SELECT COUNT(*) as ejercicios_restantes 
FROM ejercicios_detalles 
WHERE nombre_ejercicio = 'Ejercicio de Prueba';


































