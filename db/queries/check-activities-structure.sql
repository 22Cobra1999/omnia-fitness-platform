-- Query para verificar la estructura de la tabla activities y ver ejemplos de program_data
-- Esto nos ayudará a entender cómo se almacenan las metas

-- Ver estructura completa de la tabla activities
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position

-- Ver ejemplos de program_data para actividades de fitness y nutrición
SELECT 
    id,
    title,
    type,
    program_data
FROM activities 
WHERE program_data IS NOT NULL

-- Ver compras recientes con sus actividades para entender la relación
SELECT 
    b.id as banco_id,
    b.activity_id,
    b.amount_paid,
    a.title,
    a.type,
    a.program_data
FROM banco b
LEFT JOIN activities a ON b.activity_id = a.id
WHERE b.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY b.created_at DESC
