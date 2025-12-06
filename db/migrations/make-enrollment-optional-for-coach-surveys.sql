-- Hacer enrollment_id opcional para encuestas de coaches
-- Los coaches no necesitan estar "enrolled" en sus propias actividades
-- para poder completar la encuesta de finalización del taller

-- Primero, eliminar el constraint NOT NULL de enrollment_id
ALTER TABLE public.activity_surveys 
ALTER COLUMN enrollment_id DROP NOT NULL;

-- Actualizar la foreign key para permitir NULL
-- (La foreign key ya debería permitir NULL si eliminamos NOT NULL, pero verificamos)
-- No necesitamos cambiar la foreign key, solo permitir NULL

-- Comentario en la columna
COMMENT ON COLUMN public.activity_surveys.enrollment_id IS 'ID del enrollment del cliente. NULL para encuestas de coaches';

