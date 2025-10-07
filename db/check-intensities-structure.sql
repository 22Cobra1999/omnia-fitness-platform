-- =====================================================
-- VERIFICAR ESTRUCTURA DE TABLAS DE INTENSIDADES
-- =====================================================

-- 1. Verificar estructura de exercise_intensity_levels (tabla obsoleta)
SELECT 
    'exercise_intensity_levels (OBSOLETA)' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'exercise_intensity_levels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de intensidades (tabla nueva)
SELECT 
    'intensidades (NUEVA)' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'intensidades' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Contar registros en exercise_intensity_levels
SELECT 
    'exercise_intensity_levels' as tabla,
    COUNT(*) as registros
FROM exercise_intensity_levels;

-- 4. Contar registros en intensidades
SELECT 
    'intensidades' as tabla,
    COUNT(*) as registros
FROM intensidades;

-- 5. Muestra de datos en exercise_intensity_levels
SELECT 
    'MUESTRA exercise_intensity_levels' as info,
    id,
    fitness_exercise_id,
    level_name,
    detalle_series,
    duracion_min,
    one_rm,
    calorias,
    created_by_coach_id,
    is_custom,
    created_at
FROM exercise_intensity_levels 
ORDER BY id
LIMIT 10;

-- 6. Muestra de datos en intensidades
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
    descanso_segundos,
    created_at,
    created_by
FROM intensidades 
ORDER BY id
LIMIT 10;

































