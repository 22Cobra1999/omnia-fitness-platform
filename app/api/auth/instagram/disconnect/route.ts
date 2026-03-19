import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('coaches')
      .update({
        instagram_access_token: null,
        instagram_user_id: null,
        instagram_expires_at: null,
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al desvincular Instagram:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
