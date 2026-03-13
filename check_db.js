
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecord() {
    const { data: policies, error: polError } = await supabase
        .rpc('get_policies', { table_name: 'progreso_cliente' }); 
    // Wait, rpc might not exist. I'll use a direct query to pg_policies if I can, but standard Supabase client can't do that.
    // I'll try to query information_schema.role_table_grants or similar, but better, I'll just check if I can update with ANON_KEY vs SERVICE_ROLE_KEY.
    
    console.log('Testing update with SERVICE_ROLE_KEY for record 507...');
    const { data: upd, error: uErr } = await supabase
        .from('progreso_cliente')
        .update({ peso: { "1230_3_3": 99 } })
        .eq('id', 507)
        .select();
    
    console.log('Update result (Service Role):', { upd, uErr });

    if (progs.length > 0) {
        const cId = progs[0].cliente_id;
        const { data: prof } = await supabase.from('user_profiles').select('full_name').eq('id', cId).single();
        console.log(`First record belongs to: ${prof?.full_name} (${cId})`);
    } else {
        console.log('NO records found for activity 78 in progreso_cliente.');
    }
}

checkRecord();
