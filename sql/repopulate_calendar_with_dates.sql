-- Query para repoblar activity_calendar con fechas calculadas
-- Basado en start_date de activity_enrollments

-- Paso 1: Limpiar tabla existente
DELETE FROM activity_calendar;

-- Paso 2: Insertar datos con fechas calculadas
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
    COALESCE(CAST(fe.semana AS INTEGER), 1) as week_number,
    COALESCE(CAST(fe.mes AS INTEGER), 1) as month_number,
    COALESCE(fe.día, 'lunes') as day_name,
    CASE
        WHEN ae.start_date IS NOT NULL AND fe.semana IS NOT NULL AND fe.día IS NOT NULL THEN
            -- Calcular la fecha real basándose en la lógica del calendario
            (
                SELECT
                    CASE
                        WHEN fe.día = 'lunes' THEN ae.start_date + INTERVAL '1 day' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
                        WHEN fe.día = 'martes' THEN ae.start_date + INTERVAL '2 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
                        WHEN fe.día = 'miércoles' THEN ae.start_date + INTERVAL '3 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
                        WHEN fe.día = 'jueves' THEN ae.start_date + INTERVAL '4 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
                        WHEN fe.día = 'viernes' THEN ae.start_date + INTERVAL '5 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
                        WHEN fe.día = 'sábado' THEN ae.start_date + INTERVAL '6 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
                        WHEN fe.día = 'domingo' THEN ae.start_date + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
                        ELSE ae.start_date
                    END
            )
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
    COUNT(*) as total_registros_insertados
FROM activity_calendar;

-- Paso 4: Mostrar algunos ejemplos
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
ORDER BY activity_id, week_number, month_number
LIMIT 10;
