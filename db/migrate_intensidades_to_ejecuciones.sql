-- =============================================================
-- MIGRACIÓN: trasladar datos desde tabla intensidades
-- 1) ejercicios_detalles.duracion_min  <- intensidades.duracion_minutos
-- 2) ejecuciones_ejercicio.detalle_series (jsonb) <- intensidades.detalle_series
-- 3) eliminar tabla intensidades (redundante)
--
-- NOTAS:
-- - Se matchea por intensidades.ejercicio_id = ejercicios_detalles.id y
--   intensidades.ejercicio_id = ejecuciones_ejercicio.ejercicio_id
-- - Cuando hay múltiples filas en intensidades para el mismo ejercicio,
--   se prioriza el match por intensidad (intensidad == intensidad_aplicada)
--   y si no existe, se toma la fila más reciente por created_at.
-- =============================================================

BEGIN;

-- 1) Agregar columna duracion_min a ejercicios_detalles si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ejercicios_detalles'
      AND column_name  = 'duracion_min'
  ) THEN
    ALTER TABLE public.ejercicios_detalles
      ADD COLUMN duracion_min integer;
  END IF;
END$$;

-- 1.1) Poblar duracion_min desde intensidades.duracion_minutos
-- Preferir registro que matchee intensidad con la "intensidad" del detalle si existe
WITH src AS (
  SELECT DISTINCT ON (ed.id)
         ed.id AS ejercicio_id,
         COALESCE(i_match.duracion_minutos, i_any.duracion_minutos) AS duracion_min
  FROM public.ejercicios_detalles ed
  LEFT JOIN LATERAL (
    SELECT i.*
    FROM public.intensidades i
    WHERE i.ejercicio_id = ed.id
    ORDER BY i.created_at DESC
    LIMIT 1
  ) i_any ON TRUE
  LEFT JOIN LATERAL (
    SELECT i.*
    FROM public.intensidades i
    WHERE i.ejercicio_id = ed.id
      AND i.intensidad = ed.intensidad
    ORDER BY i.created_at DESC
    LIMIT 1
  ) i_match ON TRUE
)
UPDATE public.ejercicios_detalles ed
SET duracion_min = src.duracion_min
FROM src
WHERE ed.id = src.ejercicio_id
  AND src.duracion_min IS NOT NULL;

-- 2) Agregar columna detalle_series (jsonb) a ejecuciones_ejercicio si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ejecuciones_ejercicio'
      AND column_name  = 'detalle_series'
  ) THEN
    ALTER TABLE public.ejecuciones_ejercicio
      ADD COLUMN detalle_series jsonb;
  END IF;
END$$;

-- 2.1) Poblar detalle_series desde intensidades.detalle_series
-- Match por ejercicio_id + intensidad_aplicada; si no hay match exacto, tomar la más reciente
WITH pick AS (
  SELECT ee.id AS ejecucion_id,
         COALESCE(i_match.detalle_series, i_any.detalle_series) AS detalle_series
  FROM public.ejecuciones_ejercicio ee
  LEFT JOIN LATERAL (
    SELECT i.detalle_series
    FROM public.intensidades i
    WHERE i.ejercicio_id = ee.ejercicio_id
      AND i.intensidad = ee.intensidad_aplicada
    ORDER BY i.created_at DESC
    LIMIT 1
  ) i_match ON TRUE
  LEFT JOIN LATERAL (
    SELECT i.detalle_series
    FROM public.intensidades i
    WHERE i.ejercicio_id = ee.ejercicio_id
    ORDER BY i.created_at DESC
    LIMIT 1
  ) i_any ON TRUE
)
UPDATE public.ejecuciones_ejercicio ee
SET detalle_series = pick.detalle_series
FROM pick
WHERE ee.id = pick.ejecucion_id
  AND pick.detalle_series IS NOT NULL
  AND (ee.detalle_series IS NULL OR ee.detalle_series = 'null'::jsonb);

-- 3) Eliminar tabla intensidades (opcional: renombrar antes de eliminar por seguridad)
-- DROP TABLE public.intensidades;

-- En lugar de dropear inmediatamente, la renombramos para validar y luego se puede dropear manualmente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'intensidades_backup'
  ) THEN
    -- Ya existe un backup anterior, no hacer nada
    NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'intensidades'
  ) THEN
    ALTER TABLE public.intensidades RENAME TO intensidades_backup;
  END IF;
END$$;

COMMIT;

-- Para dropear definitivamente cuando valides:
-- DROP TABLE IF EXISTS public.intensidades_backup;




























