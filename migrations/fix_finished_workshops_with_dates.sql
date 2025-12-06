-- ================================================
-- CORREGIR TALLERES FINALIZADOS BASÁNDOSE EN LA ÚLTIMA FECHA
-- ================================================
-- Esta query actualiza los talleres que deberían estar finalizados
-- basándose en la última fecha de taller_detalles

-- Paso 0: Asegurar que las columnas necesarias existan
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS is_finished BOOLEAN DEFAULT FALSE;

ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS workshop_versions JSONB DEFAULT '{"versions": []}'::jsonb;

-- Paso 1: Actualizar is_finished basándose en la última fecha del taller
UPDATE public.activities a
SET 
  is_finished = TRUE,
  finished_at = (
    SELECT MAX(
      (horario->>'fecha')::timestamp with time zone
    )
    FROM public.taller_detalles td,
    jsonb_array_elements(td.originales->'fechas_horarios') AS horario
    WHERE td.actividad_id = a.id
      AND horario->>'fecha' IS NOT NULL
  )
WHERE a.type = 'workshop'
  AND a.id IN (
    -- Talleres donde la última fecha ya pasó
    SELECT DISTINCT td.actividad_id
    FROM public.taller_detalles td,
    jsonb_array_elements(td.originales->'fechas_horarios') AS horario
    WHERE horario->>'fecha' IS NOT NULL
      AND (horario->>'fecha')::date < CURRENT_DATE
    GROUP BY td.actividad_id
    HAVING MAX((horario->>'fecha')::date) < CURRENT_DATE
  )
  AND (a.is_finished IS NULL OR a.is_finished = FALSE);

-- Paso 2: Actualizar workshop_versions con la primera versión
-- Solo para talleres que no tienen versiones aún
UPDATE public.activities a
SET workshop_versions = jsonb_build_object(
  'versions', jsonb_build_array(
    jsonb_build_object(
      'version', 1,
      'empezada_el', TO_CHAR(a.created_at, 'DD/MM/YY'),
      'finalizada_el', TO_CHAR(
        (
          SELECT MAX((horario->>'fecha')::timestamp with time zone)
          FROM public.taller_detalles td,
          jsonb_array_elements(td.originales->'fechas_horarios') AS horario
          WHERE td.actividad_id = a.id
            AND horario->>'fecha' IS NOT NULL
        ),
        'DD/MM/YY'
      )
    )
  )
)
WHERE a.type = 'workshop'
  AND a.is_finished = TRUE
  AND (
    a.workshop_versions IS NULL 
    OR a.workshop_versions->'versions' IS NULL
    OR jsonb_array_length(a.workshop_versions->'versions') = 0
  )
  AND EXISTS (
    SELECT 1
    FROM public.taller_detalles td,
    jsonb_array_elements(td.originales->'fechas_horarios') AS horario
    WHERE td.actividad_id = a.id
      AND horario->>'fecha' IS NOT NULL
  );

-- Paso 3: Actualizar is_active basándose en si hay fechas futuras
UPDATE public.activities a
SET is_active = CASE
  WHEN EXISTS (
    SELECT 1
    FROM public.taller_detalles td,
    jsonb_array_elements(td.originales->'fechas_horarios') AS horario
    WHERE td.actividad_id = a.id
      AND horario->>'fecha' IS NOT NULL
      AND (horario->>'fecha')::date >= CURRENT_DATE
  ) THEN TRUE
  ELSE FALSE
END
WHERE a.type = 'workshop'
  AND a.is_finished = TRUE;

-- Paso 4: Verificar resultados
SELECT 
  a.id,
  a.title,
  a.is_finished,
  a.finished_at,
  a.is_active,
  a.workshop_versions->'versions'->0->>'empezada_el' as version_1_empezada,
  a.workshop_versions->'versions'->0->>'finalizada_el' as version_1_finalizada,
  (
    SELECT MAX((horario->>'fecha')::date)
    FROM public.taller_detalles td,
    jsonb_array_elements(td.originales->'fechas_horarios') AS horario
    WHERE td.actividad_id = a.id
      AND horario->>'fecha' IS NOT NULL
  ) as ultima_fecha_taller
FROM public.activities a
WHERE a.type = 'workshop'
  AND a.is_finished = TRUE
ORDER BY a.created_at DESC
LIMIT 20;

