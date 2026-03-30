import { getSupabaseAdmin } from './lib/config/db';

async function main() {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from('nutrition_program_details')
    .select('id, nombre, minutos')
    .ilike('nombre', '%Wrap de Pollo%');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Result:', JSON.stringify(data, null, 2));
}

main();
