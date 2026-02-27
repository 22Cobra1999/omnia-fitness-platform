ALTER TABLE public.progreso_cliente ADD COLUMN IF NOT EXISTS detalles_series JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.progreso_cliente_nutricion ADD COLUMN IF NOT EXISTS macros JSONB DEFAULT '{}'::jsonb;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
