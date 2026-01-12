SELECT 1 AS x) t;

DROP FUNCTION IF EXISTS execute_sql_simple(text);

CREATE OR REPLACE FUNCTION execute_sql_simple(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS '
BEGIN
    EXECUTE sql_query;
END;
';

SELECT 1 FROM (SELECT 1 AS y
