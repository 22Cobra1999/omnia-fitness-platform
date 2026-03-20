-- Migración para añadir historial de experiencia estructurado a los coaches
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS experience_history JSONB DEFAULT '[]'::jsonb;

-- Comentario para documentación
COMMENT ON COLUMN public.coaches.experience_history IS 'Almacena el historial cronológico de experiencia del coach: [{title, start_date, end_date}]';
