
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    if (!supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check references to coaches
    const { data: fks, error } = await supabase.rpc('get_foreign_keys_to_table', { t_name: 'public.coaches' });
    if (error) {
        console.warn('RPC failed, trying raw query via dummy function...');
        // If RPC isn't there, we can't do much without it.
        // Let's assume common ones.
    } else {
        console.log('Foreign keys to coaches:', fks);
    }
    
    // Check columns in coaches
    const { data, error: err } = await supabase.from('coaches').select('*').limit(1);
    if (!err && data?.length) {
        console.log('Current columns in coaches:', Object.keys(data[0]));
    }
}

check();
