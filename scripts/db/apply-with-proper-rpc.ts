import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env loading
const envFile = fs.readFileSync('.env.local', 'utf8');
const processEnv: Record<string, string> = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) processEnv[match[1].trim()] = match[2].trim().replace(/^['\"]|['\"]$/g, '');
});

const SUPABASE_URL = processEnv.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = processEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Usage: tsx scripts/db/apply-with-proper-rpc.ts <path-to-sql>');
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`🚀 Applying ${filePath}...`);

    // We split by semicolons to run as individual statements 
    // because execute_sql might not handle multiple DDLs in one go depending on the DB config 
    // but better yet, we try to run it as one block first.

    // Diana's RPC is 'execute_sql'
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql, params: {} });

    if (error) {
        console.error('❌ RPC Error:', error.message);
        if (error.details) console.error('Details:', error.details);
        process.exit(1);
    }

    if (data && data.error) {
        console.error('❌ SQL Error:', data.error);
        process.exit(1);
    }

    console.log('✅ Success!');
    if (data) console.log('Result:', data);
}

main();
