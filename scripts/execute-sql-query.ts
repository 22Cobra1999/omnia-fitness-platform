
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if needed

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Provide a file path argument.');
        process.exit(1);
    }

    try {
        const sql = readFileSync(join(process.cwd(), filePath), 'utf-8');
        console.log(`🚀 Executing Query: ${filePath}`);

        const { data, error } = await supabase.rpc('execute_sql_select', {
            query: sql
        });

        if (error) {
            console.error('❌ RPC Error:', error.message);
            process.exit(1);
        }

        console.log('✅ Result:');
        console.log(JSON.stringify(data, null, 2));

    } catch (e: any) {
        console.error('❌ Unexpected Error:', e.message);
        process.exit(1);
    }
}

main();
