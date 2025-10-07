-- Trigger to update program stats when an activity_enrollment is inserted or deleted
CREATE OR REPLACE TRIGGER trg_update_activity_program_stats_on_enrollment
AFTER INSERT OR DELETE ON activity_enrollments
FOR EACH ROW EXECUTE FUNCTION update_activity_program_stats(COALESCE(NEW.activity_id, OLD.activity_id));
