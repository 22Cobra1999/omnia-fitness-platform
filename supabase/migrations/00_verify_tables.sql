 -- ================================================================
-- SCRIPT DE VERIFICACIÓN DE TABLAS EXISTENTES
-- ================================================================
-- Este script verifica qué tablas existen antes de poblar calendar_events

-- Verificar tablas principales
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('taller_detalles', 'ejecuciones_taller', 'activity_schedules', 'activities', 'calendar_events') 
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'taller_detalles', 
    'ejecuciones_taller', 
    'activity_schedules', 
    'activities',
    'activity_enrollments',
    'calendar_events',
    'coaches',
    'user_profiles'
  )
ORDER BY table_name;

-- Verificar estructura de taller_detalles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'taller_detalles'
ORDER BY ordinal_position;

-- Verificar estructura de ejecuciones_taller
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ejecuciones_taller'
ORDER BY ordinal_position;

-- Verificar estructura de activity_schedules
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activity_schedules'
ORDER BY ordinal_position;

-- Contar registros en cada tabla
SELECT 
    'taller_detalles' as tabla,
    COUNT(*) as total_registros
FROM taller_detalles
UNION ALL
SELECT 
    'ejecuciones_taller',
    COUNT(*)
FROM ejecuciones_taller
UNION ALL
SELECT 
    'activity_schedules',
    COUNT(*)
FROM activity_schedules
UNION ALL
SELECT 
    'calendar_events',
    COUNT(*)
FROM calendar_events;
































