
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function checkConstraints() {
  const { data: policies, error: pError } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT schemaname, tablename, policyname, definition FROM pg_policies WHERE tablename = 'calendar_events';"
  });
  console.log('Policies:');
  console.log(JSON.stringify(policies, null, 2));

  const { data: constraints, error: cError } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.calendar_events'::regclass AND contype = 'c';"
  });
  console.log('\nConstraints:');
  console.log(JSON.stringify(constraints, null, 2));
}

checkConstraints();
