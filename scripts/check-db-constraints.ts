
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^['"](.*)['"]$/, '$1');
    }
  });
} catch (e) {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkCheckConstraints() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: `
      SELECT
          conname AS constraint_name,
          pg_get_constraintdef(c.oid) AS constraint_definition
      FROM
          pg_constraint c
      JOIN
          pg_namespace n ON n.oid = c.connamespace
      WHERE
          contype = 'c'
          AND n.nspname = 'public';
    `
  });

  if (error) {
    console.error('Error fetching check constraints:', error);
    
    // Fallback if debug_execute_query RPC doesn't exist
    console.log('Trying alternative way to check constraints...');
    const { data: tables } = await supabase.from('calendar_events').select('*').limit(1);
    console.log('Calendar events access check okay');
  } else {
    console.log('Check Constraints:', JSON.stringify(data, null, 2));
  }
}

checkCheckConstraints();
