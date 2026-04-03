
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    if (!supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Checking for new tables...');
    const { data: config, error: err1 } = await supabase.from('coach_meets_config').select('*').limit(1);
    const { data: social, error: err2 } = await supabase.from('coach_social_accounts').select('*').limit(1);
    const { data: contact, error: err3 } = await supabase.from('coach_contact_info').select('*').limit(1);

    console.log('coach_meets_config exists:', !err1);
    console.log('coach_social_accounts exists:', !err2);
    console.log('coach_contact_info exists:', !err3);
}

check();
