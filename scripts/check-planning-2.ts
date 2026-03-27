import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkPlanning() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: plans, error } = await supabase
        .from('planificacion_ejercicios')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching plans:', error);
        return;
    }

    console.log(`Found ${plans.length} planificacion_ejercicios records.`);
    if (plans.length > 0) {
        console.log('Sample plan activity_id:', plans[0].actividad_id);
    }

    const { data: acts, error: err2 } = await supabase.from('activities').select('id, title, categoria').eq('categoria', 'nutricion');
    console.log('Nutrition activities:', acts);

    // Check plan for first nutrition activity
    if (acts && acts.length > 0) {
        const {data: p} = await supabase.from('planificacion_ejercicios').select('*').eq('actividad_id', acts[0].id);
        console.log(`Plan for ${acts[0].title} (ID ${acts[0].id}):`, p?.length || 0, 'records');
    }
}

checkPlanning();
