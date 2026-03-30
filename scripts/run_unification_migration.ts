import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

async function runRestore() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const sqlPath = path.join('/Users/francopomati/omnia-fitness-platform/supabase/migrations/20260330_restore_pda_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying restore script...');
    const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: sql,
        params: {} 
    });
    
    if (error) {
        console.error('Error applying restore:', error);
    } else {
        console.log('Restore successful!', data);
    }
}

runRestore();
