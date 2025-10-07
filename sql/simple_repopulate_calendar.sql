-- Script simple para repoblar activity_calendar
-- Paso 1: Verificar datos existentes

-- Contar registros
SELECT COUNT(*) as fitness_exercises_count FROM fitness_exercises;
SELECT COUNT(*) as activity_enrollments_count FROM activity_enrollments;
SELECT COUNT(*) as activity_calendar_count FROM activity_calendar;

-- Paso 2: Insertar datos básicos en activity_calendar
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
    NULL as calculated_date, -- Se calculará después
    FALSE as is_replicated,
    NULL as source_week,
    NOW() as created_at
FROM fitness_exercises fe
WHERE fe.activity_id IS NOT NULL;

-- Paso 3: Verificar resultado
SELECT COUNT(*) as total_insertados FROM activity_calendar;
