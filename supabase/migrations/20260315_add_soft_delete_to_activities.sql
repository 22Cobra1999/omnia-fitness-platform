-- Migration: Add soft delete support to activities
-- Date: 2026-03-15

ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS borrada BOOLEAN DEFAULT FALSE;

ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS limpieza_completada BOOLEAN DEFAULT FALSE;

-- Optional: Index on borrada for faster filtering
CREATE INDEX IF NOT EXISTS idx_activities_borrada ON public.activities(borrada);

COMMENT ON COLUMN public.activities.borrada IS 'Si es TRUE, el coach ha solicitado eliminar la actividad pero sigue existiendo para clientes activos.';
COMMENT ON COLUMN public.activities.limpieza_completada IS 'Si es TRUE, se han borrado los detalles de planificacion y media de la actividad.';
