-- Desactivar triggers legacy que rompen updates de progreso (daily summary)
-- IMPORTANTE: esto es destructivo. Revisar el listado antes de dropear.

-- 1) LISTAR triggers en progreso_cliente / progreso_cliente_nutricion
SELECT
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('progreso_cliente', 'progreso_cliente_nutricion')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 2) DROPEAR SOLO los triggers que parezcan estar ligados al daily summary
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT
      c.relname AS table_name,
      t.tgname AS trigger_name,
      pg_get_triggerdef(t.oid) AS trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('progreso_cliente', 'progreso_cliente_nutricion')
      AND NOT t.tgisinternal
      AND (
        t.tgname ILIKE '%daily%summary%'
        OR pg_get_triggerdef(t.oid) ILIKE '%daily_summary%'
        OR pg_get_triggerdef(t.oid) ILIKE '%progreso_cliente_daily_summary%'
        OR pg_get_triggerdef(t.oid) ILIKE '%v_progreso_cliente_daily_summary_source%'
      )
  ) LOOP
    RAISE NOTICE 'Dropping trigger %.% (%).', r.table_name, r.trigger_name, r.trigger_def;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', r.trigger_name, r.table_name);
  END LOOP;
END $$;

-- 3) Dropear la vista legacy usada por ese trigger
DROP VIEW IF EXISTS public.v_progreso_cliente_daily_summary_source;
