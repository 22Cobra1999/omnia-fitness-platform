-- Función para actualizar el estado de completado de una ejecución
-- Evita problemas con triggers que acceden a columnas inexistentes
CREATE OR REPLACE FUNCTION update_execution_completion(
  execution_id INTEGER,
  client_id TEXT,
  is_completed BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_execution RECORD;
BEGIN
  -- Verificar que la ejecución pertenece al cliente
  IF NOT EXISTS (
    SELECT 1 FROM ejecuciones_ejercicio 
    WHERE id = execution_id AND client_id = update_execution_completion.client_id
  ) THEN
    RETURN json_build_object(
      'error', 'Ejecución no encontrada o no autorizada'
    );
  END IF;

  -- Actualizar solo los campos necesarios
  UPDATE ejecuciones_ejercicio 
  SET 
    completado = is_completed,
    updated_at = NOW()
  WHERE id = execution_id AND client_id = update_execution_completion.client_id;

  -- Obtener la ejecución actualizada
  SELECT id, completado, updated_at
  INTO updated_execution
  FROM ejecuciones_ejercicio
  WHERE id = execution_id AND client_id = update_execution_completion.client_id;

  -- Retornar el resultado
  RETURN json_build_object(
    'success', true,
    'id', updated_execution.id,
    'completado', updated_execution.completado,
    'updated_at', updated_execution.updated_at
  );
END;
$$;
