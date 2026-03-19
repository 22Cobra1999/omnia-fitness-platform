
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

async function findUsers() {
  const { data } = await supabase
    .from('user_profiles')
    .select('id, full_name, email')
    .or('full_name.ilike.%Franco%,email.ilike.%hotmail%');
  console.log(JSON.stringify(data, null, 2));
}

findUsers();
