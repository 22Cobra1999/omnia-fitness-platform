import { getSupabaseAdmin } from '@/lib/config/db';

async function inspectTables() {
  const supabase = await getSupabaseAdmin();
  
  console.log('--- INSPECCIONANDO TABLA: banco ---');
  const { data: bancoCols, error: bError } = await supabase.rpc('get_table_columns', { table_name: 'banco' });
  if (bError) {
    // Si la RPC no existe, probamos un SELECT de 1 fila
    const { data: bRow } = await supabase.from('banco').select('*').limit(1);
    console.log('Columnas de banco:', Object.keys(bRow?.[0] || {}));
  } else {
    console.log('Columnas de banco:', bancoCols);
  }

  console.log('--- INSPECCIONANDO TABLA: planes_uso_coach ---');
  const { data: pRow } = await supabase.from('planes_uso_coach').select('*').limit(1);
  console.log('Columnas de planes_uso_coach:', Object.keys(pRow?.[0] || {}));
}

inspectTables();
