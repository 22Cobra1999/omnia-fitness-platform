-- Query para arreglar el mapeo de fitness_exercise_id en activity_calendar
-- 1. Limpiar datos existentes
DELETE FROM activity_calendar WHERE activity_id = 59;

-- 2. Insertar datos correctamente mapeados
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
    1 as month_number,
    'lunes' as day_name,
    CASE
        WHEN ae.start_date IS NOT NULL THEN
            -- Calcular fecha correcta: start_date + (semana - 1) * 7 días + 1 día (lunes)
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
WHERE fe.activity_id = 59
ORDER BY fe.id;

-- 3. Verificar resultado
SELECT 
    'Resultado de la corrección:' as info,
    COUNT(*) as total_registros,
    COUNT(fitness_exercise_id) as registros_con_fitness_id,
    COUNT(*) - COUNT(fitness_exercise_id) as registros_sin_fitness_id
FROM activity_calendar 
WHERE activity_id = 59;

-- 4. Mostrar distribución por semanas
SELECT 
    week_number,
    COUNT(*) as ejercicios_por_semana,
    MIN(calculated_date) as primera_fecha,
    MAX(calculated_date) as ultima_fecha
FROM activity_calendar 
WHERE activity_id = 59 AND calculated_date IS NOT NULL
GROUP BY week_number
ORDER BY week_number;

-- 5. Mostrar algunos ejemplos
SELECT 
    'Ejemplos de datos corregidos:' as info,
    id,
    activity_id,
    fitness_exercise_id,
    week_number,
    month_number,
    day_name,
    calculated_date,
    is_replicated
FROM activity_calendar 
WHERE activity_id = 59 AND calculated_date IS NOT NULL
ORDER BY fitness_exercise_id
LIMIT 10;
