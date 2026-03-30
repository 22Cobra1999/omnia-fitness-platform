-- FINAL REPAIR: Unify per (cliente_id, fecha)
DO $$
BEGIN
    -- 1. Create a temporary table with merged data by client/date
    CREATE TEMP TABLE pda_merged_final (
        cliente_id UUID,
        fecha DATE,
        enrollment_id BIGINT,
        actividad_id BIGINT,
        tipo TEXT,
        fitness_items JSONB,
        fitness_minutos JSONB,
        nutricion_items JSONB,
        nutricion_calorias JSONB,
        nutricion_macros JSONB,
        recalculado_en TIMESTAMP WITHOUT TIME ZONE
    );

    INSERT INTO pda_merged_final
    SELECT 
        cliente_id, 
        fecha, 
        MAX(enrollment_id), -- Store one of the IDs
        MAX(actividad_id),
        MAX(tipo),
        -- Merge fitness_items
        (SELECT val FROM (
            SELECT fitness_items as val FROM public.progreso_diario_actividad p2 
            WHERE p2.cliente_id = p1.cliente_id AND p2.fecha = p1.fecha 
            ORDER BY (COALESCE((fitness_items->>'objetivo')::numeric, 0)) DESC LIMIT 1
        ) t),
        -- Merge fitness_minutos
        (SELECT val FROM (
            SELECT fitness_minutos as val FROM public.progreso_diario_actividad p2 
            WHERE p2.cliente_id = p1.cliente_id AND p2.fecha = p1.fecha 
            ORDER BY (COALESCE((fitness_minutos->>'objetivo')::numeric, 0)) DESC LIMIT 1
        ) t),
        -- Merge nutricion_items
        (SELECT val FROM (
            SELECT nutricion_items as val FROM public.progreso_diario_actividad p2 
            WHERE p2.cliente_id = p1.cliente_id AND p2.fecha = p1.fecha 
            ORDER BY (COALESCE((nutricion_items->>'objetivo')::numeric, 0)) DESC LIMIT 1
        ) t),
        -- Merge nutricion_calorias
        (SELECT val FROM (
            SELECT nutricion_calorias as val FROM public.progreso_diario_actividad p2 
            WHERE p2.cliente_id = p1.cliente_id AND p2.fecha = p1.fecha 
            ORDER BY (COALESCE((nutricion_calorias->>'objetivo')::numeric, 0)) DESC LIMIT 1
        ) t),
        -- Merge nutricion_macros
        (SELECT nutricion_macros FROM public.progreso_diario_actividad p2 
         WHERE p2.cliente_id = p1.cliente_id AND p2.fecha = p1.fecha AND nutricion_macros IS DISTINCT FROM '{}'::jsonb LIMIT 1),
        MAX(recalculado_en)
    FROM public.progreso_diario_actividad p1
    GROUP BY cliente_id, fecha;

    -- 2. Clear the table
    TRUNCATE public.progreso_diario_actividad;

    -- 3. Restore merged data
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, enrollment_id, actividad_id, tipo,
        fitness_items, fitness_minutos, nutricion_items, nutricion_calorias, nutricion_macros,
        recalculado_en
    )
    SELECT * FROM pda_merged_final;

    -- 4. Update the unique index to be per (cliente_id, fecha)
    DROP INDEX IF EXISTS idx_pda_enrollment_fecha;
    DROP INDEX IF EXISTS idx_progreso_actividad_dia;
    CREATE UNIQUE INDEX idx_pda_cliente_fecha ON public.progreso_diario_actividad (cliente_id, fecha);

    -- 5. Final clean up of old columns
    UPDATE public.progreso_diario_actividad SET
        items_objetivo = NULL,
        items_completados = NULL,
        minutos = NULL,
        calorias = NULL,
        minutos_objetivo = NULL,
        calorias_objetivo = NULL,
        proteinas = NULL,
        carbohidratos = NULL,
        grasas = NULL,
        area = 'general'
    WHERE id IS NOT NULL;

END $$;

