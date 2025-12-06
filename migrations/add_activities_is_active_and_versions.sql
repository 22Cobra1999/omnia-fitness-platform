-- Agregar columna is_active a activities
-- Esta columna indica si el producto está activo para nuevas compras
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Agregar columna workshop_versions (JSONB) para almacenar versiones del taller
-- Estructura: { "versions": [{ "version": 1, "empezada_el": "01/01/2024", "finalizada_el": "15/01/2024" }, ...] }
-- Formato en español: "version 1 empezada el dd/mm/aa y finalizada el dd/mm/aa"
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS workshop_versions JSONB DEFAULT '{"versions": []}'::jsonb;

-- Función helper para formatear fecha a dd/mm/aa (español)
CREATE OR REPLACE FUNCTION format_date_spanish(timestamp_value TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(timestamp_value, 'DD/MM/YY');
END;
$$ LANGUAGE plpgsql;

-- Actualizar talleres finalizados sin fechas nuevas a is_active = FALSE
UPDATE public.activities
SET is_active = FALSE
WHERE type = 'workshop'
  AND is_finished = TRUE
  AND (workshop_versions->'versions' IS NULL OR jsonb_array_length(workshop_versions->'versions') = 0);

-- Crear índice para búsquedas rápidas de actividades activas
CREATE INDEX IF NOT EXISTS idx_activities_is_active 
ON public.activities (is_active) 
WHERE is_active = TRUE;

-- Crear índice para búsquedas de talleres con versiones
CREATE INDEX IF NOT EXISTS idx_activities_workshop_versions 
ON public.activities USING GIN (workshop_versions) 
WHERE type = 'workshop';

-- Comentarios en las columnas
COMMENT ON COLUMN public.activities.is_active IS 'Indica si el producto está activo para nuevas compras. Un taller finalizado sin fechas nuevas siempre estará desactivado hasta que se agreguen nuevas fechas. El coach puede activar/desactivar libremente.';
COMMENT ON COLUMN public.activities.workshop_versions IS 'Almacena las versiones del taller cuando finaliza y se agregan nuevas fechas. Estructura en español: {"versions": [{"version": 1, "empezada_el": "01/01/2024", "finalizada_el": "15/01/2024"}, ...]}. Formato: "version 1 empezada el dd/mm/aa y finalizada el dd/mm/aa"';

