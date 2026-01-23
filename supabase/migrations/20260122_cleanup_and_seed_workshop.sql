-- CLEANUP & SEEDING SCRIPT
-- 1. Decouple taller_progreso_temas from ejecuciones_taller
-- 2. Drop legacy table
-- 3. Seed descriptions and attendance

-- 1. Drop FK and Column if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'taller_progreso_temas' AND column_name = 'ejecucion_id') THEN
        ALTER TABLE public.taller_progreso_temas ALTER COLUMN ejecucion_id DROP NOT NULL;
        ALTER TABLE public.taller_progreso_temas DROP CONSTRAINT IF EXISTS taller_progreso_temas_ejecucion_id_fkey;
        -- We keep the column for now as nullable legacy reference or drop it?
        -- User said "eliminemos ejecuciones taller".
        -- Let's drop the constraint, and we can drop the table.
    END IF;
END $$;

-- 2. Drop Legacy Table
DROP TABLE IF EXISTS public.ejecuciones_taller CASCADE;

-- 3. Seed Descriptions
UPDATE public.taller_detalles
SET descripcion = CASE 
    WHEN id % 3 = 0 THEN 'En esta sesión profundizaremos en las técnicas avanzadas de biomecánica para maximizar la hipertrofia.'
    WHEN id % 3 = 1 THEN 'Aprende a gestionar la nutrición peri-entrenamiento para optimizar la recuperación y el rendimiento.'
    ELSE 'Estrategias mentales y psicológicas para mantener la consistencia y superar estancamientos.'
END
WHERE descripcion IS NULL OR descripcion = '';

-- 4. Mark one topic as "Assisted" (Attendance = True) for testing
-- Pick the first pending topic for the current user (using auth.uid() placeholder if running in SQL editor, or random)
-- Note: In migrations we can't always depend on auth.uid(). 
-- We'll just update one random record to true for demonstration if any exist.
UPDATE public.taller_progreso_temas
SET asistio = TRUE, 
    estado = 'completado',
    fecha_seleccionada = CURRENT_DATE - INTERVAL '2 days' -- Set to past
WHERE id IN (
    SELECT id FROM public.taller_progreso_temas LIMIT 1
);
