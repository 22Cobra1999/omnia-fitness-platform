-- Agregar columna is_active a activity_enrollments
-- Esta columna indica si la inscripción está activa o finalizada
ALTER TABLE public.activity_enrollments 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- NOTA: La actualización de enrollments de talleres finalizados se debe hacer DESPUÉS
-- de ejecutar la migración add_activities_is_active_and_versions.sql
-- porque necesita que la columna a.is_active exista en activities

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_activity_enrollments_is_active 
ON public.activity_enrollments (is_active) 
WHERE is_active = FALSE;

-- Comentario en la columna
COMMENT ON COLUMN public.activity_enrollments.is_active IS 'Indica si la inscripción está activa. Si el taller finalizó sin fechas nuevas, debe estar en FALSE';

