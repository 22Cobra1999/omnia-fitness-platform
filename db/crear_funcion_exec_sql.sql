-- Crear función para ejecutar SQL dinámicamente
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY EXECUTE sql_query;
END;
$$;























