-- Trigger to update program stats when an activity_survey is inserted, updated, or deleted
CREATE OR REPLACE TRIGGER trg_update_activity_program_stats_on_survey
AFTER INSERT OR UPDATE OR DELETE ON activity_surveys
FOR EACH ROW EXECUTE FUNCTION update_activity_program_stats(COALESCE(NEW.activity_id, OLD.activity_id));
