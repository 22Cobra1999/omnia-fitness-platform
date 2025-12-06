-- Agregar columna para marcar cuando un taller está finalizado
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS is_finished BOOLEAN DEFAULT FALSE;

-- Agregar columna para almacenar la fecha de finalización
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE NULL;

-- Crear índice para búsquedas rápidas de talleres finalizados
CREATE INDEX IF NOT EXISTS idx_activities_is_finished 
ON public.activities (is_finished) 
WHERE type = 'workshop';

-- Comentarios en las columnas
COMMENT ON COLUMN public.activities.is_finished IS 'Indica si el taller ha sido finalizado por el coach';
COMMENT ON COLUMN public.activities.finished_at IS 'Fecha y hora en que el taller fue marcado como finalizado';

-- NOTA: Los comentarios y puntuaciones del coach se almacenan en activity_surveys, NO en activities

