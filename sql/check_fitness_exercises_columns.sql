-- Verificar las columnas existentes en fitness_exercises
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'fitness_exercises'
ORDER BY ordinal_position;
