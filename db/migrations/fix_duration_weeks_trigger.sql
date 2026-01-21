-- ================================================================
-- FIX FINAL: REPARAR ERROR Y SINCRONIZAR STATS (VERSION SCOPE-FIX)
-- ================================================================

-- 1. Asegurar columna duration_weeks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'duration_weeks') THEN
        ALTER TABLE activities ADD COLUMN duration_weeks INTEGER;
    END IF;
END $$;

-- 2. Función de cálculo corregida (Scope Fix para CTEs)
CREATE OR REPLACE FUNCTION calculate_activity_stats(p_activity_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_type TEXT;
    v_total_semanas INTEGER := 0;
    v_total_sesiones INTEGER := 0;
    v_total_items INTEGER := 0;
    v_items_unicos INTEGER := 0;
    v_periodos INTEGER := 1;
BEGIN
    SELECT type INTO v_type FROM activities WHERE id = p_activity_id;
    SELECT COALESCE(cantidad_periodos, 1) INTO v_periodos FROM periodos WHERE actividad_id = p_activity_id;

    IF v_type = 'program' THEN
        -- Calcular items únicos por separado para evitar problemas de scope de CTE
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

        -- Calcular métricas de semanas y sesiones
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

        UPDATE activities SET 
            semanas_totales = v_total_semanas, 
            sesiones_dias_totales = v_total_sesiones, 
            items_totales = v_total_items, 
            items_unicos = v_items_unicos, 
            periodos_configurados = v_periodos, 
            duration_weeks = v_total_semanas 
        WHERE id = p_activity_id;

    ELSIF v_type = 'document' THEN
        SELECT COUNT(*) INTO v_items_unicos FROM document_topics WHERE actividad_id = p_activity_id;
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
        UPDATE activities SET items_unicos = v_items_unicos, items_totales = v_items_unicos, sesiones_dias_totales = v_total_sesiones, semanas_totales = 0 WHERE id = p_activity_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger genérico
CREATE OR REPLACE FUNCTION trigger_sync_activity_stats() RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_activity_stats(COALESCE(NEW.actividad_id, OLD.actividad_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-asociar Triggers
DROP TRIGGER IF EXISTS trg_sync_stats_planificacion ON planificacion_ejercicios;
CREATE TRIGGER trg_sync_stats_planificacion AFTER INSERT OR UPDATE OR DELETE ON planificacion_ejercicios FOR EACH ROW EXECUTE FUNCTION trigger_sync_activity_stats();

DROP TRIGGER IF EXISTS trg_sync_stats_periodos ON periodos;
CREATE TRIGGER trg_sync_stats_periodos AFTER INSERT OR UPDATE OR DELETE ON periodos FOR EACH ROW EXECUTE FUNCTION trigger_sync_activity_stats();

-- 5. Sincronización Inicial definitiva
DO $$
DECLARE act_record RECORD;
BEGIN
    FOR act_record IN SELECT id FROM activities LOOP
        PERFORM calculate_activity_stats(act_record.id);
    END LOOP;
END $$;
