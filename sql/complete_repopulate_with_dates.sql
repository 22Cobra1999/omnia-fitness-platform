-- Query completa para repoblar activity_calendar con fechas calculadas
-- Basado en start_date de activity_enrollments

-- Limpiar tabla existente
DELETE FROM activity_calendar;

-- Insertar datos con fechas calculadas
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
            -- Calcular fecha basada en start_date + semanas + días
            ae.start_date + 
            INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (COALESCE(CAST(fe.semana AS INTEGER), 1) - 1)) +
            CASE fe.día
                WHEN 'lunes' THEN INTERVAL '1 day'
                WHEN 'martes' THEN INTERVAL '2 days'
                WHEN 'miércoles' THEN INTERVAL '3 days'
                WHEN 'jueves' THEN INTERVAL '4 days'
                WHEN 'viernes' THEN INTERVAL '5 days'
                WHEN 'sábado' THEN INTERVAL '6 days'
                WHEN 'domingo' THEN INTERVAL '0 days'
                ELSE INTERVAL '1 day'
            END
        ELSE NULL
    END as calculated_date,
    FALSE as is_replicated,
    NULL as source_week,
    NOW() as created_at
FROM fitness_exercises fe
LEFT JOIN activity_enrollments ae ON fe.activity_id = ae.id
WHERE fe.activity_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM activity_enrollments WHERE id = fe.activity_id);

-- Verificar resultado
SELECT 
    COUNT(*) as total_registros,
    COUNT(calculated_date) as registros_con_fecha,
    COUNT(*) - COUNT(calculated_date) as registros_sin_fecha
FROM activity_calendar;

-- Mostrar ejemplos
SELECT 
    id,
    activity_id,
    week_number,
    month_number,
    day_name,
    calculated_date,
    is_replicated
FROM activity_calendar 
WHERE calculated_date IS NOT NULL
ORDER BY activity_id, week_number, month_number
LIMIT 10;
