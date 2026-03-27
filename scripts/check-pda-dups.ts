import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkDuplicates() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: dups, error } = await supabase
        .from('progreso_diario_actividad')
        .select('enrollment_id, fecha, count: id.count()')
        .group('enrollment_id, fecha')
        .having('count > 1')
        .limit(10);

    if (error) {
        // Fallback: manual query because group/having might not be supported well in JS SDK
        const {data: all} = await supabase.from('progreso_diario_actividad').select('enrollment_id, fecha').limit(1000);
        const seen = new Set();
        const duplicates = [];
        all?.forEach(r => {
            const k = `${r.enrollment_id}_${r.fecha}`;
            if (seen.has(k)) duplicates.push(k);
            else seen.add(k);
        });
        console.log('Duplicates found (manual check):', duplicates);
        return;
    }

    console.log('Duplicates found:', dups);
}

checkDuplicates();
