-- Script para repoblar la tabla activity_calendar
-- Basado en los datos existentes de fitness_exercises y activity_enrollments

-- Primero, verificar qué datos tenemos
SELECT 'Verificando datos existentes...' as status;

-- Contar registros en cada tabla
SELECT 
    'fitness_exercises' as tabla,
    COUNT(*) as total_registros
FROM fitness_exercises
UNION ALL
SELECT 
    'activity_enrollments' as tabla,
    COUNT(*) as total_registros
FROM activity_enrollments
UNION ALL
SELECT 
    'activity_calendar' as tabla,
    COUNT(*) as total_registros
FROM activity_calendar;

-- Ver algunos ejemplos de fitness_exercises para entender la estructura
SELECT 'Ejemplos de fitness_exercises:' as info;
SELECT 
    id,
    activity_id,
    nombre_actividad,
    semana,
    mes,
    día,
    created_at
FROM fitness_exercises 
LIMIT 5;

-- Ver algunos ejemplos de activity_enrollments
SELECT 'Ejemplos de activity_enrollments:' as info;
SELECT 
    id,
    client_id,
    start_date,
    status,
    created_at
FROM activity_enrollments 
LIMIT 5;

-- Ahora repoblar activity_calendar
-- Insertar datos basados en fitness_exercises existentes
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

-- Verificar el resultado
SELECT 'Datos insertados en activity_calendar:' as resultado;
SELECT COUNT(*) as total_insertados FROM activity_calendar;

-- Mostrar algunos ejemplos de los datos insertados
SELECT 'Ejemplos de activity_calendar repoblada:' as info;
SELECT 
    id,
    activity_id,
    fitness_exercise_id,
    week_number,
    month_number,
    day_name,
    calculated_date,
    is_replicated,
    created_at
FROM activity_calendar 
ORDER BY activity_id, week_number, month_number
LIMIT 10;
