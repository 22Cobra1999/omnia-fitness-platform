-- Crear función para actualizar ejecuciones sin triggers problemáticos
CREATE OR REPLACE FUNCTION update_execution_completion_safe(
  execution_id INTEGER,
  client_id TEXT,
  is_completed BOOLEAN
)
RETURNS TABLE(
  id INTEGER,
  completado BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que la ejecución existe y pertenece al cliente
  IF NOT EXISTS (
    SELECT 1 FROM ejecuciones_ejercicio 
    WHERE ejecuciones_ejercicio.id = execution_id 
    AND ejecuciones_ejercicio.client_id = client_id
  ) THEN
    RAISE EXCEPTION 'Ejecución no encontrada o no autorizada';
  END IF;

  -- Actualizar usando SQL directo para evitar triggers
  UPDATE ejecuciones_ejercicio 
  SET completado = is_completed
  WHERE ejecuciones_ejercicio.id = execution_id 
  AND ejecuciones_ejercicio.client_id = client_id;

  -- Retornar los datos actualizados
  RETURN QUERY
  SELECT 
    ejecuciones_ejercicio.id,
    ejecuciones_ejercicio.completado,
    ejecuciones_ejercicio.updated_at
  FROM ejecuciones_ejercicio
  WHERE ejecuciones_ejercicio.id = execution_id 
  AND ejecuciones_ejercicio.client_id = client_id;
END;
$$;
