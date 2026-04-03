
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    if (!supabaseKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from('activity_surveys')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error fetching survey:', error);
    } else {
        console.log('Columns in activity_surveys:', Object.keys(data?.[0] || {}));
        console.log('Sample data:', data?.[0]);
    }
}

check();
