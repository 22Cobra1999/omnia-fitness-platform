-- ================================================================
-- SUPER NUCLEAR CLEANUP V4: DYNAMIC TRIGGER DESTRUCTION
-- ================================================================

-- PASO 1: ELIMINACIÓN DINÁMICA DE TRIGGERS
-- Este bloque recorre el catálogo del sistema y borra TODOS los triggers de las tablas afectadas.
-- No necesitamos saber sus nombres, los borrará todos.

DO $$
DECLARE
    t_name text;
    func_name text;
BEGIN
    RAISE NOTICE '🔥 INICIANDO PURGA DINÁMICA DE TRIGGERS...';

    -- 1.1 Borrar TODOS los triggers de 'planificacion_ejercicios'
    FOR t_name IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.planificacion_ejercicios'::regclass) LOOP
        EXECUTE 'DROP TRIGGER ' || quote_ident(t_name) || ' ON public.planificacion_ejercicios';
        RAISE NOTICE '   - Eliminado trigger: % en planificacion_ejercicios', t_name;
    END LOOP;

    -- 1.2 Borrar TODOS los triggers de 'periodos'
    FOR t_name IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.periodos'::regclass) LOOP
        EXECUTE 'DROP TRIGGER ' || quote_ident(t_name) || ' ON public.periodos';
        RAISE NOTICE '   - Eliminado trigger: % en periodos', t_name;
    END LOOP;

    -- 1.3 Borrar funciones viejas (calculo de stats)
    -- Aquí sí necesitamos nombres, pero usamos CASCADE para fuerza bruta
    DROP FUNCTION IF EXISTS calculate_activity_stats(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS calculate_activity_stats(UUID) CASCADE;
    DROP FUNCTION IF EXISTS calculate_activity_stats_v3(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS sync_activity_stats() CASCADE;
    DROP FUNCTION IF EXISTS trigger_sync_activity_stats() CASCADE;
    DROP FUNCTION IF EXISTS trigger_sync_activity_stats_final() CASCADE;
    DROP FUNCTION IF EXISTS trg_func_sync_activity_stats_v3() CASCADE;

    RAISE NOTICE '✅ Purga completada.';
END $$;


-- PASO 2: RESTAURAR TRIGGERS BÁSICOS (EL "updated_at")
-- Como borramos TODO, necesitamos restaurar el trigger de fecha de actualización

CREATE OR REPLACE FUNCTION actualizar_planificacion_ejercicios_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_planificacion_ejercicios_fecha
BEFORE UPDATE ON public.planificacion_ejercicios
FOR EACH ROW EXECUTE FUNCTION actualizar_planificacion_ejercicios_fecha();


-- PASO 3: INSTALAR NUEVO SISTEMA DE SINCRONIZACIÓN (V4)
-- Usamos nombres nuevos (V4) para garantizar unicidad.

-- 3.1 Función de cálculo (Versión 4 - Blindada)
CREATE OR REPLACE FUNCTION calculate_activity_stats_v4(p_activity_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_type TEXT;
    v_total_semanas INTEGER := 0;
    v_total_sesiones INTEGER := 0;
    v_total_items INTEGER := 0;
    v_items_unicos INTEGER := 0;
    v_periodos INTEGER := 1;
BEGIN
    -- Validar que la actividad existe
    SELECT type INTO v_type FROM activities WHERE id = p_activity_id;
    IF v_type IS NULL THEN
        RAISE NOTICE 'Actividad % no encontrada, saltando cálculo.', p_activity_id;
        RETURN;
    END IF;

    SELECT COALESCE(cantidad_periodos, 1) INTO v_periodos FROM periodos WHERE actividad_id = p_activity_id;

    IF v_type = 'program' THEN
        -- Calcular items únicos
        SELECT COUNT(DISTINCT item_id) INTO v_items_unicos
        FROM (
            SELECT (elem->>'id') as item_id FROM planificacion_ejercicios,
            LATERAL (
                SELECT jsonb_array_elements(COALESCE(lunes->'ejercicios', '[]'::jsonb)) as elem UNION ALL
                SELECT jsonb_array_elements(COALESCE(martes->'ejercicios', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(miercoles->'ejercicios', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(jueves->'ejercicios', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(viernes->'ejercicios', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(sabado->'ejercicios', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(domingo->'ejercicios', '[]'::jsonb))
            ) as exploded WHERE actividad_id = p_activity_id AND jsonb_typeof(elem) = 'object'
        ) t;

        -- Calcular métricas
        SELECT 
            COALESCE(COUNT(DISTINCT numero_semana), 0) * v_periodos,
            SUM((CASE WHEN jsonb_array_length(COALESCE(lunes->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(martes->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(miercoles->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(jueves->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(viernes->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(sabado->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(domingo->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END)) * v_periodos,
            SUM(jsonb_array_length(COALESCE(lunes->'ejercicios', '[]'::jsonb)) + jsonb_array_length(COALESCE(martes->'ejercicios', '[]'::jsonb)) +
                jsonb_array_length(COALESCE(miercoles->'ejercicios', '[]'::jsonb)) + jsonb_array_length(COALESCE(jueves->'ejercicios', '[]'::jsonb)) +
                jsonb_array_length(COALESCE(viernes->'ejercicios', '[]'::jsonb)) + jsonb_array_length(COALESCE(sabado->'ejercicios', '[]'::jsonb)) +
                jsonb_array_length(COALESCE(domingo->'ejercicios', '[]'::jsonb))) * v_periodos
        INTO v_total_semanas, v_total_sesiones, v_total_items
        FROM planificacion_ejercicios WHERE actividad_id = p_activity_id;

        -- UPDATE SEGURO (Sin columnas viejas)
        UPDATE activities SET 
            semanas_totales = v_total_semanas, 
            sesiones_dias_totales = v_total_sesiones, 
            items_totales = v_total_items, 
            items_unicos = v_items_unicos, 
            periodos_configurados = v_periodos, 
            duration_weeks = v_total_semanas -- Para compatibilidad
        WHERE id = p_activity_id;

    ELSIF v_type = 'document' THEN
        SELECT COUNT(*) INTO v_items_unicos FROM document_topics WHERE activity_id = p_activity_id;
        UPDATE activities SET items_unicos = v_items_unicos, items_totales = v_items_unicos WHERE id = p_activity_id;

    ELSIF v_type = 'workshop' THEN
        WITH workshop_stats AS (
            SELECT 
                COUNT(*) as temas_count,
                SUM(CASE 
                    WHEN jsonb_typeof(originales) = 'array' THEN jsonb_array_length(originales)
                    WHEN jsonb_typeof(originales->'fechas_horarios') = 'array' THEN jsonb_array_length(originales->'fechas_horarios')
                    ELSE 0 
                END) as dias_count
            FROM taller_detalles WHERE actividad_id = p_activity_id
        )
        SELECT temas_count, dias_count INTO v_items_unicos, v_total_sesiones FROM workshop_stats;
        UPDATE activities SET items_unicos = v_items_unicos, items_totales = v_items_unicos, sesiones_dias_totales = v_total_sesiones WHERE id = p_activity_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Función Trigger
CREATE OR REPLACE FUNCTION trg_func_sync_activity_stats_v4() 
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_activity_stats_v4(COALESCE(NEW.actividad_id, OLD.actividad_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.3 Instalar Nuevos Triggers
CREATE TRIGGER trg_sync_activity_stats_planificacion_v4
AFTER INSERT OR UPDATE OR DELETE ON public.planificacion_ejercicios 
FOR EACH ROW EXECUTE FUNCTION trg_func_sync_activity_stats_v4();

CREATE TRIGGER trg_sync_activity_stats_periodos_v4
AFTER INSERT OR UPDATE OR DELETE ON public.periodos 
FOR EACH ROW EXECUTE FUNCTION trg_func_sync_activity_stats_v4();

DO $$ BEGIN RAISE NOTICE '✅ REPARACIÓN EXITOSA: Sistema V4 activo.'; END $$;
