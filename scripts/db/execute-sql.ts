import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('❌ Usage: tsx scripts/db/execute-sql.ts <path-to-sql-file>');
        process.exit(1);
    }

    try {
        const query = fs.readFileSync(sqlFile, 'utf8');
        console.log(`🚀 Executing SQL from: ${sqlFile}`);

        // We use a custom RPC function called 'exec_sql' if available. 
        // OR we try to find another way.
        // NOTE: Supabase JS client doesn't support direct SQL execution.
        // But many projects have an 'exec_sql' RPC for this purpose.
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });

        if (error) {
            console.error('❌ SQL Execution Error:', error.message);
            if (error.message.includes('function "exec_sql" does not exist')) {
                console.info('💡 Tip: You need to install the exec_sql function in Supabase first.');
                console.info('   Check db/functions/crear_funcion_exec_sql.sql');
            }
            process.exit(1);
        }

        console.log('✅ SQL Executed successfully!');
        if (data) console.log('Result:', data);
    } catch (err) {
        console.error('❌ Script Error:', err);
        process.exit(1);
    }
}

run();
