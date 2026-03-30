-- SCRIPT DE RECUPERACIÓN MAESTRO (FLAT COLUMNS)
-- Este script reconstruye PDA usando las nuevas columnas de enteros simples.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. LIMPIAR DATOS PREVIOS
    DELETE FROM public.progreso_diario_actividad;

    -- 2. RECUPERAR FITNESS (progreso_cliente)
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, enrollment_id, actividad_id, tipo,
        fit_items_c, fit_items_o, fit_mins_c, fit_mins_o,
        recalculado_en
    )
    SELECT 
        pc.cliente_id, pc.fecha, pc.enrollment_id, pc.actividad_id, 'programa',
        (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb))), 
        (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb))) + (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_pendientes, '{}'::jsonb))),
        (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(pc.minutos) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb)))),
        (SELECT COALESCE(SUM((v_obj.value::text)::numeric), 0) FROM jsonb_each_text(pc.minutos) v_obj),
        now()
    FROM public.progreso_cliente pc;

    -- 3. RECUPERAR NUTRICIÓN (progreso_cliente_nutricion)
    FOR r IN SELECT * FROM public.progreso_cliente_nutricion LOOP
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, enrollment_id, actividad_id, tipo,
            nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.enrollment_id, r.actividad_id, 'programa',
            (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END)),
            (SELECT count(*) FROM jsonb_object_keys(COALESCE(r.macros, '{}'::jsonb))),
            (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))),
            (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val)),
            jsonb_build_object(
                'p', jsonb_build_object(
                    'c', (SELECT COALESCE(SUM((val->>'p')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))),
                    'o', (SELECT COALESCE(SUM((val->>'p')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val))
                ),
                'c', jsonb_build_object(
                    'c', (SELECT COALESCE(SUM((val->>'c')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))),
                    'o', (SELECT COALESCE(SUM((val->>'c')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val))
                ),
                'f', jsonb_build_object(
                    'c', (SELECT COALESCE(SUM((val->>'g')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))),
                    'o', (SELECT COALESCE(SUM((val->>'g')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val))
                )
            ),
            now()
        )
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET
            nut_items_c = EXCLUDED.nut_items_c, nut_items_o = EXCLUDED.nut_items_o,
            nut_kcal_c = EXCLUDED.nut_kcal_c, nut_kcal_o = EXCLUDED.nut_kcal_o,
            nut_macros = EXCLUDED.nut_macros, recalculado_en = now();
    END LOOP;

    -- 4. RECUPERAR TALLERES (taller_progreso_temas)
    FOR r IN SELECT * FROM public.taller_progreso_temas LOOP
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, enrollment_id, actividad_id, tipo,
            fit_items_c, fit_items_o, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha_seleccionada, r.enrollment_id, r.actividad_id, 'taller',
            CASE WHEN r.asistio THEN 1 ELSE 0 END, 1,
            now()
        )
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET
            fit_items_c = EXCLUDED.fit_items_c,
            fit_items_o = EXCLUDED.fit_items_o,
            recalculado_en = now();
    END LOOP;

END $$;
