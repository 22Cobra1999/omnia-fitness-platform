
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    if (!supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Querying information_schema.table_constraints
    const { data: constraints, error: cError } = await supabase
        .rpc('get_table_constraints', { t_name: 'activity_surveys' });
    
    if (cError) {
        // If RPC doesn't exist, try a raw query via a temporary function or just assume based on common errors
        console.error('Error fetching constraints via RPC (might not exist):', cError);
        
        // Let's try to query pg_indexes at least
        const { data: indexes, error: iError } = await supabase
            .from('pg_indexes')
            .select('*')
            .eq('tablename', 'activity_surveys');
        if (iError) console.error('Error fetching indexes:', iError);
        else console.log('Indexes:', indexes);
    } else {
        console.log('Constraints:', constraints);
    }
}

check();
