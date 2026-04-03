
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    if (!supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from('activity_enrollments')
        .select('*')
        .eq('id', 209)
        .single();
    
    if (error) {
        console.error('Error fetching enrollment 209:', error);
    } else {
        console.log('Enrollment 209:', data);
    }
}

check();
