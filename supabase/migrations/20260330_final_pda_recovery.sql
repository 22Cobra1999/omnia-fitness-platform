-- SCRIPT DEFINITIVO DE RECUPERACIÓN Y UNIFICACIÓN DE DATOS (PDA)
-- Este script reconstruye la tabla progreso_diario_actividad desde las fuentes originales.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. LIMPIAR DATOS PREVIOS (Opcional, pero recomendado para consistencia total en esta fase)
    DELETE FROM public.progreso_diario_actividad;

    -- 2. INSERTAR DESDE FITNESS (progreso_cliente)
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, enrollment_id, actividad_id, tipo,
        fitness_items, fitness_minutos, nutricion_items, nutricion_calorias, nutricion_macros, recalculado_en
    )
    SELECT 
        pc.cliente_id, 
        pc.fecha, 
        pc.enrollment_id, 
        pc.actividad_id, 
        'programa',
        -- fitness_items: total de ejercicios
        jsonb_build_object(
            'completados', (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb))), 
            'objetivo', (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb))) + (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_pendientes, '{}'::jsonb)))
        ),
        -- fitness_minutos: total de minutos
        jsonb_build_object(
            'completados', (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(pc.minutos) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb)))),
            'objetivo', (SELECT COALESCE(SUM((v_obj.value::text)::numeric), 0) FROM jsonb_each_text(pc.minutos) v_obj)
        ),
        '{"completados": 0, "objetivo": 0}'::jsonb, -- Nutrición inicial en 0
        '{"completados": 0, "objetivo": 0}'::jsonb, 
        '{}'::jsonb,
        now()
    FROM public.progreso_cliente pc;

    -- 3. UNIFICAR DESDE NUTRICIÓN (progreso_cliente_nutricion)
    -- Usamos ON CONFLICT para fusionar con lo insertado por Fitness
    FOR r IN SELECT * FROM public.progreso_cliente_nutricion LOOP
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, enrollment_id, actividad_id, tipo,
            fitness_items, fitness_minutos,
            nutricion_items, nutricion_calorias, nutricion_macros, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.enrollment_id, r.actividad_id, 'programa',
            '{"completados": 0, "objetivo": 0}'::jsonb, '{"completados": 0, "objetivo": 0}'::jsonb,
            -- nutricion_items
            jsonb_build_object(
                'completados', (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END)),
                'objetivo', (SELECT count(*) FROM jsonb_object_keys(COALESCE(r.macros, '{}'::jsonb)))
            ),
            -- nutricion_calorias (Kcal)
            jsonb_build_object(
                'completados', (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))),
                'objetivo', (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val))
            ),
            -- nutricion_macros (P, C, G)
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
        ON CONFLICT (cliente_id, fecha) DO UPDATE SET
            nutricion_items = EXCLUDED.nutricion_items,
            nutricion_calorias = EXCLUDED.nutricion_calorias,
            nutricion_macros = EXCLUDED.nutricion_macros,
            recalculado_en = now();
    END LOOP;

    -- 4. UNIFICAR DESDE TALLERES (taller_progreso_temas)
    FOR r IN SELECT * FROM public.taller_progreso_temas LOOP
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, enrollment_id, actividad_id, tipo,
            fitness_items, fitness_minutos,
            nutricion_items, nutricion_calorias, nutricion_macros, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha_seleccionada, r.enrollment_id, r.actividad_id, 'taller',
            jsonb_build_object('completados', CASE WHEN r.asistio THEN 1 ELSE 0 END, 'objetivo', 1),
            '{"completados": 0, "objetivo": 0}'::jsonb,
            '{"completados": 0, "objetivo": 0}'::jsonb,
            '{"completados": 0, "objetivo": 0}'::jsonb,
            '{}'::jsonb,
            now()
        )
        ON CONFLICT (cliente_id, fecha) DO UPDATE SET
            fitness_items = jsonb_build_object(
                'completados', (COALESCE((progreso_diario_actividad.fitness_items->>'completados')::int, 0) + CASE WHEN EXCLUDED.fitness_items->>'completados' = '1' THEN 1 ELSE 0 END),
                'objetivo', (COALESCE((progreso_diario_actividad.fitness_items->>'objetivo')::int, 0) + 1)
            ),
            recalculado_en = now();
    END LOOP;

END $$;
