-- Query simple para repoblar activity_calendar
-- Ejecutar paso a paso

-- 1. Limpiar tabla
DELETE FROM activity_calendar;

-- 2. Insertar datos básicos (sin fechas por ahora)
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
    NULL as calculated_date,
    FALSE as is_replicated,
    NULL as source_week,
    NOW() as created_at
FROM fitness_exercises fe
WHERE fe.activity_id IS NOT NULL;

-- 3. Verificar inserción
SELECT COUNT(*) as registros_insertados FROM activity_calendar;
