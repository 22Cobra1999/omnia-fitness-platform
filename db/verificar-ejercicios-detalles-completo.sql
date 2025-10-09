-- Verificar estructura completa de la tabla ejercicios_detalles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles' 
ORDER BY ordinal_position;

-- Ver algunos registros de ejemplo para entender la estructura actual
SELECT 
    id,
    activity_id,
    nombre_ejercicio,
    tipo,
    descripcion,
    equipo,
    body_parts,
    one_rm,
    video_url,
    variantes,
    created_at
FROM ejercicios_detalles 
WHERE activity_id = 59
LIMIT 3;






































