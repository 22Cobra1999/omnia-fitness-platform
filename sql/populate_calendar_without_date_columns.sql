-- Script para poblar activity_calendar sin usar columnas de fecha (que ya no existen)
-- Primero, eliminar datos existentes para evitar duplicados
DELETE FROM activity_calendar;

-- Insertar datos en activity_calendar desde fitness_exercises
-- Como las columnas semana, mes, día ya no existen, asignamos valores por defecto
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
    -- Asignar semanas de forma secuencial (1, 2, 3, 4) por actividad
    ((ROW_NUMBER() OVER (PARTITION BY fe.activity_id ORDER BY fe.id) - 1) % 4) + 1 as week_number,
    -- Asignar mes 1 por defecto
    '1' as month_number,
    -- Asignar días de la semana de forma rotativa
    CASE ((ROW_NUMBER() OVER (PARTITION BY fe.activity_id ORDER BY fe.id) - 1) % 7)
        WHEN 0 THEN 'lunes'
        WHEN 1 THEN 'martes'
        WHEN 2 THEN 'miércoles'
        WHEN 3 THEN 'jueves'
        WHEN 4 THEN 'viernes'
        WHEN 5 THEN 'sábado'
        WHEN 6 THEN 'domingo'
    END as day_name,
    NULL as calculated_date, -- Se calculará después
    FALSE as is_replicated,
    NULL as source_week,
    NOW() as created_at
FROM fitness_exercises fe
WHERE fe.activity_id IS NOT NULL;

-- Verificar los resultados
SELECT 
    'Población completada' as status,
    COUNT(*) as total_entries,
    COUNT(DISTINCT activity_id) as unique_activities,
    COUNT(DISTINCT fitness_exercise_id) as unique_exercises,
    COUNT(DISTINCT week_number) as unique_weeks,
    COUNT(DISTINCT month_number) as unique_months
FROM activity_calendar;
