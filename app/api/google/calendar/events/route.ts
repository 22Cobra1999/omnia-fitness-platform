import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { GoogleOAuth } from '@/lib/google/oauth';
import { decrypt } from '@/lib/utils/encryption';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Endpoint para obtener eventos de Google Calendar del coach
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Formato: YYYY-MM
    const year = searchParams.get('year'); // Año
    const monthNum = searchParams.get('monthNum'); // Número de mes (0-11)

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const coachId = session.user.id;

    // Obtener tokens de Google OAuth
    const { data: tokens, error: tokensError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('coach_id', coachId)
      .maybeSingle();

    if (tokensError || !tokens) {
      return NextResponse.json({ 
        success: false,
        error: 'Google Calendar no está conectado',
        connected: false
      });
    }

    // Verificar si el token está expirado y refrescarlo si es necesario
    let accessToken = decrypt(tokens.access_token);
    const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;

    if (expiresAt && GoogleOAuth.isTokenExpired(expiresAt) && tokens.refresh_token) {
      try {
        const refreshToken = decrypt(tokens.refresh_token);
        const newTokenData = await GoogleOAuth.refreshAccessToken(refreshToken);
        
        // Actualizar tokens en la base de datos
        const { encrypt } = await import('@/lib/utils/encryption');
        const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString();
        
        await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: encrypt(newTokenData.access_token),
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('coach_id', coachId);

        accessToken = newTokenData.access_token;
        console.log('✅ Token de Google Calendar refrescado');
      } catch (refreshError) {
        console.error('Error refrescando token:', refreshError);
        return NextResponse.json({ 
          success: false,
          error: 'Error al refrescar el token de Google Calendar',
          connected: true,
          needsReconnect: true
        });
      }
    }

    // Calcular rango de fechas para el mes solicitado
    let startDate: Date;
    let endDate: Date;

    if (monthNum !== null && year !== null) {
      // Si se proporciona monthNum y year, usar esos
      const monthIndex = parseInt(monthNum);
      const yearNum = parseInt(year);
      startDate = startOfMonth(new Date(yearNum, monthIndex, 1));
      endDate = endOfMonth(new Date(yearNum, monthIndex, 1));
    } else if (month) {
      // Si se proporciona month en formato YYYY-MM
      const [yearStr, monthStr] = month.split('-');
      startDate = startOfMonth(new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1));
      endDate = endOfMonth(new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1));
    } else {
      // Por defecto, usar el mes actual
      const now = new Date();
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Obtener eventos de Google Calendar
    try {
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();

      const calendarData = await GoogleOAuth.listCalendarEvents(
        accessToken,
        timeMin,
        timeMax,
        250
      );

      // Transformar eventos de Google Calendar al formato de Omnia
      const formattedEvents = (calendarData.items || []).map((event: any) => {
        // Manejar tanto dateTime como date (eventos de todo el día)
        // Si es evento de todo el día, usar date y agregar hora 00:00
        let startTime: string;
        let endTime: string;
        
        if (event.start.dateTime) {
          // Evento con hora específica
          startTime = event.start.dateTime;
          endTime = event.end.dateTime || event.end.date;
        } else if (event.start.date) {
          // Evento de todo el día
          startTime = `${event.start.date}T00:00:00`;
          endTime = `${event.end.date}T23:59:59`;
        } else {
          // Fallback
          startTime = new Date().toISOString();
          endTime = new Date().toISOString();
        }
        
        return {
          id: `google_${event.id}`, // Prefijo para identificar que viene de Google
          title: event.summary || 'Sin título',
          description: event.description || '',
          start_time: startTime,
          end_time: endTime,
          event_type: 'other' as const, // Tipo genérico para eventos de Google
          status: 'scheduled' as const,
          google_event_id: event.id,
          source: 'google_calendar',
          // Extraer Meet link si existe
          meet_link: GoogleOAuth.extractMeetLink(event) || null,
          // Otros campos opcionales
          attendees: event.attendees || [],
          location: event.location || null,
          is_google_event: true, // Flag para identificar eventos de Google
        };
      });

      console.log(`✅ Eventos de Google Calendar obtenidos: ${formattedEvents.length} eventos`);

      return NextResponse.json({
        success: true,
        events: formattedEvents,
        connected: true,
        count: formattedEvents.length
      });

    } catch (calendarError: any) {
      console.error('Error obteniendo eventos de Google Calendar:', calendarError);
      return NextResponse.json({
        success: false,
        error: calendarError.message || 'Error al obtener eventos de Google Calendar',
        connected: true,
        events: []
      });
    }

  } catch (error: any) {
    console.error('Error en GET /api/google/calendar/events:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
      connected: false
    }, { status: 500 });
  }
}

