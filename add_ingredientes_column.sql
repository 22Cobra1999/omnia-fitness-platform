-- Query para agregar columna ingredientes en progreso_cliente_nutricion
-- Tipo JSONB para almacenar los platos y sus ingredientes

ALTER TABLE public.progreso_cliente_nutricion
ADD COLUMN IF NOT EXISTS ingredientes JSONB NULL DEFAULT '{}'::jsonb;

-- Comentario para documentar la columna
COMMENT ON COLUMN public.progreso_cliente_nutricion.ingredientes IS 'Almacena los ingredientes de cada plato en formato JSONB. Estructura: {"plato_id": ["ingrediente1", "ingrediente2", ...]} o {"key_ejercicio": "ingrediente1; ingrediente2; ..."}';

-- Índice GIN para búsquedas eficientes en JSONB (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_nutricion_ingredientes 
ON public.progreso_cliente_nutricion 
USING GIN (ingredientes);

