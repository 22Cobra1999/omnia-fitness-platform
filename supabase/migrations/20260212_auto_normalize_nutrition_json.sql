-- ==============================================================================
-- MIGRATION: AUTO-NORMALIZATION TRIGGER FOR NUTRITION PROGRESS
-- Description: Intercepts raw JSON data from Frontend and sanitizes it into 
--              clean ARRAYS before saving. This fixes the "Ghost State" bug permanently.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.normalize_nutrition_progress_data()
RETURNS TRIGGER AS $$
DECLARE
    v_clean_pending JSONB;
    v_clean_completed JSONB;
BEGIN
    -- 1. NORMALIZE 'ejercicios_pendientes' to {"ejercicios": [array]}
    -- Case A: Already good (has 'ejercicios' array) -> Keep it (but ensure it's not mixed with garbage)
    -- Case B: Object with keys -> Extract values to Array
    
    SELECT jsonb_build_object('ejercicios', COALESCE(
        (
            SELECT jsonb_agg(item)
            FROM (
                -- Priority 1: Existing Array in 'ejercicios' key
                SELECT value as item 
                FROM jsonb_array_elements(
                    CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'array' 
                         THEN NEW.ejercicios_pendientes->'ejercicios' 
                         ELSE '[]'::jsonb 
                    END
                )
                UNION ALL
                -- Priority 2: Object values (excluding metadata keys)
                SELECT value as item
                FROM jsonb_each(
                    CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' AND NOT (NEW.ejercicios_pendientes ? 'ejercicios')
                         THEN NEW.ejercicios_pendientes
                         WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'object'
                         THEN NEW.ejercicios_pendientes->'ejercicios'
                         ELSE '{}'::jsonb
                    END
                )
                WHERE key NOT IN ('orden', 'bloque', 'ejercicio_id', 'blockCount', 'blockNames')
            ) t
        ), 
        '[]'::jsonb
    )) INTO v_clean_pending;

    -- 2. NORMALIZE 'ejercicios_completados' to {"ejercicios": [array]}
    SELECT jsonb_build_object('ejercicios', COALESCE(
        (
            SELECT jsonb_agg(item)
            FROM (
                -- Priority 1: Existing Array
                SELECT value as item
                FROM jsonb_array_elements(
                    CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' 
                         THEN NEW.ejercicios_completados->'ejercicios' 
                         ELSE '[]'::jsonb 
                    END
                )
                UNION ALL
                -- Priority 2: Object values (composite keys like '753_1')
                SELECT value as item
                FROM jsonb_each(
                    CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' AND NOT (NEW.ejercicios_completados ? 'ejercicios')
                         THEN NEW.ejercicios_completados
                         WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'object'
                         THEN NEW.ejercicios_completados->'ejercicios'
                         ELSE '{}'::jsonb
                    END
                )
                WHERE key NOT IN ('orden', 'bloque', 'ejercicio_id')
            ) t
        ), 
        '[]'::jsonb
    )) INTO v_clean_completed;

    -- 3. APPLY NORMALIZED DATA
    NEW.ejercicios_pendientes := v_clean_pending;
    NEW.ejercicios_completados := v_clean_completed;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE TRIGGER (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS tr_normalize_nutrition_data ON public.progreso_cliente_nutricion;

CREATE TRIGGER tr_normalize_nutrition_data
BEFORE INSERT OR UPDATE ON public.progreso_cliente_nutricion
FOR EACH ROW
EXECUTE FUNCTION public.normalize_nutrition_progress_data();
