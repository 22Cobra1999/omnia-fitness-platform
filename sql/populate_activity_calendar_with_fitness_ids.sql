-- Script para poblar activity_calendar con los IDs de fitness_exercises
-- Primero, eliminar datos existentes para evitar duplicados
DELETE FROM activity_calendar;

-- Insertar datos en activity_calendar desde fitness_exercises
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

-- Verificar los resultados
SELECT 
    COUNT(*) as total_entries,
    COUNT(DISTINCT activity_id) as unique_activities,
    COUNT(DISTINCT fitness_exercise_id) as unique_exercises
FROM activity_calendar;
