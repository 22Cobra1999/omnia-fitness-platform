-- Crear trigger para actualizar la vista materializada automáticamente
DROP TRIGGER IF EXISTS trg_refresh_activity_program_stats ON activity_surveys;

CREATE TRIGGER trg_refresh_activity_program_stats
    AFTER INSERT OR UPDATE OR DELETE ON activity_surveys
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_activity_rating_stats();
