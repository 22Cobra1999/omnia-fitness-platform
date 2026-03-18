import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config/db';
import { GoogleOAuth } from '@/lib/google/oauth';
import { decrypt, encrypt } from '@/lib/utils/encryption';

/**
 * Endpoint para crear automáticamente Google Meet cuando se crea un evento de taller
 * Este endpoint se llama desde un webhook o job queue después de crear un evento
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId es requerido' }, { status: 400 });
    }

    const adminSupabase = await getSupabaseAdmin();

    // Obtener el evento
    const { data: event, error: eventError } = await adminSupabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Solo procesar eventos de tipo 'workshop' que no tienen meet_link
    if (event.event_type !== 'workshop' || event.google_meet_data?.meet_link || event.google_meet_data?.google_event_id) {
      return NextResponse.json({ 
        success: false,
        message: 'Evento no requiere Meet o ya tiene Meet creado'
      });
    }

    // Obtener tokens de Google OAuth
    const { data: tokens, error: tokensError } = await adminSupabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('coach_id', event.coach_id)
      .maybeSingle();

    if (tokensError || !tokens) {
      return NextResponse.json({ 
        success: false,
        message: 'Google Calendar no está conectado para este coach',
        connected: false
      });
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
        await adminSupabase
          .from('google_oauth_tokens')
          .update({
            access_token: encrypt(newTokens.access_token),
            expires_at: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('coach_id', event.coach_id);
      } catch (refreshError) {
        console.error('Error refrescando token:', refreshError);
        return NextResponse.json({ 
          success: false,
          message: 'Error al refrescar token de Google',
          connected: false
        }, { status: 401 });
      }
    }

    // Verificar si ya existe un evento en Google Calendar para evitar duplicados
    if (event.google_event_id) {
      try {
        const existingEvent = await GoogleOAuth.getCalendarEvent(accessToken, event.google_event_id);
        if (existingEvent) {
          const meetLink = GoogleOAuth.extractMeetLink(existingEvent);
          if (meetLink) {
            const updatedGoogleMeetData = {
              ...(event.google_meet_data || {}),
              meet_link: meetLink,
              google_event_id: event.google_meet_data?.google_event_id || existingEvent.id
            };

            await adminSupabase
              .from('calendar_events')
              .update({
                google_meet_data: updatedGoogleMeetData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', eventId);
            
            return NextResponse.json({
              success: true,
              meetLink,
              googleEventId: event.google_event_id,
              message: 'Meet link extraído de evento existente'
            });
          }
        }
      } catch (error) {
        // Si no existe o hay error, continuar con la creación
        console.log('Evento no existe en Google Calendar o error al obtenerlo, creando nuevo...');
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
      console.error('❌ [API auto-create-meet] El evento se creó en Google pero falló la generación del meetLink. Data devuelta por Google:', {
        id: googleEvent.id,
        status: googleEvent.status,
        conferenceData: googleEvent.conferenceData
      });
      return NextResponse.json({ 
        success: false,
        error: 'No se pudo crear el link de Google Meet. El evento se creó pero sin videoconferencia.',
        googleEventId: googleEvent.id
      }, { status: 500 });
    }

    // Actualizar el evento en calendar_events con el meet_link real
    const updatedGoogleMeetDataFinal = {
      ...(event.google_meet_data || {}),
      meet_link: meetLink,
      google_event_id: googleEvent.id
    };

    const { error: updateError } = await adminSupabase
      .from('calendar_events')
      .update({
        google_meet_data: updatedGoogleMeetDataFinal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error actualizando evento:', updateError);
      return NextResponse.json({ 
        success: false,
        error: 'Error al actualizar evento con meet_link',
        meetLink,
        googleEventId: googleEvent.id
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meetLink,
      googleEventId: googleEvent.id,
      message: 'Google Meet creado automáticamente'
    });

  } catch (error: any) {
    console.error('Error creando Meet automáticamente:', error);

    // Detectar específicamente errores de desencriptación (clave incorrecta)
    if (error.message?.includes('encriptado con una clave diferente') || 
        error.message?.includes('Unsupported state')) {
      return NextResponse.json({
        success: false,
        error: 'Reconexión de Google requerida',
        details: 'Los tokens actuales no se pueden validar. Debes reconectar tu cuenta de Google en tu perfil.',
        reconnect_required: true
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

