import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkIndices() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // We can't query pg_indexes directly easily via RPC without creating the RPC
    // But we can try to trigger the error again and see if we can get more details
    // OR try to insert one by one.
    
    // Actually, I'll try to find out the columns of the table
    const { data: cols, error } = await supabase.from('progreso_cliente_nutricion').select('*').limit(0);
    console.log('Columns:', Object.keys(cols?.[0] || {}));
}

checkIndices();
