-- ==============================================================================
-- MIGRATION: OPTIMIZE DAILY PROGRESS TRACKING V2
-- 1. Add enrollment_id to progreso_diario_actividad
-- 2. Refactor constraints/indices
-- 3. Backfill data from source tables (Fitness, Nutrition, Workshop)
-- ==============================================================================

-- 1. ADD COLUMN
ALTER TABLE public.progreso_diario_actividad 
ADD COLUMN IF NOT EXISTS enrollment_id BIGINT REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;

-- 2. UPDATE INDICES & CONSTRAINTS
-- We need to drop the old index that didn't account for enrollment
DROP INDEX IF EXISTS idx_progreso_actividad_dia;

-- Create new index including enrollment_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_progreso_actividad_enrollment_dia 
ON public.progreso_diario_actividad(enrollment_id, fecha);

-- Add constraint to ensure we don't duplicate days for the same enrollment
-- (Use a unique index instead of constraint for slightly better performance on upserts)
CREATE UNIQUE INDEX IF NOT EXISTS uq_progreso_enrollment_dia 
ON public.progreso_diario_actividad(enrollment_id, fecha);

-- 3. BACKFILL FUNCTION
CREATE OR REPLACE FUNCTION backfill_daily_progress_stats() RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_total INTEGER;
    v_completed INTEGER;
    v_enrollment_id BIGINT;
BEGIN
    -- [A] Truncate the table to start fresh (optional, but cleaner for a full regen)
    -- WARNING: Only do this if we are sure we are not losing manual edits.
    -- Since this table is a summary of others, it should be safe to regenerate.
    TRUNCATE TABLE public.progreso_diario_actividad RESTART IDENTITY;

    -- [B] Process FITNESS
    FOR r IN SELECT * FROM public.progreso_cliente WHERE enrollment_id IS NOT NULL LOOP
        -- Count items
        v_completed := (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_completados));
        v_total := v_completed + (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_pendientes));
        
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, 
            calorias, minutos, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.actividad_id, r.enrollment_id, 'programa', 'fitness',
            v_total, v_completed,
            -- Calculate cals from JSON
            (SELECT COALESCE(SUM((value::text)::numeric), 0) FROM jsonb_each_text(r.calorias_json)),
            (SELECT COALESCE(SUM((value::text)::numeric), 0) FROM jsonb_each_text(r.minutos_json)),
            NOW()
        );
    END LOOP;

    -- [C] Process NUTRITION
    FOR r IN SELECT * FROM public.progreso_cliente_nutricion WHERE enrollment_id IS NOT NULL LOOP
        -- Count items (Plates)
        v_completed := CASE 
            WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(r.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(r.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_completados))
            ELSE 0 
        END;
        v_total := v_completed + CASE 
            WHEN jsonb_typeof(r.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(r.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(r.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_pendientes))
            ELSE 0 
        END;

        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.actividad_id, r.enrollment_id, 'programa', 'nutricion',
            v_total, v_completed, NOW()
        );
    END LOOP;

    -- [D] Process WORKSHOPS (Talleres)
    -- Taller has no daily items, the "day" IS the item. 
    -- But we want to represent it in the timeline.
    FOR r IN SELECT * FROM public.taller_progreso_temas WHERE enrollment_id IS NOT NULL LOOP
        -- One topic = One "item" for that day
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha_seleccionada, r.actividad_id, r.enrollment_id, 'taller', 'general',
            1, -- Objective: Attend this class
            CASE WHEN r.asistio THEN 1 ELSE 0 END, -- Completed if attended
            NOW()
        )
        ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
            items_objetivo = progreso_diario_actividad.items_objetivo + 1,
            items_completados = progreso_diario_actividad.items_completados + EXCLUDED.items_completados;
            -- Accumulate topics if multiple classes on same day
    END LOOP;

END;
$$ LANGUAGE plpgsql;

-- 4. EXECUTE BACKFILL
SELECT backfill_daily_progress_stats();

-- 5. UPDATE TRIGGERS (Ensure future inserts encompass enrollment_id)
-- (We assume the triggers in 20260126_fix_shared_progress_migration.sql handle enrollment_id passing IF the source has it.
-- Let's double check update_daily_progress_from_program).

CREATE OR REPLACE FUNCTION update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_enrollment_id BIGINT;
    v_area TEXT;
    v_kcal NUMERIC := 0;
    v_mins INTEGER := 0;
BEGIN
    -- Capture Enrollment ID
    v_enrollment_id := NEW.enrollment_id;

    -- Determine Area & Counts (Same logic as migration)
    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        v_completed_items := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados))
            ELSE 0 
        END;
        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes))
            ELSE 0 
        END;
    ELSE
        v_area := 'fitness';
        v_completed_items := CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) ELSE 0 END;
        v_total_items := v_completed_items + CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) ELSE 0 END;
        
        -- Cals/Mins
        IF jsonb_typeof(NEW.calorias_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_kcal FROM jsonb_each_text(NEW.calorias_json);
        END IF;
        IF jsonb_typeof(NEW.minutos_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_mins FROM jsonb_each_text(NEW.minutos_json);
        END IF;
    END IF;

    -- Upsert
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
        items_objetivo, items_completados, 
        calorias, minutos, recalculado_en
    ) VALUES (
        NEW.cliente_id, NEW.fecha, NEW.actividad_id, v_enrollment_id, 'programa', v_area,
        v_total_items, v_completed_items,
        v_kcal, v_mins, NOW()
    )
    ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
        items_objetivo = EXCLUDED.items_objetivo,
        items_completados = EXCLUDED.items_completados,
        calorias = EXCLUDED.calorias,
        minutos = EXCLUDED.minutos,
        recalculado_en = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
