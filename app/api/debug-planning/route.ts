import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/supabase-server';

export async function GET(request: NextRequest) {
    const supabase = await createServiceRoleClient();
    const enrollmentId = '209';
    
    // 1. Enrollment info
    const { data: enrollment } = await supabase
        .from('activity_enrollments')
        .select(`
            *,
            activities (
                id,
                title,
                categoria
            )
        `)
        .eq('id', enrollmentId)
        .single();

    if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' });

    // 2. Planning info
    const { data: plan } = await supabase
        .from('planificacion_ejercicios')
        .select('*')
        .eq('actividad_id', enrollment.activity_id);

    return NextResponse.json({
        enrollment,
        plan
    });
}
