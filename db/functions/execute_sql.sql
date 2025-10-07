-- ADVERTENCIA: Esta función es potencialmente peligrosa y solo debe usarse para diagnóstico
-- Elimínala después de resolver el problema
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT) 
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
