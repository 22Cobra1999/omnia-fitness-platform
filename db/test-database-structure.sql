-- Script para verificar la estructura de la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de ejercicios_detalles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
ORDER BY 
    ordinal_position;

-- 2. Verificar estructura de intensidades
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'intensidades' 
ORDER BY 
    ordinal_position;

-- 3. Verificar estructura de organizacion_ejercicios
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'organizacion_ejercicios' 
ORDER BY 
    ordinal_position;

-- 4. Verificar datos en ejercicios_detalles para actividad 59
SELECT 
    id,
    nombre_ejercicio,
    intensidad,
    calorias,
    detalle_series
FROM ejercicios_detalles 
WHERE activity_id = 59
LIMIT 5;

-- 5. Verificar datos en organizacion_ejercicios para actividad 59
SELECT 
    id,
    activity_id,
    semana,
    dia,
    ejercicio_id
FROM organizacion_ejercicios 
WHERE activity_id = 59
LIMIT 5;

-- 6. Verificar datos en intensidades
SELECT 
    id,
    ejercicio_id,
    intensidad,
    detalle_series,
    calorias
FROM intensidades 
LIMIT 5;

































