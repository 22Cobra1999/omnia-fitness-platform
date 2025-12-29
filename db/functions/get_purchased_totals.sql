-- Función para obtener las metas del cliente basadas en el total de lo comprado
CREATE OR REPLACE FUNCTION get_purchased_totals(client_id_param UUID)
RETURNS TABLE(
  type TEXT,
  kcal_target INTEGER,
  minutes_target INTEGER,
  exercises_target INTEGER,
  plates_target INTEGER,
  items_target INTEGER,
  items_label TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH purchased_totals AS (
      SELECT 
        b.client_id,
        a.type,
        -- Para fitness, contar ejercicios únicos
        CASE 
          WHEN a.type = 'fitness' THEN 
            COALESCE((SELECT COUNT(DISTINCT "key") 
                     FROM jsonb_object_keys(COALESCE(a.ejercicios_completados, '{}'))), 0)
          ELSE 0 
        END as total_exercises,
        -- Para nutrición, contar platos
        CASE 
          WHEN a.type = 'nutrition' THEN 
            COALESCE((SELECT COUNT(DISTINCT "key") 
                     FROM jsonb_object_keys(COALESCE(a.ejercicios_completados, '{}'))), 0)
          ELSE 0 
        END as total_plates,
        -- Sumar kcal totales del programa
        COALESCE(
          (SELECT SUM(value::numeric) 
           FROM jsonb_each_text(COALESCE(a.calorias_json, '{}'))), 0
        ) as total_kcal,
        -- Sumar minutos totales del programa
        COALESCE(
          (SELECT SUM(value::numeric) 
           FROM jsonb_each_text(COALESCE(a.minutos_json, '{}'))), 0
        ) as total_minutes
      FROM banco b
      JOIN activities a ON b.activity_id = a.id
      WHERE b.client_id = client_id_param 
        AND b.payment_status = 'completed'
        AND a.type IN ('fitness', 'nutrition')
    ),
    aggregated_totals AS (
      SELECT 
        type,
        SUM(total_exercises) as exercises_target,
        SUM(total_plates) as plates_target,
        SUM(total_kcal) as kcal_target,
        SUM(total_minutes) as minutes_target
      FROM purchased_totals
      GROUP BY type
    )
    SELECT 
      at.type,
      at.kcal_target::INTEGER,
      at.minutes_target::INTEGER,
      at.exercises_target::INTEGER,
      at.plates_target::INTEGER,
      CASE 
        WHEN at.type = 'fitness' THEN at.exercises_target
        WHEN at.type = 'nutrition' THEN at.plates_target
        ELSE at.exercises_target
      END::INTEGER as items_target,
      CASE 
        WHEN at.type = 'fitness' THEN 'ejercicios'
        WHEN at.type = 'nutrition' THEN 'platos'
        ELSE 'ejercicios'
      END as items_label
    FROM aggregated_totals at
    ORDER BY at.type;
END;
$$ LANGUAGE plpgsql;
