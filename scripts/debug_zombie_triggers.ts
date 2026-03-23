import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    
    const query = `
        SELECT 
            proname as function_name, 
            prosrc as source_code 
        FROM pg_proc 
        WHERE prosrc ILIKE '%total_sessions%'
        AND proname NOT LIKE 'calculate_activity_stats_v%'
    `;

    console.log('🔍 Buscando funciones que mencionen total_sessions...');
    const { data: functions, error: funcError } = await supabase.rpc('execute_sql', { sql_query: query, params: {} });

    if (funcError) {
        console.error('❌ Error buscando funciones:', funcError);
    } else {
        console.log('✅ Funciones encontradas:', functions);
    }

    const triggerQuery = `
        SELECT 
            tgname as trigger_name,
            relname as table_name
        FROM pg_trigger
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
        WHERE tgname ILIKE '%sync%' OR tgname ILIKE '%stats%'
    `;
    
    const { data: triggers, error: trigError } = await supabase.rpc('execute_sql', { sql_query: triggerQuery, params: {} });
    if (trigError) {
        console.error('❌ Error buscando triggers:', trigError);
    } else {
        console.log('✅ Triggers encontrados:', triggers);
    }
}

main();
