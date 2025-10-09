-- Script para verificar la estructura detallada de las tablas
-- Especialmente periodos_asignados y ejecuciones_ejercicio

-- PASO 1: Verificar estructura completa de periodos_asignados
SELECT 
    'ESTRUCTURA PERIODOS_ASIGNADOS' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'periodos_asignados'
ORDER BY ordinal_position;

-- PASO 2: Verificar estructura completa de ejecuciones_ejercicio
SELECT 
    'ESTRUCTURA EJECUCIONES_EJERCICIO' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio'
ORDER BY ordinal_position;

-- PASO 3: Verificar constraints y relaciones
SELECT 
    'CONSTRAINTS PERIODOS_ASIGNADOS' as seccion,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'periodos_asignados';

SELECT 
    'CONSTRAINTS EJECUCIONES_EJERCICIO' as seccion,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'ejecuciones_ejercicio';

-- PASO 4: Verificar foreign keys
SELECT 
    'FOREIGN KEYS PERIODOS_ASIGNADOS' as seccion,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'periodos_asignados';

SELECT 
    'FOREIGN KEYS EJECUCIONES_EJERCICIO' as seccion,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'ejecuciones_ejercicio';

-- PASO 5: Verificar índices
SELECT 
    'INDICES PERIODOS_ASIGNADOS' as seccion,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'periodos_asignados';

SELECT 
    'INDICES EJECUCIONES_EJERCICIO' as seccion,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ejecuciones_ejercicio';







































