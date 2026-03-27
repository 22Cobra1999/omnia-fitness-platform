import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkPlanning() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get activity 122 or similar
    const { data: plans, error } = await supabase
        .from('planificacion_platos')
        .select('*');

    if (error) {
        console.error('Error fetching plans:', error);
        return;
    }

    console.log(`Found ${plans.length} planificacion_platos records.`);
    if (plans.length > 0) {
        console.log('Sample plan:', JSON.stringify(plans[0], null, 2));
    }

    const { data: acts, error: err2 } = await supabase.from('activities').select('id, title, categoria').eq('categoria', 'nutricion');
    console.log('Nutrition activities:', acts);
}

checkPlanning();
