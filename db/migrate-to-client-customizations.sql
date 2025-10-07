-- Script de migración: Crear personalizaciones para clientes existentes
-- Este script toma los datos actuales de fitness_exercises y crea personalizaciones por cliente

-- 1. Primero, crear personalizaciones para todos los clientes que tienen enrollments activos
INSERT INTO client_exercise_customizations (
    fitness_exercise_id,
    client_id,
    detalle_series,
    duracion_min,
    one_rm,
    calorias,
    completed,
    completed_at,
    nota_cliente
)
SELECT 
    fe.id as fitness_exercise_id,
    ae.client_id,
    fe.detalle_series,                     -- Migrar detalle_series existente (series, reps y peso)
    fe.duracion_min,                       -- Migrar duración existente
    fe.one_rm,                             -- Migrar 1RM existente
    fe.calorias,                           -- Migrar calorías existentes
    fe.completed,                          -- Migrar estado de completado
    fe.completed_at,                       -- Migrar fecha de completado
    fe.nota_cliente                        -- Migrar notas del cliente
FROM fitness_exercises fe
JOIN activity_enrollments ae ON fe.activity_id = ae.activity_id
WHERE ae.status = 'active'
  AND ae.client_id IS NOT NULL
  AND NOT EXISTS (
    -- Evitar duplicados
    SELECT 1 FROM client_exercise_customizations cec 
    WHERE cec.fitness_exercise_id = fe.id 
      AND cec.client_id = ae.client_id
  );

-- 2. Actualizar client_id en fitness_exercises para ejercicios que ya tienen client_id
UPDATE fitness_exercises 
SET client_id = (
    SELECT ae.client_id 
    FROM activity_enrollments ae 
    WHERE ae.activity_id = fitness_exercises.activity_id 
      AND ae.status = 'active'
    LIMIT 1
)
WHERE client_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM activity_enrollments ae 
    WHERE ae.activity_id = fitness_exercises.activity_id 
      AND ae.status = 'active'
  );

-- 3. Crear personalizaciones para ejercicios que no tienen client_id específico
-- (Estos serán los ejercicios "maestros" que se pueden asignar a cualquier cliente)
INSERT INTO client_exercise_customizations (
    fitness_exercise_id,
    client_id,
    detalle_series,
    duracion_min,
    one_rm,
    calorias,
    completed,
    completed_at,
    nota_cliente
)
SELECT 
    fe.id as fitness_exercise_id,
    ae.client_id,
    fe.detalle_series,                     -- Migrar detalle_series existente
    fe.duracion_min,
    fe.one_rm,
    fe.calorias,
    FALSE as completed,                    -- Inicializar como no completado
    NULL as completed_at,
    NULL as nota_cliente
FROM fitness_exercises fe
JOIN activity_enrollments ae ON fe.activity_id = ae.activity_id
WHERE fe.client_id IS NULL
  AND ae.status = 'active'
  AND ae.client_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM client_exercise_customizations cec 
    WHERE cec.fitness_exercise_id = fe.id 
      AND cec.client_id = ae.client_id
  );

-- 4. Verificar la migración
SELECT 
    'Ejercicios migrados' as descripcion,
    COUNT(*) as total
FROM client_exercise_customizations;

SELECT 
    'Clientes con personalizaciones' as descripcion,
    COUNT(DISTINCT client_id) as total
FROM client_exercise_customizations;

SELECT 
    'Ejercicios con personalizaciones' as descripcion,
    COUNT(DISTINCT fitness_exercise_id) as total
FROM client_exercise_customizations;




