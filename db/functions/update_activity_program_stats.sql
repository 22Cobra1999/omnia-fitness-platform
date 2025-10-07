-- Function to update program_rating and total_program_reviews for a given activity
CREATE OR REPLACE FUNCTION update_activity_program_stats(activity_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE activities
  SET
    program_rating = COALESCE((
      SELECT AVG((metadata->>'difficulty_rating')::numeric)
      FROM activity_surveys
      WHERE activity_id = activity_id_param
    ), 0.00),
    total_program_reviews = COALESCE((
      SELECT COUNT(*)
      FROM activity_enrollments
      WHERE activity_id = activity_id_param
    ), 0)
  WHERE id = activity_id_param;
END;
$$ LANGUAGE plpgsql;
