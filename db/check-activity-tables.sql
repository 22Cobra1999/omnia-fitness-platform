-- Verificar tablas relacionadas con activities
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('activities', 'activity_program_info', 'activity_consultation_info', 'activity_media')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
