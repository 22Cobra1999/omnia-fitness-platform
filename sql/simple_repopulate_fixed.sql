-- Query simple para repoblar activity_calendar
-- Asigna lunes como único día y distribuye en 4 semanas

-- 1. Limpiar tabla
DELETE FROM activity_calendar;

-- 2. Insertar datos con distribución en 4 semanas
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
    -- Distribuir en 4 semanas: 1, 2, 3, 4, 1, 2, 3, 4, ...
    ((ROW_NUMBER() OVER (PARTITION BY fe.activity_id ORDER BY fe.id) - 1) % 4) + 1 as week_number,
    1 as month_number,
    'lunes' as day_name,
    -- Calcular fecha: start_date + (semana - 1) * 7 días + 1 día (lunes)
    CASE
        WHEN ae.start_date IS NOT NULL THEN
            ae.start_date + 
            INTERVAL '1 day' + -- Lunes
            INTERVAL '7 days' * (((ROW_NUMBER() OVER (PARTITION BY fe.activity_id ORDER BY fe.id) - 1) % 4))
        ELSE NULL
    END as calculated_date,
    FALSE as is_replicated,
    NULL as source_week,
    NOW() as created_at
FROM fitness_exercises fe
LEFT JOIN activity_enrollments ae ON fe.activity_id = ae.id
WHERE fe.activity_id IS NOT NULL;

-- 3. Verificar resultado
SELECT COUNT(*) as registros_insertados FROM activity_calendar;
