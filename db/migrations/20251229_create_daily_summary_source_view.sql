-- Compat view requerida por triggers/funciones de daily summary
-- Evita error 42P01: relation "public.v_progreso_cliente_daily_summary_source" does not exist
--
-- Esta vista debe devolver columnas *tipadas* (ints/numerics), porque algunos triggers
-- hacen INSERT ... SELECT * hacia tablas de resumen (ej: platos_completados INT).

DROP VIEW IF EXISTS public.v_progreso_cliente_daily_summary_source;

CREATE VIEW public.v_progreso_cliente_daily_summary_source (
  id,
  cliente_id,
  fecha,
  categoria,
  platos_completados,
  platos_pendientes,
  platos_objetivo,
  nutri_kcal,
  nutri_mins,
  nutri_protein,
  nutri_carbs,
  nutri_fat,
  ejercicios_completados,
  ejercicios_pendientes,
  ejercicios_objetivo,
  fitness_kcal,
  fitness_mins
) AS
-- FITNESS
SELECT
  pc.id,
  pc.cliente_id,
  pc.fecha,
  'fitness'::text AS categoria,
  0::integer AS platos_completados,
  0::integer AS platos_pendientes,
  0::integer AS platos_objetivo,
  0::numeric AS nutri_kcal,
  0::numeric AS nutri_mins,
  0::numeric AS nutri_protein,
  0::numeric AS nutri_carbs,
  0::numeric AS nutri_fat,
  CASE
    WHEN jsonb_typeof(pc.ejercicios_completados) = 'array' THEN jsonb_array_length(pc.ejercicios_completados)
    WHEN jsonb_typeof(pc.ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(pc.ejercicios_completados))
    ELSE 0
  END::integer AS ejercicios_completados,
  CASE
    WHEN jsonb_typeof(pc.ejercicios_pendientes) = 'array' THEN jsonb_array_length(pc.ejercicios_pendientes)
    WHEN jsonb_typeof(pc.ejercicios_pendientes) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(pc.ejercicios_pendientes))
    ELSE 0
  END::integer AS ejercicios_pendientes,
  (
    CASE
      WHEN jsonb_typeof(pc.ejercicios_completados) = 'array' THEN jsonb_array_length(pc.ejercicios_completados)
      WHEN jsonb_typeof(pc.ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(pc.ejercicios_completados))
      ELSE 0
    END
    +
    CASE
      WHEN jsonb_typeof(pc.ejercicios_pendientes) = 'array' THEN jsonb_array_length(pc.ejercicios_pendientes)
      WHEN jsonb_typeof(pc.ejercicios_pendientes) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(pc.ejercicios_pendientes))
      ELSE 0
    END
  )::integer AS ejercicios_objetivo,
  COALESCE((SELECT SUM((value::text)::numeric) FROM jsonb_each_text(pc.calorias_json)), 0)::numeric AS fitness_kcal,
  COALESCE((SELECT SUM((value::text)::numeric) FROM jsonb_each_text(pc.minutos_json)), 0)::numeric AS fitness_mins
FROM public.progreso_cliente pc

UNION ALL

-- NUTRICION
SELECT
  pcn.id,
  pcn.cliente_id,
  pcn.fecha,
  'nutricion'::text AS categoria,
  CASE
    WHEN jsonb_typeof(pcn.ejercicios_completados) = 'object' AND jsonb_typeof(pcn.ejercicios_completados->'ejercicios') = 'array'
      THEN jsonb_array_length(pcn.ejercicios_completados->'ejercicios')
    ELSE 0
  END::integer AS platos_completados,
  CASE
    WHEN jsonb_typeof(pcn.ejercicios_pendientes) = 'object' AND jsonb_typeof(pcn.ejercicios_pendientes->'ejercicios') = 'array'
      THEN jsonb_array_length(pcn.ejercicios_pendientes->'ejercicios')
    ELSE 0
  END::integer AS platos_pendientes,
  (
    CASE
      WHEN jsonb_typeof(pcn.ejercicios_completados) = 'object' AND jsonb_typeof(pcn.ejercicios_completados->'ejercicios') = 'array'
        THEN jsonb_array_length(pcn.ejercicios_completados->'ejercicios')
      ELSE 0
    END
    +
    CASE
      WHEN jsonb_typeof(pcn.ejercicios_pendientes) = 'object' AND jsonb_typeof(pcn.ejercicios_pendientes->'ejercicios') = 'array'
        THEN jsonb_array_length(pcn.ejercicios_pendientes->'ejercicios')
      ELSE 0
    END
  )::integer AS platos_objetivo,
  COALESCE((
    SELECT SUM(
      COALESCE((value->>'proteinas')::numeric, 0) * 4 +
      COALESCE((value->>'carbohidratos')::numeric, 0) * 4 +
      COALESCE((value->>'grasas')::numeric, 0) * 9
    )
    FROM jsonb_each(pcn.macros) AS t(key, value)
  ), 0)::numeric AS nutri_kcal,
  0::numeric AS nutri_mins,
  COALESCE((SELECT SUM(COALESCE((value->>'proteinas')::numeric, 0)) FROM jsonb_each(pcn.macros) AS t(key, value)), 0)::numeric AS nutri_protein,
  COALESCE((SELECT SUM(COALESCE((value->>'carbohidratos')::numeric, 0)) FROM jsonb_each(pcn.macros) AS t(key, value)), 0)::numeric AS nutri_carbs,
  COALESCE((SELECT SUM(COALESCE((value->>'grasas')::numeric, 0)) FROM jsonb_each(pcn.macros) AS t(key, value)), 0)::numeric AS nutri_fat,
  0::integer AS ejercicios_completados,
  0::integer AS ejercicios_pendientes,
  0::integer AS ejercicios_objetivo,
  0::numeric AS fitness_kcal,
  0::numeric AS fitness_mins
FROM public.progreso_cliente_nutricion pcn;