-- 6. Update Trigger to UPSERT by (cliente_id, fecha)
CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER := 0;
    v_completed_items INTEGER := 0;
    v_kcal_comp NUMERIC := 0;
    v_mins_comp INTEGER := 0;
    v_kcal_obj NUMERIC := 0;
    v_mins_obj INTEGER := 0;
    v_p_comp NUMERIC := 0;
    v_c_comp NUMERIC := 0;
    v_f_comp NUMERIC := 0;
    v_p_obj NUMERIC := 0;
    v_c_obj NUMERIC := 0;
    v_f_obj NUMERIC := 0;
    v_new_data JSONB;
    v_enrollment_id BIGINT;
    v_fecha DATE;
    v_cliente_id UUID;
    v_actividad_id BIGINT;
    v_json_items JSONB;
    v_json_metrics JSONB;
    v_json_macros JSONB;
BEGIN
    v_new_data := to_jsonb(NEW);
    v_enrollment_id := (v_new_data->>'enrollment_id')::BIGINT;
    v_fecha := (v_new_data->>'fecha')::DATE;
    v_cliente_id := (v_new_data->>'cliente_id')::UUID;
    v_actividad_id := (v_new_data->>'actividad_id')::BIGINT;

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        -- Nutrition Calc... (OMITTED for brevity in thought, but I'll write the full logic)
        -- ... SAME AS PREVIOUS ...
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.macros, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM (
            SELECT key FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb))
            INTERSECT
            SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb))
        ) t);

        SELECT COALESCE(SUM((value->>'calorias')::numeric), 0), COALESCE(SUM((value->>'minutos')::numeric), 0),
               COALESCE(SUM((value->>'proteinas')::numeric), 0), COALESCE(SUM((value->>'carbohidratos')::numeric), 0), COALESCE(SUM((value->>'grasas')::numeric), 0)
        INTO v_kcal_obj, v_mins_obj, v_p_obj, v_c_obj, v_f_obj
        FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb));

        SELECT COALESCE(SUM((m.value->>'calorias')::numeric), 0), COALESCE(SUM((m.value->>'minutos')::numeric), 0),
               COALESCE(SUM((m.value->>'proteinas')::numeric), 0), COALESCE(SUM((m.value->>'carbohidratos')::numeric), 0), COALESCE(SUM((m.value->>'grasas')::numeric), 0)
        INTO v_kcal_comp, v_mins_comp, v_p_comp, v_c_comp, v_f_comp
        FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb)) m
        WHERE m.key IN (SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));

        v_json_items := jsonb_build_object('completados', v_completed_items, 'objetivo', v_total_items);
        v_json_metrics := jsonb_build_object('completados', v_kcal_comp, 'objetivo', v_kcal_obj);
        v_json_macros := jsonb_build_object(
            'p', jsonb_build_object('c', v_p_comp, 'o', v_p_obj),
            'c', jsonb_build_object('c', v_c_comp, 'o', v_c_obj),
            'f', jsonb_build_object('c', v_f_comp, 'o', v_f_obj)
        );

        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, nutricion_items, nutricion_calorias, nutricion_macros)
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_json_items, v_json_metrics, v_json_macros)
        ON CONFLICT (cliente_id, fecha) -- KEY CHANGE
        DO UPDATE SET
            nutricion_items = EXCLUDED.nutricion_items,
            nutricion_calorias = EXCLUDED.nutricion_calorias,
            nutricion_macros = EXCLUDED.nutricion_macros,
            enrollment_id = EXCLUDED.enrollment_id,
            recalculado_en = NOW();

    ELSE
        -- Fitness Calc...
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.minutos_json, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));

        SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(COALESCE(NEW.minutos_json, '{}'::jsonb));
        SELECT COALESCE(SUM((m.value::text)::numeric), 0) INTO v_mins_comp 
        FROM jsonb_each_text(COALESCE(NEW.minutos_json, '{}'::jsonb)) m
        WHERE m.key IN (SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));

        v_json_items := jsonb_build_object('completados', v_completed_items, 'objetivo', v_total_items);
        v_json_metrics := jsonb_build_object('completados', v_mins_comp, 'objetivo', v_mins_obj);

        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, fitness_items, fitness_minutos)
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_json_items, v_json_metrics)
        ON CONFLICT (cliente_id, fecha) -- KEY CHANGE
        DO UPDATE SET
            fitness_items = EXCLUDED.fitness_items,
            fitness_minutos = EXCLUDED.fitness_minutos,
            enrollment_id = EXCLUDED.enrollment_id,
            recalculado_en = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
