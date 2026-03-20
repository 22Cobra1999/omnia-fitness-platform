import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config/db';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

export async function GET() {
  try {
    // Usar el helper oficial del proyecto que ya maneja cookies asíncronas perfectamente
    const supabase = await createRouteHandlerClient();
    
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'No authenticated' }, { status: 401 });

    // 1. Verificar Nivel Admin en DB
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || session.user.email === 'cuchilloscutoff@gmail.com';

    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 2. Si es Admin, usar Service Role para traer TODO
    const adminClient = await getSupabaseAdmin();

    const [ {data: banco}, {data: plans}, {data: profiles}, {data: activities}, {data: credentials} ] = await Promise.all([
      adminClient.from('banco').select('*').order('created_at', { ascending: false }),
      adminClient.from('planes_uso_coach').select('*').order('started_at', { ascending: false }),
      adminClient.from('user_profiles').select('id, full_name, email'),
      adminClient.from('activities').select('id, title, type'),
      adminClient.from('coach_mercadopago_credentials').select('coach_id, mercadopago_user_id')
    ]);

    return NextResponse.json({
      banco,
      plans,
      profiles,
      activities,
      credentials
    });

  } catch (error: any) {
    console.error('❌ [AdminFinanceAPI] Error crítico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
