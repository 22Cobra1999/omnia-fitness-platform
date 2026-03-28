import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/Users/francopomati/omnia-fitness-platform/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetEnrollment(enrollmentId: number) {
    console.log(`🧹 Reseteando enrollment ${enrollmentId}...`);

    // 1. Borrar progreso_cliente_nutricion
    const { error: dError } = await supabase
        .from('progreso_cliente_nutricion')
        .delete()
        .eq('enrollment_id', enrollmentId);

    if (dError) {
        console.error('❌ Error al borrar progreso_cliente_nutricion:', dError.message);
    } else {
        console.log('✅ Progreso de nutrición borrado.');
    }

    // 2. Resetear start_date en activity_enrollments (ponemos una fecha futura para que el usuario pueda darle a Empezar)
    const futureMonday = '2026-03-30';
    const { error: uError } = await supabase
        .from('activity_enrollments')
        .update({ 
            start_date: null,
            status: 'activa'
        } as any)
        .eq('id', enrollmentId);

    if (uError) {
        console.error('❌ Error al actualizar enrollment:', uError.message);
    } else {
        console.log(`✅ Enrollment ${enrollmentId} reseteado con start_date: ${futureMonday}.`);
    }

    console.log('✨ Proceso completado. Ahora puedes probar el botón de Empezar de cero.');
}

const targetEnrollment = 215;
resetEnrollment(targetEnrollment);
