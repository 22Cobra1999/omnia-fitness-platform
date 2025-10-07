-- ========================================
-- QUERIES PARA INVESTIGAR TRIGGERS Y ESTRUCTURA
-- ========================================

-- 1. VER TODOS LOS TRIGGERS EN LAS TABLAS RELEVANTES
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement,
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table IN ('ejecuciones_ejercicio', 'activity_enrollments')
ORDER BY event_object_table, trigger_name;

-- 2. VER LA ESTRUCTURA DE LA TABLA ejecuciones_ejercicio
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VER LA ESTRUCTURA DE LA TABLA activity_enrollments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'activity_enrollments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VER FUNCIONES RELACIONADAS CON PROGRESS O COMPLETADO
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_definition LIKE '%progress%' 
    OR routine_definition LIKE '%completado%'
    OR routine_definition LIKE '%ejecuciones_ejercicio%'
    OR routine_definition LIKE '%activity_enrollments%'
)
ORDER BY routine_name;

-- 5. VER POLÍTICAS RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('ejecuciones_ejercicio', 'activity_enrollments')
ORDER BY tablename, policyname;

-- 6. VER CONSTRAINTS Y FOREIGN KEYS
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('ejecuciones_ejercicio', 'activity_enrollments')
ORDER BY tc.table_name, tc.constraint_type;

-- 7. VER ÍNDICES EN LAS TABLAS
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('ejecuciones_ejercicio', 'activity_enrollments')
ORDER BY tablename, indexname;

-- 8. VER TRIGGERS ESPECÍFICOS CON SU CÓDIGO COMPLETO
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname IN ('ejecuciones_ejercicio', 'activity_enrollments')
ORDER BY c.relname, p.proname;

-- 9. VER EL ESTADO ACTUAL DE UNA EJECUCIÓN ESPECÍFICA
SELECT 
    id,
    completado,
    updated_at,
    created_at,
    client_id,
    fecha_ejercicio
FROM ejecuciones_ejercicio 
WHERE id = 1934 AND client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 10. VER SI EXISTE LA COLUMNA PROGRESS EN ACTIVITY_ENROLLMENTS
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'activity_enrollments' 
AND column_name = 'progress'
AND table_schema = 'public';

-- 11. VER TODAS LAS COLUMNAS DE ACTIVITY_ENROLLMENTS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activity_enrollments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
