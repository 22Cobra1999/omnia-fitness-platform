-- Create execute_sql RPC function
-- This allows executing arbitrary SQL from the Supabase client (used by our CLI scripts).

CREATE OR REPLACE FUNCTION execute_sql_simple(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
END;
$$;

-- Grant execution to service_role only (safe)
REVOKE EXECUTE ON FUNCTION execute_sql_simple(text) FROM public;
REVOKE EXECUTE ON FUNCTION execute_sql_simple(text) FROM anon;
REVOKE EXECUTE ON FUNCTION execute_sql_simple(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION execute_sql_simple(text) TO service_role;
