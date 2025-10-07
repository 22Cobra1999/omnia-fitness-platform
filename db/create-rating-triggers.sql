-- Crear triggers para mantener contadores actualizados
DROP TRIGGER IF EXISTS trigger_update_rating_counts ON activity_enrollments;

CREATE TRIGGER trigger_update_rating_counts
  AFTER INSERT OR UPDATE OR DELETE ON activity_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_rating_counts();
