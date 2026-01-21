-- ================================================================
-- REPARACIÓN DEFINITIVA: ELIMINAR INTERFERENCIAS DE "TOTAL_SESSIONS"
-- ================================================================

-- PASO 1: LIMPIEZA TOTAL DE FUNCIONES Y TRIGGERS (MODO SEGURO)
DO $$
DECLARE
    func_record RECORD;
    trig_record RECORD;
BEGIN
    RAISE NOTICE '🧹 Iniciando limpieza profunda...';

    -- 1. Borrar Triggers que puedan ser los culpables
    RAISE NOTICE '  - Eliminando triggers sospechosos...';
    DROP TRIGGER IF EXISTS trg_sync_activity_stats ON public.planificacion_ejercicios;
    DROP TRIGGER IF EXISTS sync_activity_stats_trigger ON public.planificacion_ejercicios;
    DROP TRIGGER IF EXISTS trg_sync_stats_planificacion ON public.planificacion_ejercicios;
    DROP TRIGGER IF EXISTS trg_sync_stats_planificacion_v2 ON public.planificacion_ejercicios;
    DROP TRIGGER IF EXISTS trg_sync_stats_periodos ON public.periodos;
    DROP TRIGGER IF EXISTS trg_sync_stats_periodos_v2 ON public.periodos;
    DROP TRIGGER IF EXISTS sync_periodos_stats_trigger ON public.periodos;

    -- 2. Borrar Funciones (CASCADE para asegurar que mueran los triggers ocultos)
    RAISE NOTICE '  - Eliminando funciones antiguas (CASCADE)...';
    DROP FUNCTION IF EXISTS calculate_activity_stats(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS calculate_activity_stats(UUID) CASCADE;
    DROP FUNCTION IF EXISTS sync_activity_stats() CASCADE;
    DROP FUNCTION IF EXISTS trigger_sync_activity_stats() CASCADE;
    DROP FUNCTION IF EXISTS trigger_sync_activity_stats_final() CASCADE;
    
    RAISE NOTICE '✅ Limpieza de legacy completada.';
END $$;


-- PASO 2: ACTIVAR COLUMNAS MODERNAS
DO $$
BEGIN
    -- Asegurar duration_weeks (para compatibilidad)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'duration_weeks') THEN
        ALTER TABLE activities ADD COLUMN duration_weeks INTEGER DEFAULT 0;
    END IF;
END $$;


-- PASO 3: RE-INSTALACIÓN DE LA LÓGICA CORRECTA (SIN TOTAL_SESSIONS)
-- 1. Función de cálculo limpia
CREATE OR REPLACE FUNCTION calculate_activity_stats_v3(p_activity_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_type TEXT;
    v_total_semanas INTEGER := 0;
    v_total_sesiones INTEGER := 0;
    v_total_items INTEGER := 0;
    v_items_unicos INTEGER := 0;
    v_periodos INTEGER := 1;
BEGIN
    -- Obtener tipo y periodos
    SELECT type INTO v_type FROM activities WHERE id = p_activity_id;
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

        -- UPDATE SIN "total_sessions"
        UPDATE activities SET 
            semanas_totales = v_total_semanas, 
            sesiones_dias_totales = v_total_sesiones, 
            items_totales = v_total_items, 
            items_unicos = v_items_unicos, 
            periodos_configurados = v_periodos, 
            duration_weeks = v_total_semanas 
        WHERE id = p_activity_id;

    ELSIF v_type = 'document' THEN
        SELECT COUNT(*) INTO v_items_unicos FROM document_topics WHERE activity_id = p_activity_id;
        UPDATE activities SET 
            items_unicos = v_items_unicos, 
            items_totales = v_items_unicos,
            semanas_totales = 0,
            sesiones_dias_totales = 0
        WHERE id = p_activity_id;

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
        UPDATE activities SET 
            items_unicos = v_items_unicos, 
            items_totales = v_items_unicos, 
            sesiones_dias_totales = v_total_sesiones, 
            semanas_totales = 0 
        WHERE id = p_activity_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Función Trigger
CREATE OR REPLACE FUNCTION trg_func_sync_activity_stats_v3() 
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_activity_stats_v3(COALESCE(NEW.actividad_id, OLD.actividad_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-asociar Triggers
CREATE TRIGGER trg_sync_activity_stats_planificacion_v3
AFTER INSERT OR UPDATE OR DELETE ON public.planificacion_ejercicios 
FOR EACH ROW EXECUTE FUNCTION trg_func_sync_activity_stats_v3();

CREATE TRIGGER trg_sync_activity_stats_periodos_v3
AFTER INSERT OR UPDATE OR DELETE ON public.periodos 
FOR EACH ROW EXECUTE FUNCTION trg_func_sync_activity_stats_v3();

DO $$ BEGIN RAISE NOTICE '✅ Sistema de sincronización V3 instalado correctamente.'; END $$;
