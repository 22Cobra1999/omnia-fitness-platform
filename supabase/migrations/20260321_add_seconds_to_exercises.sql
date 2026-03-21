-- MIGRACIÓN: Agregar segundos a la estructura de ejercicios
-- Archivo: 20260321_add_seconds_to_exercises.sql

-- 1. Agregar columna segundos a la tabla ejercicios_detalles
-- Se agrega como INTEGER para permitir almacenar la duración por ejercicio si es necesario, 
-- aunque la lógica granular de sets vivirá en detalle_series.
ALTER TABLE public.ejercicios_detalles 
ADD COLUMN IF NOT EXISTS segundos INTEGER DEFAULT 0;

-- 2. Comentario para documentación
COMMENT ON COLUMN public.ejercicios_detalles.segundos IS 'Duración en segundos del ejercicio o componente temporal adicional.';
