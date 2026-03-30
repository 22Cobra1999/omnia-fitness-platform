-- MIGRACIÓN MAESTRA V3.4: RECONSTRUCCIÓN FINAL Y VERIFICADA (PROCESO COMPLETO)
-- Este script recalcula ítems, minutos y calorías desde las fuentes reales verificadas.

BEGIN;

-- 1. Limpieza total de la tabla destino
TRUNCATE public.progreso_diario_actividad RESTART IDENTITY;

-- 2. RECONSTRUCCIÓN FITNESS (Desde progreso_cliente)
INSERT INTO public.progreso_diario_actividad (
    cliente_id, fecha, actividad_id, enrollment_id, tipo,
    fit_items_c, fit_items_o, fit_mins_c, fit_mins_o, fit_kcal_c, fit_kcal_o,
    recalculado_en
)
SELECT 
    cliente_id, 
    fecha, 
    actividad_id, 
    enrollment_id, 
    'programa',
    -- Items
    (SELECT count(*) FROM jsonb_object_keys(COALESCE(ejercicios_completados, '{}'::jsonb))),
    (SELECT count(*) FROM jsonb_object_keys(COALESCE(ejercicios_completados, '{}'::jsonb))) + (SELECT count(*) FROM jsonb_object_keys(COALESCE(ejercicios_pendientes, '{}'::jsonb))),
    -- Minutos
    (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(COALESCE(minutos, '{}'::jsonb)) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(ejercicios_completados, '{}'::jsonb)))),
    (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(COALESCE(minutos, '{}'::jsonb)) v),
    -- Calorías (Suma del mapa JSONB calorias)
    (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(COALESCE(calorias, '{}'::jsonb)) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(ejercicios_completados, '{}'::jsonb)))),
    (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(COALESCE(calorias, '{}'::jsonb)) v),
    now()
FROM public.progreso_cliente;

-- 3. RECONSTRUCCIÓN NUTRICIÓN (Desde progreso_cliente_nutricion)
INSERT INTO public.progreso_diario_actividad (
    cliente_id, fecha, actividad_id, enrollment_id, tipo,
    nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros,
    recalculado_en
)
SELECT 
    cliente_id, 
    fecha, 
    actividad_id, 
    enrollment_id, 
    'programa',
    (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END)),
    (SELECT count(*) FROM jsonb_object_keys(COALESCE(macros, '{}'::jsonb))),
    (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(COALESCE(macros, '{}'::jsonb)) AS m(key, val) WHERE m.key::text IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) AS elem)),
    (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(COALESCE(macros, '{}'::jsonb)) AS m(key, val)),
    (SELECT jsonb_build_object(
        'p', jsonb_build_object(
            'c', COALESCE(SUM((v->>'p')::numeric) FILTER (WHERE k IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) AS elem)), 0),
            'o', COALESCE(SUM((v->>'p')::numeric), 0)
        ),
        'c', jsonb_build_object(
            'c', COALESCE(SUM((v->>'c')::numeric) FILTER (WHERE k IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) AS elem)), 0),
            'o', COALESCE(SUM((v->>'c')::numeric), 0)
        ),
        'f', jsonb_build_object(
            'c', COALESCE(SUM((v->>'g')::numeric) FILTER (WHERE k IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) AS elem)), 0),
            'o', COALESCE(SUM((v->>'g')::numeric), 0)
        )
    ) FROM jsonb_each(COALESCE(macros, '{}'::jsonb)) AS m(k, v)),
    now()
FROM public.progreso_cliente_nutricion
ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET
    nut_items_c = EXCLUDED.nut_items_c,
    nut_items_o = EXCLUDED.nut_items_o,
    nut_kcal_c = EXCLUDED.nut_kcal_c,
    nut_kcal_o = EXCLUDED.nut_kcal_o,
    nut_macros = EXCLUDED.nut_macros,
    recalculado_en = now();

-- 4. RECONSTRUCCIÓN TALLERES (Desde taller_progreso_temas)
INSERT INTO public.progreso_diario_actividad (
    cliente_id, fecha, actividad_id, enrollment_id, tipo,
    fit_items_c, fit_items_o, recalculado_en
)
SELECT 
    cliente_id,
    fecha_seleccionada,
    actividad_id,
    enrollment_id,
    'taller',
    COUNT(*) FILTER (WHERE asistio = true),
    COUNT(*),
    now()
FROM public.taller_progreso_temas
WHERE enrollment_id IS NOT NULL
GROUP BY cliente_id, fecha_seleccionada, actividad_id, enrollment_id
ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET
    fit_items_c = EXCLUDED.fit_items_c,
    fit_items_o = EXCLUDED.fit_items_o;

COMMIT;
