-- ================================================================
-- 🏛️ DIANA - SEGURIDAD Y AUTOMATIZACIÓN NATIVA (FEBRERO 2026)
-- 1. Función Universal de Timestamps
-- 2. Aplicación de Triggers a tablas clave
-- 3. Reporte de Auditoría de RLS (Log de ejecución)
-- ================================================================

-- 1. Crear o actualizar la función de timestamp automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicar triggers a tablas que tengan la columna updated_at pero no el trigger
-- Usamos un bloque anónimo para detectar y aplicar automáticamente
DO $$ 
DECLARE 
    current_table_name TEXT;
BEGIN 
    -- Buscamos tablas (no vistas) que tengan la columna updated_at
    FOR current_table_name IN 
        SELECT c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE c.table_schema = 'public' 
        AND c.column_name = 'updated_at' 
        AND t.table_type = 'BASE TABLE'
        AND c.table_name NOT IN ('pg_stat_statements')
    LOOP 
        -- Intentar eliminar si ya existe para evitar errores de duplicado
        EXECUTE format('DROP TRIGGER IF EXISTS tr_set_updated_at ON public.%I', current_table_name);
        
        -- Crear el trigger
        EXECUTE format('CREATE TRIGGER tr_set_updated_at 
                        BEFORE UPDATE ON public.%I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION public.handle_updated_at()', current_table_name);
        
        RAISE NOTICE '✅ Trigger de timestamp aplicado a: %', current_table_name;
    END LOOP;
END $$;

-- 3. AUDITORÍA DE SEGURIDAD RLS (Para el log de Diana)
-- Este SELECT nos dirá qué tablas NO tienen RLS habilitado (riesgo crítico)
DO $$
DECLARE
    insecure_tables TEXT;
BEGIN
    SELECT string_agg(tablename, ', ') INTO insecure_tables
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN (
      SELECT DISTINCT tablename FROM pg_policies
    )
    AND tablename NOT IN (
      SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND relrowsecurity = true
    );

    IF insecure_tables IS NOT NULL THEN
        RAISE NOTICE '⚠️ AVISO DE SEGURIDAD: Tablas sin RLS activo: %', insecure_tables;
    ELSE
        RAISE NOTICE '🛡️ ÉXITO: Todas las tablas públicas tienen RLS activo.';
    END IF;
END $$;
