-- Función para obtener las metas diarias del cliente basadas en sus compras
CREATE OR REPLACE FUNCTION get_client_targets(client_id_param UUID)
RETURNS TABLE(
  type TEXT,
  kcal_target INTEGER,
  minutes_target INTEGER,
  exercises_target INTEGER,
  plates_target INTEGER,
  program_duration_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH client_latest_purchase AS (
      -- Obtener la compra más reciente del cliente por tipo de actividad
      SELECT 
        b.client_id,
        a.type,
        a.id as activity_id,
        a.title,
        b.created_at as purchase_date,
        ROW_NUMBER() OVER (PARTITION BY b.client_id, a.type ORDER BY b.created_at DESC) as rn
      FROM banco b
      JOIN activities a ON b.activity_id = a.id
      WHERE b.client_id = client_id_param 
        AND b.payment_status = 'completed'
        AND a.type IN ('fitness', 'nutrition')
    ),
    client_targets AS (
      -- Obtener metas de la compra más reciente por tipo
      SELECT 
        client_id,
        type,
        activity_id,
        title,
        COALESCE(a.daily_kcal_target, 500) as kcal_target,
        COALESCE(a.daily_minutes_target, 60) as minutes_target,
        COALESCE(a.daily_exercises_target, 3) as exercises_target,
        COALESCE(a.daily_plates_target, 4) as plates_target,
        COALESCE(a.program_duration_days, 30) as program_duration_days
      FROM client_latest_purchase clp
      JOIN activities a ON clp.activity_id = a.id
      WHERE clp.rn = 1
    )
    -- Retornar metas por tipo de actividad
    SELECT 
      ct.type,
      ct.kcal_target,
      ct.minutes_target,
      ct.exercises_target,
      ct.plates_target,
      ct.program_duration_days
    FROM client_targets ct
    ORDER BY ct.type;
END;
$$ LANGUAGE plpgsql;

-- Crear política para que los clientes puedan ver sus propias metas
DROP POLICY IF EXISTS "Clients can view their own targets" ON activities;
CREATE POLICY "Clients can view their own targets" ON activities
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM banco WHERE activity_id = activities.id
    )
  );
