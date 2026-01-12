#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const envPaths = ['.env.local', '.env'];
for (const envPath of envPaths) {
    try {
        const envFile = readFileSync(join(process.cwd(), envPath), 'utf8');
        envFile.split('\n').forEach(line => {
            if (line.trim() && !line.trim().startsWith('#')) {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
                }
            }
        });
    } catch (e) { }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variables de entorno faltantes');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Provide a file path argument.');
        process.exit(1);
    }

    console.log(`🚀 Executing full SQL file: ${filePath}`);

    try {
        const sql = readFileSync(join(process.cwd(), filePath), 'utf-8');

        const { data, error } = await supabase.rpc('execute_sql_simple', {
            sql_query: sql
        });

        if (error) {
            // Check if the error text contains "RAISE NOTICE" output which often comes as error message in some clients but usually it is separate.
            // Supabase RPC returns output in error message usually if it raises exception.
            // Valid DO block output might be hidden unless we use exception.
            console.error(`❌ Error executing SQL:\n${error.message}`);
            if (error.details) console.error('Details:', error.details);
            if (error.hint) console.error('Hint:', error.hint);
        } else {
            console.log('✅ SQL executed successfully.');
        }

    } catch (e: any) {
        console.error('❌ Error reading or executing file:', e.message);
        process.exit(1);
    }
}

main();
