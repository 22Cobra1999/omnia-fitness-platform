-- Verificar la estructura actual de activity_enrollments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'activity_enrollments' 
ORDER BY ordinal_position;
