CREATE OR REPLACE FUNCTION insert_enrollment(
  p_activity_id INTEGER,
  p_client_id UUID,
  p_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_id INTEGER;
BEGIN
  -- Insertar el registro
  INSERT INTO activity_enrollments (
    activity_id,
    client_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_activity_id,
    p_client_id,
    p_status,
    NOW(),
    NOW()
  ) RETURNING id INTO v_id;
  
  -- Construir el resultado
  SELECT jsonb_build_object(
    'id', id,
    'activity_id', activity_id,
    'client_id', client_id,
    'status', status,
    'created_at', created_at
  ) INTO v_result
  FROM activity_enrollments
  WHERE id = v_id;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
