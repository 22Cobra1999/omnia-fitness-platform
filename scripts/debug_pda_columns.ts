import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

async function debugColumns() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Checking columns in progreso_diario_actividad...');
    
    // Intentar seleccionar una de las nuevas columnas
    const { data, error } = await supabase
        .from('progreso_diario_actividad')
        .select('fit_items_c')
        .limit(1);
    
    if (error) {
        console.error('❌ Error detectado:', error.code, error.message);
        if (error.code === '42703') {
            console.log('CONCLUISON: Las columnas nuevas NO existen en la base de datos.');
        }
    } else {
        console.log('✅ Éxito: La columna fit_items_c EXISTE.');
        console.log('Data sample:', data);
    }
}

debugColumns();
