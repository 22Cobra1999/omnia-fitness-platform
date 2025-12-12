import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { GoogleOAuth } from '@/lib/google/oauth';
import { decrypt } from '@/lib/utils/encryption';
import { getSupabaseAdmin } from '@/lib/config/db';

/**
 * Endpoint para crear un evento en Google Calendar con Meet link
 * y actualizar el evento en calendar_events con el meet_link real
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const coachId = session.user.id;

    // Obtener el evento de calendar_events
    const adminSupabase = await getSupabaseAdmin();
    const { data: event, error: eventError } = await adminSupabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('coach_id', coachId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Obtener tokens de Google OAuth
    const { data: tokens, error: tokensError } = await adminSupabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('coach_id', coachId)
      .maybeSingle();

    if (tokensError || !tokens) {
      return NextResponse.json({ 
        error: 'Google Calendar no está conectado',
        connected: false
      }, { status: 400 });
    }

    // Verificar si el token está expirado y refrescarlo si es necesario
    let accessToken = decrypt(tokens.access_token);
    const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;

    if (expiresAt && GoogleOAuth.isTokenExpired(expiresAt) && tokens.refresh_token) {
      try {
        const refreshToken = decrypt(tokens.refresh_token);
        const newTokens = await GoogleOAuth.refreshAccessToken(refreshToken);
        accessToken = newTokens.access_token;

        // Actualizar tokens en la base de datos
        const { encrypt } = await import('@/lib/utils/encryption');
        await adminSupabase
          .from('google_oauth_tokens')
          .update({
            access_token: encrypt(newTokens.access_token),
            expires_at: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('coach_id', coachId);
      } catch (refreshError) {
        console.error('Error refrescando token:', refreshError);
        return NextResponse.json({ 
          error: 'Error al refrescar token de Google',
          connected: false
        }, { status: 401 });
      }
    }

    // Crear evento en Google Calendar con Meet
    const googleEvent = await GoogleOAuth.createCalendarEvent(accessToken, {
      summary: event.title,
      description: event.description || '',
      start: {
        dateTime: new Date(event.start_time).toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: new Date(event.end_time).toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
    });

    // Extraer meet_link del evento creado
    const meetLink = GoogleOAuth.extractMeetLink(googleEvent);

    if (!meetLink) {
      return NextResponse.json({ 
        error: 'No se pudo crear el link de Google Meet',
        googleEventId: googleEvent.id
      }, { status: 500 });
    }

    // Actualizar el evento en calendar_events con el meet_link real
    const { error: updateError } = await adminSupabase
      .from('calendar_events')
      .update({
        meet_link: meetLink,
        google_event_id: googleEvent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error actualizando evento:', updateError);
      return NextResponse.json({ 
        error: 'Error al actualizar evento con meet_link',
        meetLink,
        googleEventId: googleEvent.id
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meetLink,
      googleEventId: googleEvent.id,
    });

  } catch (error: any) {
    console.error('Error creando Meet link:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

