-- Agregar columna workshop_version a activity_surveys
-- Esta columna almacena la versión del taller para la cual se completó la encuesta
-- Permite que el coach responda la encuesta cada vez que finaliza una versión del taller
ALTER TABLE public.activity_surveys 
ADD COLUMN IF NOT EXISTS workshop_version INTEGER NULL;

-- Crear índice para búsquedas rápidas por versión
CREATE INDEX IF NOT EXISTS idx_activity_surveys_workshop_version 
ON public.activity_surveys (workshop_version) 
WHERE workshop_version IS NOT NULL;

-- Crear índice compuesto para búsquedas por actividad, cliente y versión
CREATE INDEX IF NOT EXISTS idx_activity_surveys_activity_client_version 
ON public.activity_surveys (activity_id, client_id, workshop_version) 
WHERE workshop_version IS NOT NULL;

-- Comentario en la columna
COMMENT ON COLUMN public.activity_surveys.workshop_version IS 'Versión del taller para la cual se completó esta encuesta. Permite que el coach responda la encuesta cada vez que finaliza una versión del taller. Se obtiene de activities.workshop_versions->versions[].version';

-- Actualizar constraint UNIQUE para permitir múltiples encuestas por versión
-- Eliminar el constraint único actual que solo permite una encuesta por actividad y cliente
ALTER TABLE public.activity_surveys 
DROP CONSTRAINT IF EXISTS activity_surveys_activity_id_client_id_key;

-- Crear nuevo constraint único que incluye la versión
-- Esto permite una encuesta por actividad, cliente y versión
-- Para talleres: permite múltiples encuestas (una por versión)
-- Para otros productos: workshop_version será NULL, permitiendo una encuesta por actividad y cliente
-- Usamos un índice parcial único para manejar NULL correctamente
CREATE UNIQUE INDEX IF NOT EXISTS activity_surveys_activity_id_client_id_version_key 
ON public.activity_surveys (activity_id, client_id, workshop_version) 
WHERE workshop_version IS NOT NULL;

-- Para productos que no son talleres (workshop_version IS NULL), mantener una sola encuesta
CREATE UNIQUE INDEX IF NOT EXISTS activity_surveys_activity_id_client_id_null_version_key 
ON public.activity_surveys (activity_id, client_id) 
WHERE workshop_version IS NULL;

