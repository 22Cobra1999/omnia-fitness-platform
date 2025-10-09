-- Crea una función utilitaria para ejecutar SQL arbitrario con Service Role
-- IMPORTANTE: Solo ejecutar desde un entorno seguro (Service Role)

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Permisos mínimos
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;


































