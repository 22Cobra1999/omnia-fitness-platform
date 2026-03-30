import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

async function checkApril26() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Checking for activities on 2026-04-26 for client 00dedc23...');
    const { data: fitness, error: errF } = await supabase
        .from('progreso_cliente')
        .select('*')
        .eq('cliente_id', '00dedc23-0b17-4e50-b84e-b2e8100dc93c')
        .eq('fecha', '2026-04-26');

    if (errF) console.error(errF);
    else {
        console.log('FITNESS ROWS:', fitness.length);
        fitness.forEach(r => {
            console.log(`  Row ${r.id}: Act ${r.actividad_id}, Items count: ${Object.keys(r.minutos || {}).length}`);
            console.log('  Minutos keys:', Object.keys(r.minutos || {}));
        });
    }
}

checkApril26();
