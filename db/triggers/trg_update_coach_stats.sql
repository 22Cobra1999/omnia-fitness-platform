-- Trigger que actualiza los stats de coaches después de que se inserta, actualiza o elimina un survey.
-- Este trigger refresca la vista materializada 'activity_program_stats' primero,
-- y luego llama a la función 'update_coach_rating_stats' para actualizar los coaches.
DROP TRIGGER IF EXISTS trg_update_coach_stats ON activity_surveys;

CREATE TRIGGER trg_update_coach_stats
AFTER INSERT OR UPDATE OR DELETE ON activity_surveys
FOR EACH STATEMENT EXECUTE FUNCTION update_coach_rating_stats();
