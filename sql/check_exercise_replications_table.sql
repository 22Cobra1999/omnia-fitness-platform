-- Verificar si la tabla exercise_replications existe y su estructura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'exercise_replications'
ORDER BY ordinal_position;

-- Si no existe, crear la tabla
CREATE TABLE IF NOT EXISTS exercise_replications (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activity_enrollments(id),
    source_exercise_ids INTEGER[],
    source_periods INTEGER[],
    target_periods INTEGER[],
    repetitions INTEGER,
    replication_type VARCHAR(20),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
