
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecord() {
    console.log('Running migrations to add borrada and limpieza_completada columns...');
    
    // We try to use a simple query through the client, but standard client doesn't support raw SQL easily.
    // However, if we don't have an RPC for raw SQL, we can't do it this way.
    // I'll check if there's any RPC I can use.
    
    // Alternatively, I'll just check if they exist first.
    const { data: cols, error: colError } = await supabase.from('activities').select('*').limit(1);
    if (colError) {
        console.error('Error fetching activities:', colError);
        return;
    }
    
    const columns = Object.keys(cols[0]);
    console.log('Current columns:', columns);
    
    if (!columns.includes('borrada')) {
        console.log('MISSING: borrada column. You need to run: ALTER TABLE activities ADD COLUMN borrada BOOLEAN DEFAULT FALSE;');
    }
    if (!columns.includes('limpieza_completada')) {
        console.log('MISSING: limpieza_completada column. You need to run: ALTER TABLE activities ADD COLUMN limpieza_completada BOOLEAN DEFAULT FALSE;');
    }
}

checkRecord();
