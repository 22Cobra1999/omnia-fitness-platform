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
    console.error('❌ Variables de entorno faltantes (URL o KEY)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function ejecutarSQL(sql: string) {
    // Dividir en statements individuales para mejor manejo de errores
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
        if (statement.length < 10) continue;

        try {
            const { data, error } = await supabase.rpc('execute_sql', {
                sql_query: statement + ';'
            });

            if (error) {
                if (error.message.includes('function') || error.message.includes('does not exist')) {
                    console.error('❌ La función RPC `execute_sql` no existe en la base de datos.');
                    console.error('   Debes ejecutar el SQL manualmente desde el Dashboard de Supabase.');
                    throw new Error('RPC_missing');
                }
                console.log(`   ⚠️  Error en statement: ${error.message.substring(0, 100)}`);
            } else {
                console.log(`   ✅ Statement ejecutado correctamente.`);
            }
        } catch (e: any) {
            if (e.message === 'RPC_missing') throw e;
            console.error(`   ❌ Error de ejecución: ${e.message}`);
        }
    }
}

async function main() {
    console.log('🚀 Aplicando fix de RLS para calendar_events...\n');

    try {
        const migrationPath = 'db/migrations/20260124_fix_calendar_insert_policies.sql';
        console.log(`📂 Leyendo archivo: ${migrationPath}`);

        const sql = readFileSync(
            join(process.cwd(), migrationPath),
            'utf-8'
        );

        await ejecutarSQL(sql);
        console.log('\n✅ Migración completada.');

    } catch (error: any) {
        console.error('\n❌ Falló la ejecución:', error.message);
        if (error.message === 'RPC_missing') {
            console.log('\n👉 POR FAVOR EJECUTA EL ARCHIVO SQL MANUALMENTE EN SUPABASE SQL EDITOR.');
            console.log(`   Archivo: db/migrations/20260124_fix_calendar_insert_policies.sql`);
        }
        process.exit(1);
    }
}

main();
