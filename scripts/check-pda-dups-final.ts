import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkDuplicates() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get as many as we can
    const {data: all, error} = await supabase.from('progreso_diario_actividad').select('id, enrollment_id, fecha').limit(2000);
    
    if (error) {
        console.error(error);
        return;
    }

    const seen = new Map<string, any[]>();
    const dupKeys: string[] = [];
    
    all?.forEach(r => {
        const k = `${r.enrollment_id}_${r.fecha}`;
        if (seen.has(k)) {
            if (seen.get(k)!.length === 1) dupKeys.push(k);
            seen.get(k)!.push(r.id);
        } else {
            seen.set(k, [r.id]);
        }
    });
    
    console.log(`Checked ${all?.length || 0} records.`);
    console.log(`Found ${dupKeys.length} duplicate (enrollment_id, fecha) pairs.`);
    
    if (dupKeys.length > 0) {
        console.log('Sample duplicate details:', dupKeys.slice(0, 3).map(k => ({ key: k, ids: seen.get(k) })));
    }
}

checkDuplicates();
