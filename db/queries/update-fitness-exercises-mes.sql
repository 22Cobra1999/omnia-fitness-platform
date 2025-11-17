-- Actualizar la columna 'mes' en fitness_exercises para que tenga valor 1 en lugar de null
UPDATE fitness_exercises 
SET mes = 1 
WHERE mes IS NULL;

-- Verificar que se actualizaron los registros
SELECT id, nombre_actividad, mes, semana, día 
FROM fitness_exercises 
WHERE mes = 1;
