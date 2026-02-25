-- MIGRACIÓN DE ARREGLO: Agregar columna recalculado_en faltante
-- Este archivo soluciona el error de "schema cache" al intentar insertar progreso.

-- 1. Agregar a progreso_cliente (Fitness)
ALTER TABLE public.progreso_cliente 
ADD COLUMN IF NOT EXISTS recalculado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Agregar a progreso_cliente_nutricion (Nutrición)
ALTER TABLE public.progreso_cliente_nutricion 
ADD COLUMN IF NOT EXISTS recalculado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Agregar a progreso_diario_actividad (Consolidado)
ALTER TABLE public.progreso_diario_actividad 
ADD COLUMN IF NOT EXISTS recalculado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Asegurar que los índices existan para estas columnas si se van a usar para depuración
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_recalculado ON public.progreso_cliente(recalculado_en);
CREATE INDEX IF NOT EXISTS idx_progreso_nutricion_recalculado ON public.progreso_cliente_nutricion(recalculado_en);
CREATE INDEX IF NOT EXISTS idx_progreso_diario_recalculado ON public.progreso_diario_actividad(recalculado_en);

COMMENT ON COLUMN public.progreso_cliente.recalculado_en IS 'Fecha de la última sincronización con el motor adaptativo o trigger';
COMMENT ON COLUMN public.progreso_cliente_nutricion.recalculado_en IS 'Fecha de la última sincronización con el motor adaptativo o trigger';
COMMENT ON COLUMN public.progreso_diario_actividad.recalculado_en IS 'Fecha de la última consolidación de datos';
