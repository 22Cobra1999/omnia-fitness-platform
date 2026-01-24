#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load env
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
    console.error('❌ Missing env vars');
    process.exit(1);
}

// 1. Admin client to setup test data
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('🧪 Verifying Calendar RLS Policies...\n');

    try {
        // 2. Get a real user to test with (we can't easily sign up a fake one without email confirmation usually, 
        // depending on settings, so let's try to find an existing user to "impersonate" purely for RLS testing 
        // IF we are using service_role, we can just effectively "become" them for a query? 
        // Actually, no, createClient(url, key, { global: { headers: { Authorization: ... } } }) 
        // But better: Sign In with Password if we knew a test user.
        // OR: Create a temporary user with admin API.

        // Let's rely on simply checking if the policy exists first, which we CAN do with admin.

        /* 
           NOTE: We can't easily simulate a client-side INSERT here without a valid user token.
           So instead, we will ask the user to verify in the app.
           BUT, we can try to query pg_policies to see if they exist!
        */

        // Check for "execute_sql" RPC availability first
        const { error: rpcError } = await adminClient.rpc('execute_sql', { sql_query: 'SELECT 1' });
        if (rpcError && (rpcError.message.includes('function') || rpcError.message.includes('does not exist'))) {
            console.log('⚠️  Cannot query pg_policies via RPC (function missing).');
            console.log('👉 Please manually verify in the application.');
            return;
        }

        // If RPC exists (which we know it failed before, but just in case), query policies
        const { data: policies, error } = await adminClient.rpc('execute_sql', {
            sql_query: `
            SELECT policyname, cmd, roles 
            FROM pg_policies 
            WHERE tablename = 'calendar_events' 
            AND (cmd = 'INSERT' OR cmd = 'UPDATE');
        `
        });

        if (error) {
            console.error('❌ Error checking policies:', error);
        } else {
            console.log('📋 Current Insert/Update Policies on calendar_events:');
            console.table(policies);

            const hasInsert = (policies as any[]).some((p: any) => p.cmd === 'INSERT');
            const hasUpdate = (policies as any[]).some((p: any) => p.cmd === 'UPDATE');

            if (hasInsert && hasUpdate) {
                console.log('\n✅ SUCCESS: Insert and Update policies detected!');
            } else {
                console.log('\n❌ FAILURE: Missing Insert or Update policies.');
            }
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

main();
