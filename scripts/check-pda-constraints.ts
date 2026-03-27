import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkPlanning() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: info, error: err2 } = await supabase.from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'progreso_diario_actividad');
    
    console.log('Constraints:', info || err2);
}

checkPlanning();
