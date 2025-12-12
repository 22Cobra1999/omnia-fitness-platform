-- Script para verificar qué columnas existen en las tablas relevantes
-- Ejecutar en Supabase SQL Editor

-- ================================================================
-- 1. VERIFICAR COLUMNAS EN calendar_events
-- ================================================================
SELECT 
    'calendar_events' AS tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'calendar_events'
ORDER BY ordinal_position;

-- ================================================================
-- 2. VERIFICAR COLUMNAS EN activity_schedules
-- ================================================================
SELECT 
    'activity_schedules' AS tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'activity_schedules'
ORDER BY ordinal_position;

-- ================================================================
-- 3. VERIFICAR COLUMNAS EN google_meet_links
-- ================================================================
SELECT 
    'google_meet_links' AS tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'google_meet_links'
ORDER BY ordinal_position;

-- ================================================================
-- 4. VERIFICAR RELACIONES (FOREIGN KEYS)
-- ================================================================
SELECT
    tc.table_name, 
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
  AND tc.table_schema = 'public'
  AND (
    tc.table_name IN ('calendar_events', 'activity_schedules', 'google_meet_links')
    OR ccu.table_name IN ('calendar_events', 'activity_schedules', 'google_meet_links')
  )
ORDER BY tc.table_name, kcu.column_name;

-- ================================================================
-- 5. VERIFICAR SI EXISTEN CAMPOS ESPECÍFICOS QUE NECESITAMOS
-- ================================================================
SELECT 
    'Verificación de campos necesarios' AS verificacion,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'cancelled_by'
    ) THEN '✅ cancelled_by existe' ELSE '❌ cancelled_by NO existe' END AS calendar_cancelled_by,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'rescheduled_by'
    ) THEN '✅ rescheduled_by existe' ELSE '❌ rescheduled_by NO existe' END AS calendar_rescheduled_by,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'rescheduled_at'
    ) THEN '✅ rescheduled_at existe' ELSE '❌ rescheduled_at NO existe' END AS calendar_rescheduled_at,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'activity_schedules' 
          AND column_name = 'cancelled_by'
    ) THEN '✅ cancelled_by existe' ELSE '❌ cancelled_by NO existe' END AS schedule_cancelled_by,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'activity_schedules' 
          AND column_name = 'rescheduled_by'
    ) THEN '✅ rescheduled_by existe' ELSE '❌ rescheduled_by NO existe' END AS schedule_rescheduled_by,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'activity_schedules' 
          AND column_name = 'rescheduled_at'
    ) THEN '✅ rescheduled_at existe' ELSE '❌ rescheduled_at NO existe' END AS schedule_rescheduled_at,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'google_meet_links' 
          AND column_name = 'coach_attendance_status'
    ) THEN '✅ coach_attendance_status existe' ELSE '❌ coach_attendance_status NO existe' END AS meet_coach_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'google_meet_links' 
          AND column_name = 'activity_schedule_id'
    ) THEN '✅ activity_schedule_id existe' ELSE '❌ activity_schedule_id NO existe' END AS meet_schedule_link;

