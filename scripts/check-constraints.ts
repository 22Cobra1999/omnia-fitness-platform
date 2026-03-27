import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkSchema() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query constraints
    const { data: constraints, error } = await supabase
        .rpc('get_constraints', { t_name: 'progreso_cliente_nutricion' });

    if (error) {
        // If RPC doesn't exist, try direct SQL via another way or just query information_schema
        const { data: info, error: err2 } = await supabase.from('information_schema.table_constraints')
            .select('*')
            .eq('table_name', 'progreso_cliente_nutricion');
        
        console.log('Constraints (Direct):', info || err2);
    } else {
        console.log('Constraints (RPC):', constraints);
    }
}

checkSchema();
