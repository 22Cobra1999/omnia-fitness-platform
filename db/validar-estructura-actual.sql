-- Script para validar la estructura actual de las tablas
-- Verificar qué tablas existen y su estructura

-- PASO 1: Verificar tablas existentes
SELECT 
    'TABLAS EXISTENTES' as seccion,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'ejercicios_detalles',
        'intensidades', 
        'periodos_asignados',
        'ejecuciones_ejercicio',
        'organizacion_ejercicios'
    )
ORDER BY table_name;

-- PASO 2: Verificar estructura de ejercicios_detalles
SELECT 
    'ESTRUCTURA EJERCICIOS_DETALLES' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- PASO 3: Verificar estructura de intensidades
SELECT 
    'ESTRUCTURA INTENSIDADES' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'intensidades'
ORDER BY ordinal_position;

-- PASO 4: Verificar si existe periodos_asignados
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

-- PASO 5: Verificar estructura de ejecuciones_ejercicio
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

-- PASO 6: Verificar datos de ejemplo en ejercicios_detalles
SELECT 
    'DATOS EJEMPLO EJERCICIOS_DETALLES' as seccion,
    id,
    activity_id,
    nombre_ejercicio,
    tipo,
    descripcion,
    equipo,
    body_parts,
    replicar,
    created_by,
    calorias,
    intensidad,
    video_url,
    semana,
    dia,
    periodo,
    bloque,
    orden
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY semana, dia, orden
LIMIT 5;

-- PASO 7: Verificar datos de ejemplo en intensidades
SELECT 
    'DATOS EJEMPLO INTENSIDADES' as seccion,
    id,
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias
FROM intensidades 
WHERE ejercicio_id IN (SELECT id FROM ejercicios_detalles WHERE activity_id = 59 LIMIT 3)
ORDER BY ejercicio_id, intensidad
LIMIT 10;

-- PASO 8: Verificar si hay datos en ejecuciones_ejercicio
SELECT 
    'DATOS EJEMPLO EJECUCIONES_EJERCICIO' as seccion,
    COUNT(*) as total_registros
FROM ejecuciones_ejercicio;

-- PASO 9: Verificar si hay datos en periodos_asignados
SELECT 
    'DATOS EJEMPLO PERIODOS_ASIGNADOS' as seccion,
    COUNT(*) as total_registros
FROM periodos_asignados;







































