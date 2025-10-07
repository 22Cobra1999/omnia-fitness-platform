-- Script para limpiar la tabla organizacion_ejercicios
-- EJECUTAR SOLO DESPUÉS DE VERIFICAR QUE LA MIGRACIÓN FUE EXITOSA

-- PASO 1: Verificar que los datos fueron migrados correctamente
DO $$
DECLARE
    org_count INTEGER;
    det_count INTEGER;
BEGIN
    -- Contar registros en organizacion_ejercicios
    SELECT COUNT(*) INTO org_count FROM organizacion_ejercicios;
    
    -- Contar registros en ejercicios_detalles con datos migrados
    SELECT COUNT(*) INTO det_count FROM ejercicios_detalles WHERE semana IS NOT NULL;
    
    RAISE NOTICE 'Registros en organizacion_ejercicios: %', org_count;
    RAISE NOTICE 'Registros en ejercicios_detalles con semana: %', det_count;
    
    -- Verificar que la migración fue exitosa
    IF org_count = det_count THEN
        RAISE NOTICE '✅ Migración exitosa. Todos los datos fueron migrados.';
    ELSE
        RAISE NOTICE '❌ ERROR: La migración no fue exitosa. No eliminar organizacion_ejercicios.';
        RETURN;
    END IF;
END $$;

-- PASO 2: Verificar que no hay dependencias
SELECT 
    'VERIFICACIÓN DE DEPENDENCIAS' as seccion,
    table_name,
    column_name,
    constraint_name
FROM information_schema.key_column_usage 
WHERE referenced_table_name = 'organizacion_ejercicios'
   OR table_name = 'organizacion_ejercicios';

-- PASO 3: Eliminar la tabla organizacion_ejercicios
-- DESCOMENTAR SOLO DESPUÉS DE VERIFICAR QUE LA MIGRACIÓN FUE EXITOSA

DROP TABLE IF EXISTS organizacion_ejercicios CASCADE;

-- PASO 4: Verificar que la tabla fue eliminada
SELECT 
    'VERIFICACIÓN DE ELIMINACIÓN' as seccion,
    table_name 
FROM information_schema.tables 
WHERE table_name = 'organizacion_ejercicios';

-- PASO 5: Mostrar estructura final de ejercicios_detalles
SELECT 
    'ESTRUCTURA FINAL DE EJERCICIOS_DETALLES' as seccion,
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

































