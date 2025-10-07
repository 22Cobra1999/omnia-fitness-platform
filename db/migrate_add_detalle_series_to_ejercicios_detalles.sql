-- MIGRACIÓN: Restaurar columna detalle_series en ejercicios_detalles
-- Fuente: ejecuciones_ejercicio.detalle_series (jsonb) por ejercicio_id

BEGIN;

-- 1) Agregar columna si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ejercicios_detalles'
      AND column_name  = 'detalle_series'
  ) THEN
    ALTER TABLE public.ejercicios_detalles
      ADD COLUMN detalle_series jsonb;
  END IF;
END $$;

-- 2) Poblar desde ejecuciones_ejercicio
-- Criterio: por cada ejercicio_id, tomar el detalle_series no nulo más reciente
WITH pick AS (
  SELECT ee.ejercicio_id,
         ee.detalle_series,
         ROW_NUMBER() OVER (PARTITION BY ee.ejercicio_id ORDER BY ee.updated_at DESC NULLS LAST, ee.id DESC) AS rn
  FROM public.ejecuciones_ejercicio ee
  WHERE ee.detalle_series IS NOT NULL
)
UPDATE public.ejercicios_detalles ed
SET detalle_series = pick.detalle_series
FROM pick
WHERE ed.id = pick.ejercicio_id
  AND pick.rn = 1
  AND (ed.detalle_series IS NULL OR ed.detalle_series = 'null'::jsonb);

-- 3) Índice opcional para consultas por detalle_series (jsonb)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_ejercicios_detalles_detalle_series_gin'
  ) THEN
    CREATE INDEX idx_ejercicios_detalles_detalle_series_gin
      ON public.ejercicios_detalles
      USING GIN (detalle_series);
  END IF;
END $$;

COMMIT;

























