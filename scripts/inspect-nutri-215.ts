import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProgress(enrollmentId: number) {
    console.log(`🔍 Inspeccionando progreso para enrollment ${enrollmentId}...`);

    const { data: records, error } = await supabase
        .from('progreso_cliente_nutricion')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('fecha', { ascending: true })
        .limit(1);

    if (error) {
        console.error('❌ Error fetching progress:', error);
        return;
    }

    if (!records || records.length === 0) {
        console.log('⚠️ No se encontraron registros de progreso.');
        return;
    }

    const record = records[0];
    console.log(`📅 Fecha del registro: ${record.fecha}`);
    console.log('📋 Ejercicios Pendientes (IDs):', JSON.stringify(record.ejercicios_pendientes, null, 2));
    console.log('📊 Macros:', JSON.stringify(record.macros, null, 2));
    
    // Check if we can find the plate name in nutrition_program_details
    const pending = record.ejercicios_pendientes;
    let ids: any[] = [];
    if (pending) {
        if (Array.isArray(pending)) {
            ids = pending.map(v => typeof v === 'object' ? (v.id || v.ejercicio_id) : v);
        } else {
             ids = Object.values(pending).map((v: any) => typeof v === 'object' ? (v.id || v.ejercicio_id) : v);
        }
    }
    
    ids = ids.filter(Boolean).map(id => {
         const n = parseInt(String(id).split('_')[0]);
         return isNaN(n) ? null : n;
    }).filter(n => n !== null);

    if (ids.length > 0) {
        const { data: details } = await supabase
            .from('nutrition_program_details')
            .select('id, nombre')
            .in('id', ids);
        console.log('📖 Detalles encontrados en nutrition_program_details:', JSON.stringify(details, null, 2));
    } else {
        console.log('⚠️ No se pudieron extraer IDs válidos de los ejercicios pendientes.');
    }
}

inspectProgress(215);
