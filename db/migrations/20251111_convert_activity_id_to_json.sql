-- =============================================================
-- Migración: Convertir ejercicios_detalles.activity_id a JSONB
-- Fecha: 2025-11-11
-- Descripción:
--   * Permite reutilizar ejercicios en múltiples actividades
--   * El JSON almacena para cada actividad si el ejercicio está activo
--   * Limpia planificacion_ejercicios para que deje de persistir flags de activo
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. Preparación: eliminar constraints e índices dependientes
-- -------------------------------------------------------------

-- El constraint ya no aplica porque activity_id dejará de ser FK directa
ALTER TABLE public.ejercicios_detalles
  DROP CONSTRAINT IF EXISTS ejercicios_detalles_activity_id_fkey;

-- Indices previos basados en activity_id (INTEGER) ya no son útiles
DROP INDEX IF EXISTS public.idx_ejercicios_detalles_activity_id;
DROP INDEX IF EXISTS public.idx_ejercicios_detalles_is_active;

-- -------------------------------------------------------------
-- 2. Convertir columna activity_id a JSONB
-- -------------------------------------------------------------

-- Asegurar que la columna permita nulos durante la transformación
ALTER TABLE public.ejercicios_detalles
  ALTER COLUMN activity_id DROP NOT NULL;

-- Convertir los valores actuales (INTEGER) a JSONB con la forma:
-- { "<actividad_id>": { "activo": <is_active || true> } }
ALTER TABLE public.ejercicios_detalles
  ALTER COLUMN activity_id TYPE jsonb
  USING (
    CASE
      WHEN activity_id IS NULL THEN '{}'::jsonb
      ELSE jsonb_build_object(
        activity_id::text,
        jsonb_build_object('activo', COALESCE(is_active, TRUE))
      )
    END
  );

-- Establecer default explícito para nuevas filas
ALTER TABLE public.ejercicios_detalles
  ALTER COLUMN activity_id SET DEFAULT '{}'::jsonb;

-- Normalizar filas que pudieran haber quedado en NULL
UPDATE public.ejercicios_detalles
SET activity_id = '{}'::jsonb
WHERE activity_id IS NULL;

-- -------------------------------------------------------------
-- 3. Índices para el nuevo formato JSONB
-- -------------------------------------------------------------

-- Permite búsquedas rápidas por actividad con operadores JSONB (@>, ?)
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_map
  ON public.ejercicios_detalles
  USING GIN (activity_id);

-- Mantener índice por coach para filtrar biblioteca personal
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_coach_id
  ON public.ejercicios_detalles(coach_id);

-- -------------------------------------------------------------
-- 4. Actualizar políticas RLS para usar el nuevo formato
-- -------------------------------------------------------------

-- Nota: se utilizan EXISTS combinando actividades y mapa JSON
DROP POLICY IF EXISTS "Coaches can manage their own exercises" ON public.ejercicios_detalles;
CREATE POLICY "Coaches can manage their own exercises" ON public.ejercicios_detalles
  FOR ALL USING (
    (
      coach_id IS NOT NULL AND coach_id = auth.uid()
    ) OR EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.coach_id = auth.uid()
        AND public.ejercicios_detalles.activity_id ? a.id::text
    )
  );

DROP POLICY IF EXISTS "Clients can view exercises from their activities" ON public.ejercicios_detalles;
CREATE POLICY "Clients can view exercises from their activities" ON public.ejercicios_detalles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.activity_enrollments ae
      JOIN public.activities a ON a.id = ae.activity_id
      WHERE ae.client_id = auth.uid()
        AND public.ejercicios_detalles.activity_id ? a.id::text
    )
  );

DROP POLICY IF EXISTS "Public exercises are viewable by everyone" ON public.ejercicios_detalles;
CREATE POLICY "Public exercises are viewable by everyone" ON public.ejercicios_detalles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.is_public = TRUE
        AND public.ejercicios_detalles.activity_id ? a.id::text
    )
  );

-- -------------------------------------------------------------
-- 5. Limpieza de planificacion_ejercicios (remover flags activo)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._strip_activo_flag(input JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB := input;
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(input) = 'object' THEN
    -- Eliminar flags directo en el objeto raíz si existieran
    result := result - 'activo' - 'is_active';

    IF result ? 'ejercicios' THEN
      result := jsonb_set(
        result,
        '{ejercicios}',
        COALESCE(
          (
            SELECT jsonb_agg(
              CASE
                WHEN jsonb_typeof(elem) = 'object' THEN elem - 'activo' - 'is_active'
                ELSE elem
              END
            )
            FROM jsonb_array_elements(result->'ejercicios') AS t(elem)
          ),
          '[]'::jsonb
        )
      );
    END IF;
  ELSIF jsonb_typeof(input) = 'array' THEN
    result := (
      SELECT jsonb_agg(
        CASE
          WHEN jsonb_typeof(elem) = 'object' THEN elem - 'activo' - 'is_active'
          ELSE elem
        END
      )
      FROM jsonb_array_elements(input) AS t(elem)
    );
  END IF;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

UPDATE public.planificacion_ejercicios
SET
  lunes = public._strip_activo_flag(lunes),
  martes = public._strip_activo_flag(martes),
  miercoles = public._strip_activo_flag(miercoles),
  jueves = public._strip_activo_flag(jueves),
  viernes = public._strip_activo_flag(viernes),
  sabado = public._strip_activo_flag(sabado),
  domingo = public._strip_activo_flag(domingo);

DROP FUNCTION IF EXISTS public._strip_activo_flag(JSONB);

COMMIT;

-- =============================================================
-- Fin de la migración
-- =============================================================

