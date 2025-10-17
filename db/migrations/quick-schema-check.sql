-- =====================================================
-- VERIFICACIÓN RÁPIDA DEL ESQUEMA
-- =====================================================
-- Ejecutar cada sección por separado en Supabase SQL Editor

-- =====================================================
-- 1. VERIFICAR TABLAS OBSOLETAS
-- =====================================================

SELECT 
    table_name,
    'OBSOLETA' as estado
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
-- 2. VERIFICAR NUEVO ESQUEMA
-- =====================================================

SELECT 
    table_name,
    'NUEVA' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'ejecicios_detalles',
    'organizacion_ejercicios',
    'periodos_asignados',
    'ejecuciones_ejercicio',
    'intensidades',
    'activity_enrollments'
)
ORDER BY table_name;

-- =====================================================
-- 3. CONTAR REGISTROS EN TABLAS OBSOLETAS
-- =====================================================

-- Ejecutar solo si la tabla existe
SELECT COUNT(*) as client_exercise_progress_count FROM client_exercise_progress;
SELECT COUNT(*) as exercise_intensity_levels_count FROM exercise_intensity_levels;
SELECT COUNT(*) as fitness_exercises_count FROM fitness_exercises;

-- =====================================================
-- 4. CONTAR REGISTROS EN NUEVO ESQUEMA
-- =====================================================

-- Ejecutar solo si la tabla existe
SELECT COUNT(*) as ejecuciones_ejercicio_count FROM ejecuciones_ejercicio;
SELECT COUNT(*) as intensidades_count FROM intensidades;
SELECT COUNT(*) as ejercicios_detalles_count FROM ejercicios_detalles;
SELECT COUNT(*) as periodos_asignados_count FROM periodos_asignados;

-- =====================================================
-- 5. VER ESTRUCTURA DE EJECUCIONES_EJERCICIO
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 6. VER ESTRUCTURA DE INTENSIDADES
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'intensidades' 
AND table_schema = 'public'
ORDER BY ordinal_position;









































