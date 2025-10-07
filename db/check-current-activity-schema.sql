-- Verificar si activity_program_info existe
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado
FROM information_schema.tables 
WHERE table_name = 'activity_program_info' 
AND table_schema = 'public';

-- Verificar estructura de activities
SELECT 
    'activities' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'activities'
AND table_schema = 'public'
ORDER BY ordinal_position;
