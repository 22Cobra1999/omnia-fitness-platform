-- Actualizar body_parts en fitness_exercises con combinaciones de partes del cuerpo
-- Usando diferentes combinaciones para variedad en los ejercicios

-- Combinación 1: Ejercicios de tren superior
UPDATE fitness_exercises 
SET body_parts = 'Pecho;Hombros;Tríceps' 
WHERE tipo_ejercicio IN ('Fuerza', 'HIIT') 
AND nombre_actividad LIKE '%Flexiones%'
AND body_parts IS NULL
LIMIT 10;

-- Combinación 2: Ejercicios de core y tren inferior
UPDATE fitness_exercises 
SET body_parts = 'Core;Cuádriceps;Glúteos' 
WHERE tipo_ejercicio IN ('Funcional', 'Aeróbico') 
AND nombre_actividad LIKE '%Sentadilla%'
AND body_parts IS NULL
LIMIT 8;

-- Combinación 3: Ejercicios de core completo
UPDATE fitness_exercises 
SET body_parts = 'Core;Abdominales;Lumbares' 
WHERE nombre_actividad LIKE '%Plancha%'
AND body_parts IS NULL
LIMIT 12;

-- Combinación 4: Ejercicios de espalda y brazos
UPDATE fitness_exercises 
SET body_parts = 'Espalda;Dorsales;Bíceps' 
WHERE nombre_actividad LIKE '%Remo%'
AND body_parts IS NULL
LIMIT 8;

-- Combinación 5: Ejercicios full body
UPDATE fitness_exercises 
SET body_parts = 'Piernas;Core;Hombros' 
WHERE nombre_actividad LIKE '%Burpees%'
AND body_parts IS NULL
LIMIT 10;

-- Verificar los resultados
SELECT 
    id,
    nombre_actividad,
    tipo_ejercicio,
    body_parts,
    nivel_intensidad
FROM fitness_exercises 
WHERE body_parts IS NOT NULL
ORDER BY nombre_actividad
LIMIT 20;
