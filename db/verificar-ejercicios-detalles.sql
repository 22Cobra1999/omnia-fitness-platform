-- Verificar estructura de la tabla ejercicios_detalles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles' 
ORDER BY ordinal_position;


































