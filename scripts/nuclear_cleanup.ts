import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    
    // 1. Escanear políticas de seguridad (RLS)
    const setupSql = `
    TRUNCATE debug_triggers_info;

    -- Volcar Políticas de RLS sospechosas
    INSERT INTO debug_triggers_info (tgname, relname, prosrc)
    SELECT polname, tablename, qual::text
    FROM pg_policy
    WHERE qual::text ILIKE '%total_sessions%'
       OR with_check::text ILIKE '%total_sessions%';

    -- Volcar Triggers internos (tgisinternal = true)
    INSERT INTO debug_triggers_info (tgname, relname)
    SELECT tgname, relname 
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE (c.relname = 'nutrition_program_details')
    AND tgisinternal = true;
    `;

    console.log('⏳ Escaneando políticas de RLS y triggers internos...');
    await supabase.rpc('execute_sql', { sql_query: setupSql, params: {} });

    // 2. Leer la tabla
    const { data, error } = await supabase.from('debug_triggers_info').select('*');

    if (error) {
        console.error('❌ Error capturando detalles:', error);
    } else {
        console.log('✅ REPORTE DE INSPECCIÓN RLS:');
        console.log(JSON.stringify(data, null, 2));
    }
}

main();
