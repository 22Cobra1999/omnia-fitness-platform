import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkNulls() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const {data: nulls, error} = await supabase.from('progreso_diario_actividad').select('id, fecha').is('enrollment_id', null);
    if (error) console.error(error);
    else console.log(`${nulls.length} records with NULL enrollment_id found.`);
}

checkNulls();
