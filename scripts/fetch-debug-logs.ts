#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
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
    console.log('📋 Fetching Debug Logs...');

    const { data, error } = await supabase
        .from('debug_log_table')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('❌ Error fetching logs:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️ No logs found.');
        return;
    }

    console.log('\n--- DEBUG LOGS ---');
    data.forEach(row => {
        console.log(`[${row.log_key}] ${row.log_value}`);
    });
    console.log('------------------\n');
}

main();
