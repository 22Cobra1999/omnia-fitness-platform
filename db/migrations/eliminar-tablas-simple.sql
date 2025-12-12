-- ================================================================
-- SCRIPT SIMPLE PARA ELIMINAR TABLAS REDUNDANTES
-- ================================================================
-- 
-- Ejecutar directamente en Supabase SQL Editor
-- Este script elimina las tablas que ya no se usan después de la consolidación
-- ================================================================

-- Eliminar tablas en orden (respetando dependencias)
DROP TABLE IF EXISTS public.meeting_attendance_logs CASCADE;
DROP TABLE IF EXISTS public.google_meet_links CASCADE;
DROP TABLE IF EXISTS public.activity_schedules CASCADE;

-- Eliminar función relacionada
DROP FUNCTION IF EXISTS public.calculate_meeting_duration() CASCADE;

-- Verificación
SELECT 
    'Tablas eliminadas correctamente' AS resultado,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'google_meet_links')
            AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_schedules')
            AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meeting_attendance_logs')
        THEN '✅ Todas las tablas fueron eliminadas'
        ELSE '⚠️  Algunas tablas aún existen'
    END AS estado;

