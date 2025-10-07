-- Script para verificar el esquema de la tabla coaches
-- Ejecutar en Supabase SQL Editor

-- Ver estructura de la tabla coaches
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
ORDER BY ordinal_position;

-- Ver datos de ejemplo
SELECT * FROM coaches LIMIT 1;

-- Ver todas las tablas relacionadas con coaches
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%coach%' OR table_name LIKE '%user%';
