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
      console.error('❌ [GET /api/google/calendar/events] Error de sesión:', sessionError);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const coachId = session.user.id;

    // Obtener tokens de Google OAuth
    const { data: tokens, error: tokensError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('coach_id', coachId)
      .maybeSingle();

    if (tokensError) {
      console.error('❌ [GET /api/google/calendar/events] Error obteniendo tokens:', tokensError);
      return NextResponse.json({ 
        success: false,
        error: 'Error al obtener tokens de Google Calendar',
        connected: false
      }, { status: 200 }); // 200 porque no es un error del servidor, simplemente no está conectado
    }

    if (!tokens) {
      return NextResponse.json({ 
        success: false,
        error: 'Google Calendar no está conectado',
        connected: false
      }, { status: 200 }); // 200 porque no es un error del servidor
    }

    // Verificar si el token está expirado y refrescarlo si es necesario
    let accessToken: string;
    try {
      accessToken = decrypt(tokens.access_token);
    } catch (decryptError: any) {
      console.error('❌ [GET /api/google/calendar/events] Error desencriptando token:', decryptError);
      return NextResponse.json({ 
        success: false,
        error: 'Error al procesar tokens de Google Calendar. Por favor, reconecta tu cuenta.',
        connected: false,
        needsReconnect: true
      }, { status: 200 });
    }

    const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;

    if (expiresAt && GoogleOAuth.isTokenExpired(expiresAt) && tokens.refresh_token) {
      try {
        console.log('🔄 [GET /api/google/calendar/events] Token expirado, refrescando...');
        let refreshToken: string;
        try {
          refreshToken = decrypt(tokens.refresh_token);
        } catch (decryptRefreshError: any) {
          console.error('❌ [GET /api/google/calendar/events] Error desencriptando refresh token:', decryptRefreshError);
          return NextResponse.json({ 
            success: false,
            error: 'Error al procesar tokens de Google Calendar. Por favor, reconecta tu cuenta.',
            connected: false,
            needsReconnect: true
          }, { status: 200 });
        }

        const newTokenData = await GoogleOAuth.refreshAccessToken(refreshToken);
        
        // Actualizar tokens en la base de datos
        const { encrypt } = await import('@/lib/utils/encryption');
        const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString();
        
        const { error: updateError } = await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: encrypt(newTokenData.access_token),
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('coach_id', coachId);

        if (updateError) {
          console.error('⚠️ [GET /api/google/calendar/events] Error actualizando tokens en BD:', updateError);
          // Continuar con el nuevo token aunque no se haya guardado
        }

        accessToken = newTokenData.access_token;
        console.log('✅ [GET /api/google/calendar/events] Token de Google Calendar refrescado');
      } catch (refreshError: any) {
        console.error('❌ [GET /api/google/calendar/events] Error refrescando token:', {
          message: refreshError.message,
          stack: refreshError.stack,
          name: refreshError.name,
          response: refreshError.response ? await refreshError.response.text().catch(() => 'No response body') : 'No response'
        });
        
        // Si el refresh token es inválido o revocado, necesita reconexión
        const needsReconnect = refreshError.message?.includes('invalid_grant') || 
                               refreshError.message?.includes('invalid_token') ||
                               refreshError.message?.includes('Token refresh failed');
        
        return NextResponse.json({ 
          success: false,
          error: refreshError.message || 'Error al refrescar el token de Google Calendar. Por favor, reconecta tu cuenta.',
          connected: false,
          needsReconnect: true,
          events: []
        }, { status: 200 }); // 200 porque es un error esperado
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

      console.log(`📅 [GET /api/google/calendar/events] Obteniendo eventos desde ${timeMin} hasta ${timeMax}`);

      const calendarData = await GoogleOAuth.listCalendarEvents(
        accessToken,
        timeMin,
        timeMax,
        250
      );

      // Obtener google_meet_data de eventos que ya están en Omnia para evitar duplicados
      const { data: existingEvents, error: existingEventsError } = await supabase
        .from('calendar_events')
        .select('google_meet_data')
        .eq('coach_id', coachId)
        .gte('start_time', timeMin)
        .lte('start_time', timeMax);

      if (existingEventsError) {
        console.error('⚠️ [GET /api/google/calendar/events] Error obteniendo eventos existentes:', existingEventsError);
        // Continuar sin filtrar duplicados si hay error
      }

      const existingGoogleEventIds = new Set(
        (existingEvents || [])
          .map((e: any) => e.google_meet_data?.google_event_id)
          .filter(Boolean)
      );

      // Transformar eventos de Google Calendar al formato de Omnia
      // FILTRAR eventos que ya están en Omnia para evitar duplicados
      const formattedEvents = (calendarData.items || [])
        .filter((event: any) => {
          // Excluir eventos que ya están en Omnia
          return !existingGoogleEventIds.has(event.id);
        })
        .map((event: any) => {
        // Manejar tanto dateTime como date (eventos de todo el día)
        // Si es evento de todo el día, usar date y agregar hora 00:00
        let startTime: string;
        let endTime: string;
        
        if (event.start?.dateTime) {
          // Evento con hora específica
          startTime = event.start.dateTime;
          endTime = event.end?.dateTime || event.end?.date || startTime;
        } else if (event.start?.date) {
          // Evento de todo el día
          startTime = `${event.start.date}T00:00:00`;
          endTime = `${event.end?.date || event.start.date}T23:59:59`;
        } else {
          // Fallback
          console.warn('⚠️ [GET /api/google/calendar/events] Evento sin fecha válida:', event.id);
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

      console.log(`✅ [GET /api/google/calendar/events] Eventos obtenidos: ${formattedEvents.length} eventos`);

      return NextResponse.json({
        success: true,
        events: formattedEvents,
        connected: true,
        count: formattedEvents.length
      });

    } catch (calendarError: any) {
      console.error('❌ [GET /api/google/calendar/events] Error obteniendo eventos de Google Calendar:', {
        message: calendarError.message,
        stack: calendarError.stack,
        name: calendarError.name
      });
      
      // Si el error es de autenticación, indicar que necesita reconectar
      const needsReconnect = calendarError.message?.includes('401') || 
                             calendarError.message?.includes('Unauthorized') ||
                             calendarError.message?.includes('invalid_token') ||
                             calendarError.message?.includes('expired');
      
      return NextResponse.json({
        success: false,
        error: calendarError.message || 'Error al obtener eventos de Google Calendar',
        connected: true,
        needsReconnect,
        events: []
      }, { status: 200 }); // 200 porque el error es esperado (token expirado, etc.)
    }

  } catch (error: any) {
    console.error('❌ [GET /api/google/calendar/events] Error inesperado:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Solo devolver 500 para errores realmente inesperados del servidor
    // La mayoría de errores esperados ya se manejan arriba
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
      connected: false
    }, { status: 500 });
  }
}

