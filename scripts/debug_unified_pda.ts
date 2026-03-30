import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

async function checkUnifiedData() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    
    console.log(`Checking unified data for client ${clientId}...`);
    
    const { data, error } = await supabase
        .from('progreso_diario_actividad')
        .select('*')
        .eq('cliente_id', clientId)
        .order('fecha', { ascending: false });

    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log(`Found ${data.length} rows.`);
        data.slice(0, 5).forEach(r => {
            console.log(`Date: ${r.fecha}`);
            console.log(`  Fitness Items: ${JSON.stringify(r.fitness_items)}`);
            console.log(`  Nutri Items: ${JSON.stringify(r.nutricion_items)}`);
            console.log(`  Nutri Kcal: ${JSON.stringify(r.nutricion_calorias)}`);
        });
        
        const mar30 = data.find(r => r.fecha === '2026-03-30');
        if (mar30) {
            console.log('\n--- MARCH 30 ---');
            console.log(JSON.stringify(mar30, null, 2));
        } else {
            console.log('\n--- MARCH 30 NOT FOUND ---');
        }
    }
}

checkUnifiedData();
