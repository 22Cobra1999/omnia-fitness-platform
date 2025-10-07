-- =====================================================
-- VERIFICAR TABLA EJECUCIONES_EJERCICIO
-- =====================================================

-- 1. Verificar si existe la tabla ejecuciones_ejercicio
SELECT 
    'ejecuciones_ejercicio' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejecuciones_ejercicio') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado;

-- 2. Si existe, mostrar su estructura
SELECT 
    'ejecuciones_ejercicio' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Si existe, contar registros
SELECT 
    'ejecuciones_ejercicio' as tabla,
    COUNT(*) as registros
FROM ejecuciones_ejercicio
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejecuciones_ejercicio');

-- 4. Verificar tablas obsoletas que necesitan migración
SELECT 
    'TABLAS OBSOLETAS' as categoria,
    table_name,
    CASE 
        WHEN table_name = 'client_exercise_progress' THEN '❌ OBSOLETA - Reemplazada por ejecuciones_ejercicio'
        WHEN table_name = 'exercise_intensity_levels' THEN '❌ OBSOLETA - Reemplazada por intensidades'
        WHEN table_name = 'fitness_exercises' THEN '❌ OBSOLETA - Reemplazada por ejercicios_detalles'
        WHEN table_name = 'fitness_program_details' THEN '❌ OBSOLETA - Reemplazada por ejercicios_detalles'
        WHEN table_name = 'activity_calendar' THEN '❌ OBSOLETA - Reemplazada por periodos_asignados'
        WHEN table_name = 'client_exercise_customizations' THEN '❌ OBSOLETA - Reemplazada por ejecuciones_ejercicio'
        ELSE '❌ OBSOLETA - Tabla no reconocida'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'client_exercise_progress',
    'exercise_intensity_levels',
    'fitness_exercises',
    'fitness_program_details',
    'activity_calendar',
    'client_exercise_customizations'
)
ORDER BY table_name;

-- 5. Verificar tablas del nuevo esquema modular
SELECT 
    'NUEVO ESQUEMA MODULAR' as categoria,
    table_name,
    CASE 
        WHEN table_name = 'ejercicios_detalles' THEN '✅ ACTIVA - Ejercicios del sistema modular'
        WHEN table_name = 'organizacion_ejercicios' THEN '✅ ACTIVA - Organización de ejercicios por período'
        WHEN table_name = 'periodos_asignados' THEN '✅ ACTIVA - Períodos de entrenamiento asignados'
        WHEN table_name = 'ejecuciones_ejercicio' THEN '✅ ACTIVA - Ejecuciones de ejercicios con intensidad'
        WHEN table_name = 'intensidades' THEN '✅ ACTIVA - Niveles de intensidad de ejercicios'
        WHEN table_name = 'activity_enrollments' THEN '✅ ACTIVA - Inscripciones a actividades'
        ELSE '✅ ACTIVA - Tabla del nuevo esquema'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'ejercicios_detalles',
    'organizacion_ejercicios',
    'periodos_asignados',
    'ejecuciones_ejercicio',
    'intensidades',
    'activity_enrollments'
)
ORDER BY table_name;

-- 6. Contar registros en intensidades (ya sabemos que existe)
SELECT 
    'intensidades' as tabla,
    COUNT(*) as registros
FROM intensidades;

-- 7. Muestra de intensidades existentes
SELECT 
    'MUESTRA intensidades' as info,
    id,
    ejercicio_id,
    nombre,
    orden,
    reps,
    series,
    peso,
    duracion_minutos,
    descanso_segundos
FROM intensidades 
ORDER BY ejercicio_id, orden
LIMIT 10;

































