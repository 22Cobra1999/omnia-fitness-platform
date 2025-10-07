-- Query para repoblar activity_calendar con datos actuales
-- Asigna lunes como único día y distribuye en 4 semanas

-- Paso 1: Limpiar tabla existente
DELETE FROM activity_calendar;

-- Paso 2: Insertar datos con distribución automática en 4 semanas
INSERT INTO activity_calendar (
    activity_id,
    fitness_exercise_id,
    week_number,
    month_number,
    day_name,
    calculated_date,
    is_replicated,
    source_week,
    created_at
)
SELECT 
    fe.activity_id,
    fe.id as fitness_exercise_id,
    -- Distribuir en 4 semanas usando ROW_NUMBER
    ((ROW_NUMBER() OVER (PARTITION BY fe.activity_id ORDER BY fe.id) - 1) % 4) + 1 as week_number,
    1 as month_number, -- Todos en el mes 1
    'lunes' as day_name, -- Todos los lunes
    CASE
        WHEN ae.start_date IS NOT NULL THEN
            -- Calcular fecha: start_date + (semana - 1) * 7 días + 1 día (para lunes)
            ae.start_date + 
            INTERVAL '1 day' + -- Lunes (1 día después del domingo)
            INTERVAL '7 days' * (((ROW_NUMBER() OVER (PARTITION BY fe.activity_id ORDER BY fe.id) - 1) % 4))
        ELSE NULL
    END as calculated_date,
    FALSE as is_replicated,
    NULL as source_week,
    NOW() as created_at
FROM fitness_exercises fe
LEFT JOIN activity_enrollments ae ON fe.activity_id = ae.id
WHERE fe.activity_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM activity_enrollments WHERE id = fe.activity_id);

-- Paso 3: Verificar resultado
SELECT 
    'Repoblación completada' as status,
    COUNT(*) as total_registros_insertados,
    COUNT(calculated_date) as registros_con_fecha,
    COUNT(*) - COUNT(calculated_date) as registros_sin_fecha
FROM activity_calendar;

-- Paso 4: Mostrar distribución por semanas
SELECT 
    week_number,
    COUNT(*) as ejercicios_por_semana,
    MIN(calculated_date) as primera_fecha,
    MAX(calculated_date) as ultima_fecha
FROM activity_calendar 
WHERE calculated_date IS NOT NULL
GROUP BY week_number
ORDER BY week_number;

-- Paso 5: Mostrar algunos ejemplos
SELECT 
    'Ejemplos de datos insertados:' as info,
    id,
    activity_id,
    fitness_exercise_id,
    week_number,
    month_number,
    day_name,
    calculated_date,
    is_replicated
FROM activity_calendar 
WHERE calculated_date IS NOT NULL
ORDER BY activity_id, week_number
LIMIT 10;
