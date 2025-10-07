-- Función para obtener todas las actividades de un coach
CREATE OR REPLACE FUNCTION get_coach_activities_v2(coach_id_param UUID)
RETURNS SETOF activities
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM activities
  WHERE coach_id = coach_id_param
  ORDER BY created_at DESC;
$$;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_coach_activities_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION get_coach_activities_v2 TO anon;
GRANT EXECUTE ON FUNCTION get_coach_activities_v2 TO service_role;
