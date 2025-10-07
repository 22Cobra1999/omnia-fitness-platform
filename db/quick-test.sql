-- Script rápido para verificar la estructura
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name IN ('semana', 'dia', 'periodo', 'bloque', 'orden')
ORDER BY 
    ordinal_position;

-- Verificar si hay datos
SELECT COUNT(*) as total_ejercicios FROM ejercicios_detalles WHERE activity_id = 59;

-- Verificar si las columnas tienen datos
SELECT 
    COUNT(*) as total,
    COUNT(semana) as con_semana,
    COUNT(dia) as con_dia,
    COUNT(periodo) as con_periodo
FROM ejercicios_detalles 
WHERE activity_id = 59;

































