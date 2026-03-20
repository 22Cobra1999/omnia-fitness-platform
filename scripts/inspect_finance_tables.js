const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- INSPECCIONANDO: banco ---');
  const { data: bData, error: bErr } = await supabase.from('banco').select('*').limit(1);
  if (bErr) console.error(bErr);
  else console.log('Columnas banco:', Object.keys(bData?.[0] || {}));

  console.log('--- INSPECCIONANDO: planes_uso_coach ---');
  const { data: pData, error: pErr } = await supabase.from('planes_uso_coach').select('*').limit(1);
  if (pErr) console.error(pErr);
  else console.log('Columnas planes_uso_coach:', Object.keys(pData?.[0] || {}));
}

inspect();
