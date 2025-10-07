-- =====================================================
-- VERIFICACIÓN DEL ESQUEMA PARA SUPABASE
-- =====================================================
-- Ejecutar este script en el SQL Editor de Supabase

-- =====================================================
-- PASO 1: VERIFICAR TABLAS OBSOLETAS
-- =====================================================

SELECT 
    'TABLAS OBSOLETAS' as categoria,
    table_name,
    CASE 
        WHEN table_name = 'client_exercise_progress' THEN '❌ OBSOLETA - Reemplazada por ejecuciones_ejercicio'
        WHEN table_name = 'exercise_intensity_levels' THEN '❌ OBSOLETA - Reemplazada por intensidades'
        WHEN table_name = 'fitness_exercises' THEN '❌ OBSOLETA - Reemplazada por ejercicios_detalles + organizacion_ejercicios'
        WHEN table_name = 'fitness_program_details' THEN '❌ OBSOLETA - Reemplazada por ejercicios_detalles + organizacion_ejercicios'
        WHEN table_name = 'activity_calendar' THEN '❌ OBSOLETA - Reemplazada por periodos_asignados + ejecuciones_ejercicio'
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

-- =====================================================
-- PASO 2: VERIFICAR NUEVO ESQUEMA MODULAR
-- =====================================================

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

-- =====================================================
-- PASO 3: CONTAR REGISTROS EN TABLAS OBSOLETAS
-- =====================================================

-- Contar registros en client_exercise_progress (si existe)
SELECT 
    'client_exercise_progress' as tabla,
    COUNT(*) as registros
FROM client_exercise_progress
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_progress');

-- Contar registros en exercise_intensity_levels (si existe)
SELECT 
    'exercise_intensity_levels' as tabla,
    COUNT(*) as registros
FROM exercise_intensity_levels
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_intensity_levels');

-- Contar registros en fitness_exercises (si existe)
SELECT 
    'fitness_exercises' as tabla,
    COUNT(*) as registros
FROM fitness_exercises
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_exercises');

-- =====================================================
-- PASO 4: CONTAR REGISTROS EN NUEVO ESQUEMA
-- =====================================================

-- Contar registros en ejecuciones_ejercicio (si existe)
SELECT 
    'ejecuciones_ejercicio' as tabla,
    COUNT(*) as registros
FROM ejecuciones_ejercicio
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejecuciones_ejercicio');

-- Contar registros en intensidades (si existe)
SELECT 
    'intensidades' as tabla,
    COUNT(*) as registros
FROM intensidades
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intensidades');

-- Contar registros en ejercicios_detalles (si existe)
SELECT 
    'ejercicios_detalles' as tabla,
    COUNT(*) as registros
FROM ejercicios_detalles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejercicios_detalles');

-- Contar registros en periodos_asignados (si existe)
SELECT 
    'periodos_asignados' as tabla,
    COUNT(*) as registros
FROM periodos_asignados
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'periodos_asignados');

-- =====================================================
-- PASO 5: VERIFICAR ESTRUCTURA DE EJECUCIONES_EJERCICIO
-- =====================================================

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

-- =====================================================
-- PASO 6: VERIFICAR ESTRUCTURA DE INTENSIDADES
-- =====================================================

SELECT 
    'intensidades' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'intensidades' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASO 7: MUESTRA DE DATOS EN NUEVAS TABLAS
-- =====================================================

-- Muestra de ejecuciones_ejercicio (si existe y tiene datos)
SELECT 
    'MUESTRA ejecuciones_ejercicio' as info,
    id,
    ejercicio_id,
    intensidad_aplicada,
    completado,
    fecha_ejecucion,
    peso_usado,
    repeticiones_realizadas,
    series_completadas
FROM ejecuciones_ejercicio 
ORDER BY created_at DESC
LIMIT 5;

-- Muestra de intensidades (si existe y tiene datos)
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

































