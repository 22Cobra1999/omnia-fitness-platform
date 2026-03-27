import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixConstraints() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const sql = `
        ALTER TABLE public.progreso_diario_actividad 
        DROP CONSTRAINT IF EXISTS progreso_diario_actividad_enrollment_fecha_key;
        
        ALTER TABLE public.progreso_diario_actividad 
        ADD CONSTRAINT progreso_diario_actividad_enrollment_fecha_key UNIQUE (enrollment_id, fecha);
    `;
    
    const { error } = await supabase.rpc('run_sql', { sql });
    console.log('Result:', error || 'Success');
}

fixConstraints();
