CREATE OR REPLACE FUNCTION execute_sql_select(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
    RETURN result;
END;
$$;
