import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const sql = `
-- REPARACIÓN V4: Soporte para 'exercises' y mayor robustez
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
    -- Obtener tipo y periodos
    SELECT type INTO v_type FROM activities WHERE id = p_activity_id;
    SELECT COALESCE(cantidad_periodos, 1) INTO v_periodos FROM periodos WHERE actividad_id = p_activity_id;

    IF v_type = 'program' THEN
        -- Calcular items únicos (soportando id o ejercicio_id)
        SELECT COUNT(DISTINCT item_id) INTO v_items_unicos
        FROM (
            SELECT COALESCE(elem->>'id', elem->>'ejercicio_id', elem->>'id_ejercicio') as item_id FROM planificacion_ejercicios,
            LATERAL (
                SELECT jsonb_array_elements(COALESCE(lunes->'ejercicios', lunes->'exercises', '[]'::jsonb)) as elem UNION ALL
                SELECT jsonb_array_elements(COALESCE(martes->'ejercicios', martes->'exercises', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(miercoles->'ejercicios', miercoles->'exercises', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(jueves->'ejercicios', jueves->'exercises', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(viernes->'ejercicios', viernes->'exercises', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(sabado->'ejercicios', sabado->'exercises', '[]'::jsonb)) UNION ALL
                SELECT jsonb_array_elements(COALESCE(domingo->'ejercicios', domingo->'exercises', '[]'::jsonb))
            ) as exploded WHERE actividad_id = p_activity_id AND jsonb_typeof(elem) = 'object'
        ) t WHERE item_id IS NOT NULL;

        -- Calcular métricas de semanas y sesiones (soportando ejercicios o exercises)
        SELECT 
            COALESCE(COUNT(DISTINCT numero_semana), 0) * v_periodos,
            SUM(
                (CASE WHEN jsonb_array_length(COALESCE(lunes->'ejercicios', lunes->'exercises', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(martes->'ejercicios', martes->'exercises', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(miercoles->'ejercicios', miercoles->'exercises', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(jueves->'ejercicios', jueves->'exercises', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(viernes->'ejercicios', viernes->'exercises', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(sabado->'ejercicios', sabado->'exercises', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
                (CASE WHEN jsonb_array_length(COALESCE(domingo->'ejercicios', domingo->'exercises', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END)
            ) * v_periodos,
            SUM(
                jsonb_array_length(COALESCE(lunes->'ejercicios', lunes->'exercises', '[]'::jsonb)) + 
                jsonb_array_length(COALESCE(martes->'ejercicios', martes->'exercises', '[]'::jsonb)) +
                jsonb_array_length(COALESCE(miercoles->'ejercicios', miercoles->'exercises', '[]'::jsonb)) + 
                jsonb_array_length(COALESCE(jueves->'ejercicios', jueves->'exercises', '[]'::jsonb)) +
                jsonb_array_length(COALESCE(viernes->'ejercicios', viernes->'exercises', '[]'::jsonb)) + 
                jsonb_array_length(COALESCE(sabado->'ejercicios', sabado->'exercises', '[]'::jsonb)) +
                jsonb_array_length(COALESCE(domingo->'ejercicios', domingo->'exercises', '[]'::jsonb))
            ) * v_periodos
        INTO v_total_semanas, v_total_sesiones, v_total_items
        FROM planificacion_ejercicios WHERE actividad_id = p_activity_id;

        UPDATE activities SET 
            semanas_totales = GREATEST(COALESCE(v_total_semanas, 0), 0), 
            sesiones_dias_totales = GREATEST(COALESCE(v_total_sesiones, 0), 0), 
            items_totales = GREATEST(COALESCE(v_total_items, 0), 0), 
            items_unicos = GREATEST(COALESCE(v_items_unicos, 0), 0), 
            periodos_configurados = v_periodos, 
            duration_weeks = GREATEST(COALESCE(v_total_semanas, 0), 0)
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

-- Actualizar los triggers para usar la V4
CREATE OR REPLACE FUNCTION trg_func_sync_activity_stats_v3() 
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_activity_stats_v4(COALESCE(NEW.actividad_id, OLD.actividad_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function main() {
    console.log('⏳ Aplicando corrección de trigger V4...');
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql, params: {} });
    if (error) {
        console.error('❌ Error applying SQL:', error);
    } else {
        console.log('✅ Trigger V4 instalado correctamente.');
    }
}

main();
