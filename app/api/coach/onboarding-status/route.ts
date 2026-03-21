import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { getSupabaseAdmin } from '@/lib/config/db';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = session.user.id;
        const adminSupabase = await getSupabaseAdmin();

        // 1. Verificar Perfil
        const { data: coach } = await adminSupabase
            .from('coaches')
            .select('bio, avatar_url, specialization')
            .eq('id', userId)
            .maybeSingle();
        
        const { data: userProfile } = await adminSupabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('id', userId)
            .maybeSingle();

        const hasAvatar = !!(coach?.avatar_url || userProfile?.avatar_url);
        const hasBio = coach?.bio && !coach.bio.includes("Trainer entusiasta en OMNIA");
        const hasSpecialization = !!coach?.specialization && coach.specialization !== 'General Fitness';
        
        const needsProfile = !hasAvatar || (!hasBio && !hasSpecialization);

        // 2. Verificar Mercado Pago
        const { data: mp } = await adminSupabase
            .from('coach_mercadopago_credentials')
            .select('oauth_authorized')
            .eq('coach_id', userId)
            .maybeSingle();
        
        const needsMP = !mp?.oauth_authorized;

        console.log(`📊 [Onboarding API] Status for ${userId}:`, { needsProfile, needsMP });

        return NextResponse.json({
            needsProfile,
            needsMP,
            success: true
        });

    } catch (error: any) {
        console.error("❌ [Onboarding API] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
