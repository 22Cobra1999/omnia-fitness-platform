import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para desconectar Google Calendar
 * Elimina los tokens de OAuth del coach
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const coachId = session.user.id;

    // Eliminar tokens de Google OAuth
    const { error: deleteError } = await supabase
      .from('google_oauth_tokens')
      .delete()
      .eq('coach_id', coachId);

    if (deleteError) {
      console.error('Error eliminando tokens:', deleteError);
      return NextResponse.json({ 
        error: 'Error al desvincular Google Calendar',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('✅ Google Calendar desconectado para coach:', coachId);

    return NextResponse.json({ 
      success: true,
      message: 'Google Calendar desconectado correctamente'
    });

  } catch (error: any) {
    console.error('Error en disconnect:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}





