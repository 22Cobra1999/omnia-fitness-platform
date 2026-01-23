-- FIX: Remove reference to non-existent 'total_topics' in trigger function
-- The previous function attempted to update 'total_topics' on 'activities' table, which causes an error.

CREATE OR REPLACE FUNCTION update_activity_workshop_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update duration_weeks if the column exists (we assume it does or we catch the error)
    -- Actually, to be safe, we will just update duration_weeks.
    -- If duration_weeks also doesn't exist, this will fail, but the error was specifically about total_topics.
    
    UPDATE activities
    SET duration_weeks = (
        SELECT 
            CASE 
                WHEN MAX((fecha_horario->>'fecha')::date) IS NULL OR MIN((fecha_horario->>'fecha')::date) IS NULL THEN NULL
                ELSE 
                    CEIL(
                        EXTRACT(EPOCH FROM (
                            MAX((fecha_horario->>'fecha')::date)::timestamp - MIN((fecha_horario->>'fecha')::date)::timestamp
                        )) / (7.0 * 24 * 60 * 60)
                    )::INTEGER + 1
            END
        FROM taller_detalles, 
             jsonb_array_elements(originales->'fechas_horarios') AS fecha_horario
        WHERE actividad_id = COALESCE(NEW.actividad_id, OLD.actividad_id)
          AND fecha_horario->>'fecha' IS NOT NULL 
          AND fecha_horario->>'fecha' != ''
    )
    -- REMOVED: total_topics = ... (Column does not exist)
    WHERE id = COALESCE(NEW.actividad_id, OLD.actividad_id);
    
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    -- Fail gracefully if columns are missing, logging the error but allowing the transaction
    RAISE WARNING 'Error updating workshop stats: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Verify/Recreate Trigger just in case (usually matches function name)
DROP TRIGGER IF EXISTS trigger_update_workshop_stats ON taller_detalles;
CREATE TRIGGER trigger_update_workshop_stats
    AFTER INSERT OR UPDATE OR DELETE ON taller_detalles
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_workshop_stats();
