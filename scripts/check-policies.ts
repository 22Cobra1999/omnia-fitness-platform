#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env files
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('🔍 Checking policies for table: calendar_events');

    const { data, error } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, roles, qual, with_check')
        .eq('tablename', 'calendar_events')
        .eq('schemaname', 'public');

    if (error) {
        console.error('❌ Error fetching policies:', error);
        process.exit(1);
    }

    if (data) {
        console.table(data);

        const clientInsertPolicy = data.find(p => p.policyname === 'Clients can create their own events');
        if (clientInsertPolicy) {
            console.log('✅ Policy "Clients can create their own events" FOUND.');
            console.log('Policy details:', clientInsertPolicy);
        } else {
            console.error('❌ Policy "Clients can create their own events" NOT FOUND.');
        }
    }
}

main();
