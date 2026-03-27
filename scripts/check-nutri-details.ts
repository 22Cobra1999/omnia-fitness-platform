import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
    const ids = [753, 758, 759, 760, 761, 764, 765];
    console.log(`🔍 Buscando detalles para IDs: ${ids.join(', ')}`);

    const { data, error } = await supabase
        .from('nutrition_program_details')
        .select('id, nombre, calorias, proteinas, carbohidratos, grasas')
        .in('id', ids);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log('📋 Resultados:');
    console.table(data);
}

checkDetails();
