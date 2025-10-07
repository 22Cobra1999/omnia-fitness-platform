-- Función para obtener actividades de un coach directamente
CREATE OR REPLACE FUNCTION get_coach_activities(coach_id_param UUID)
RETURNS SETOF activities
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM activities 
  WHERE coach_id = coach_id_param
  ORDER BY created_at DESC;
$$;
