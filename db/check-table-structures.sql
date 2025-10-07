-- Consultar estructura de tablas relevantes para actividades de hoy

-- 1. Estructura de ejercicios_detalles
SELECT 
    'ejercicios_detalles' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 2. Estructura de periodos_asignados
SELECT 
    'periodos_asignados' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'periodos_asignados'
ORDER BY ordinal_position;

-- 3. Estructura de activities
SELECT 
    'activities' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'activities'
ORDER BY ordinal_position;

-- 4. Estructura de activity_enrollments
SELECT 
    'activity_enrollments' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'activity_enrollments'
ORDER BY ordinal_position;

-- 5. Estructura de ejecuciones_ejercicio
SELECT 
    'ejecuciones_ejercicio' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio'
ORDER BY ordinal_position;

-- 6. Buscar tablas que contengan "intensidad" en el nombre
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%intensidad%'
OR table_name LIKE '%intensity%';

-- 7. Buscar tablas que contengan "ejercicio" en el nombre
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%ejercicio%';

-- 8. Verificar si hay alguna tabla que contenga series, reps, peso
SELECT 
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (column_name LIKE '%series%' 
     OR column_name LIKE '%reps%' 
     OR column_name LIKE '%peso%'
     OR column_name LIKE '%weight%')
ORDER BY table_name, column_name;
































