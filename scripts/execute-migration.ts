#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
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

    console.log(`🚀 Executing migration: ${filePath}`);

    try {
        const sql = readFileSync(join(process.cwd(), filePath), 'utf-8');

        // Split mostly by semicolon, but handle some basic cases. Basic split for now.
        // The previous script split by ';' which might be brittle for functions but works for simple policies.
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        for (const statement of statements) {
            if (statement.length < 5) continue;

            const { error } = await supabase.rpc('execute_sql', {
                sql_query: statement + ';'
            });

            if (error) {
                console.error(`❌ Error executing statement:\n${statement}\nError: ${error.message}`);
                // Continue or exit? Let's continue to try other statements or if it's "already exists"
            } else {
                console.log('✅ Statement executed.');
            }
        }
        console.log('🏁 Migration finished.');

    } catch (e: any) {
        console.error('❌ Error reading or executing file:', e.message);
        process.exit(1);
    }
}

main();
