import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkIndices() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // We can't query pg_indexes directly easily via RPC without creating the RPC
    // But we can try to trigger the error again and see if we can get more details
    // OR try to insert one by one.
    
    // Actually, I'll try to find out the columns of the table
    const { data: cols1 } = await supabase.from('nutrition_program_details').select('*').limit(1);
    console.log('Columns in nutrition_program_details:', Object.keys(cols1?.[0] || {}));
    
    const { data: cols2 } = await supabase.from('recetas').select('*').limit(1);
    console.log('Columns in recetas:', Object.keys(cols2?.[0] || {}));
}

checkIndices();
