-- Script para verificar la estructura actual de la tabla ejercicios_detalles
-- Ejecutar antes de hacer la limpieza

-- 1. Verificar si la tabla existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejercicios_detalles')
        THEN 'Tabla ejercicios_detalles EXISTE'
        ELSE 'Tabla ejercicios_detalles NO EXISTE'
    END as estado_tabla;

-- 2. Mostrar estructura completa de la tabla
SELECT 
    'Estructura actual de ejercicios_detalles:' as informacion,
    column_name as nombre_columna,
    data_type as tipo_dato,
    is_nullable as permite_nulo,
    column_default as valor_por_defecto,
    character_maximum_length as longitud_maxima
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 3. Contar registros en la tabla
SELECT 
    'Total de registros en ejercicios_detalles:' as informacion,
    COUNT(*) as cantidad_registros
FROM ejercicios_detalles;

-- 4. Verificar columnas que podrían ser obsoletas
SELECT 
    'Columnas que podrían ser obsoletas:' as informacion,
    column_name as nombre_columna,
    data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
    AND column_name IN ('semana', 'dia', 'día', 'periodos', 'periodo', 'week', 'day', 'period')
ORDER BY column_name;

-- 5. Mostrar algunas filas de ejemplo para entender los datos
SELECT 
    'Ejemplos de datos en ejercicios_detalles:' as informacion,
    *
FROM ejercicios_detalles 
LIMIT 5;

-- 6. Verificar si hay índices en la tabla
SELECT 
    'Índices en ejercicios_detalles:' as informacion,
    indexname as nombre_indice,
    indexdef as definicion_indice
FROM pg_indexes 
WHERE tablename = 'ejercicios_detalles';

-- 7. Verificar si hay triggers en la tabla
SELECT 
    'Triggers en ejercicios_detalles:' as informacion,
    trigger_name as nombre_trigger,
    event_manipulation as evento,
    action_statement as accion
FROM information_schema.triggers 
WHERE event_object_table = 'ejercicios_detalles';























