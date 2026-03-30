import { getSupabaseAdmin } from './lib/config/db';

async function main() {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from('ingredientes_nutricion')
    .select('id, nombre, unidad')
    .order('nombre');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Ingredients Dictionary:', JSON.stringify(data, null, 2));
}

main();
