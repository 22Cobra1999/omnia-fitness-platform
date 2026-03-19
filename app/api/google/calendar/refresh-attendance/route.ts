import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { GoogleOAuth } from '@/lib/google/oauth';
import { GoogleMeet } from '@/lib/google/meet';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint para refrescar la asistencia de una Meet específica desde Google Meet API
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

    // 1. Obtener el evento y su meet_link
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('id, google_meet_data, end_time, coach_id')
      .eq('id', eventId)
      .eq('coach_id', coachId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const meetLink = event.google_meet_data?.meet_link;
    if (!meetLink) {
      return NextResponse.json({ error: 'El evento no tiene un link de Google Meet asociado' }, { status: 400 });
    }

    // 2. Obtener tokens de Google OAuth
    const { data: tokens, error: tokensError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('coach_id', coachId)
      .maybeSingle();

    if (tokensError || !tokens) {
      return NextResponse.json({ error: 'Google Calendar no está conectado' }, { status: 400 });
    }

    // 3. Verificar y refrescar token si es necesario
    let accessToken: string;
    try {
      accessToken = decrypt(tokens.access_token);
      const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;

      if (expiresAt && GoogleOAuth.isTokenExpired(expiresAt)) {
        const refreshToken = decrypt(tokens.refresh_token);
        const refreshed = await GoogleOAuth.refreshAccessToken(refreshToken);
        
        const { encrypt } = await import('@/lib/utils/encryption');
        await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: encrypt(refreshed.access_token),
            expires_at: new Date(Date.now() + (refreshed.expires_in * 1000)).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('coach_id', coachId);
        
        accessToken = refreshed.access_token;
      }
    } catch (err: any) {
      console.error('Error procesando tokens:', err);
      return NextResponse.json({ error: 'Error de autenticación con Google. Por favor, reconecta tu cuenta.' }, { status: 401 });
    }

    // 4. Obtener participantes de Omnia para este evento
    const { data: participantsRaw, error: participantsError } = await supabase
      .from('calendar_event_participants')
      .select('id, user_id, rsvp_status, attendance_status, attendance_minutes')
      .eq('event_id', eventId);

    if (participantsError || !participantsRaw) {
      console.error('Error obteniendo participantes:', participantsError);
      return NextResponse.json({ error: 'Error obteniendo participantes del evento' }, { status: 500 });
    }

    // Obtener perfiles de los participantes para tener email y nombre
    const userIds = participantsRaw.map((p: any) => p.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const omniaParticipants = participantsRaw.map((p: any) => ({
      ...p,
      user_profiles: profiles?.find((prof: any) => prof.id === p.user_id)
    }));

    // 5. Sincronización Proactiva de Invitados a Google Calendar
    // Esto asegura que el "Rosetta Stone" (bridge) funcione incluso si el coach no los agregó a Google.
    const googleEventId = event.google_meet_data?.google_event_id;
    let googleAttendeeMap = new Map<string, string>(); // displayName -> email

    if (googleEventId && omniaParticipants && omniaParticipants.length > 0) {
      try {
        let fullGoogleEvent = await GoogleOAuth.getCalendarEvent(accessToken, googleEventId);
        
        // Identificar quiénes faltan en Google
        const currentGoogleEmails = new Set(fullGoogleEvent.attendees?.map(a => a.email.toLowerCase()) || []);
        const missingAttendees = omniaParticipants
          .filter((p: any) => p.user_profiles?.email && !currentGoogleEmails.has(p.user_profiles.email.toLowerCase()))
          .map((p: any) => ({
            email: p.user_profiles!.email,
            displayName: p.user_profiles!.full_name || undefined
          }));

        if (missingAttendees.length > 0) {
          console.log(`📡 Sincronizando ${missingAttendees.length} invitados faltantes a Google Calendar...`);
          const updatedAttendees = [
            ...(fullGoogleEvent.attendees || []),
            ...missingAttendees
          ];
          
          fullGoogleEvent = await GoogleOAuth.updateCalendarEvent(accessToken, googleEventId, {
            ...fullGoogleEvent,
            attendees: updatedAttendees
          });
          console.log('✅ Invitados sincronizados exitosamente.');
        }

        // Construir el mapa de bridge (Nombre en Google -> Email)
        fullGoogleEvent.attendees?.forEach(att => {
          if (att.email && att.displayName) {
            googleAttendeeMap.set(att.displayName.toLowerCase(), att.email.toLowerCase());
          }
        });
      } catch (err) {
        console.warn('⚠️ Error en sincronización proactiva o bridge:', err);
      }
    }

    // 6. Obtener estadísticas de asistencia
    const attendanceStats = await GoogleMeet.getAttendanceStats(accessToken, meetLink);

    if (attendanceStats.size === 0) {
        return NextResponse.json({ 
            success: true, 
            message: 'No se encontraron registros de asistencia todavía. La reunión puede no haber comenzado o no hay datos disponibles.',
            participants: [] 
        });
    }

    const updatedParticipants = [];

    if (omniaParticipants) {
      for (const participant of omniaParticipants) {
        const fullName = participant.user_profiles?.full_name?.toLowerCase();
        const email = participant.user_profiles?.email?.toLowerCase();

        // --- ESTRATEGIA DE MACHEO ROBUSTA (ID/EMAIL) ---
        let stats = null;

        // 1. Prioridad: Email directo (si Google Meet lo capturó vía People API)
        if (email) {
          stats = attendanceStats.get(email);
        }

        // 2. Segunda opción: Usar el diccionario del evento (Nombre en Meet -> Email en Calendar -> Match con Omnia)
        if (!stats) {
          for (const [googleName, googleStats] of attendanceStats.entries()) {
            const mappedEmail = googleAttendeeMap.get(googleName.toLowerCase());
            if (mappedEmail && mappedEmail === email) {
              stats = googleStats;
              console.log(`🔗 Match por ID (Email) exitoso para: ${fullName} via Google-Map`);
              break;
            }
          }
        }

        // 3. Última opción (Fuzzy): Si el nombre en Omnia contiene o es contenido por el nombre en Meet
        if (!stats && (fullName || email)) {
          for (const [key, val] of attendanceStats.entries()) {
            const googleName = key.toLowerCase();
            
            // Loose Match: Si el nombre completo se contiene uno en el otro
            const nameMatch = fullName && (googleName.includes(fullName) || fullName.includes(googleName));
            
            // First Name Match Fallback: Si el primer nombre coincide completamente
            // (Ej: "Franco hotmail" vs "Franco POMATI")
            const firstNameOmnia = fullName?.split(' ')[0];
            const firstNameGoogle = googleName.split(' ')[0];
            const firstNameMatch = firstNameOmnia && firstNameGoogle && firstNameOmnia === firstNameGoogle;

            if (nameMatch || firstNameMatch || (email && googleName.includes(email))) {
              stats = val;
              console.log(`🔗 Match (Fuzzy/FirstName) exitoso para: ${fullName} con ${googleName}`);
              break;
            }
          }
        }

        if (stats) {
          const isPresent = stats.minutes > 2; // Umbral de 2 minutos
          const { error: updateError } = await supabase
            .from('calendar_event_participants')
            .update({
              attendance_minutes: stats.minutes,
              attendance_status: isPresent ? 'present' : 'absent',
              updated_at: new Date().toISOString()
            })
            .eq('id', participant.id);
          
          if (!updateError) {
            updatedParticipants.push({
              userId: participant.user_id,
              name: fullName,
              minutes: stats.minutes,
              status: isPresent ? 'present' : 'absent'
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Asistencia actualizada para ${updatedParticipants.length} participantes.`,
      updatedCount: updatedParticipants.length,
      participants: updatedParticipants
    });

  } catch (error: any) {
    console.error('Error en refresh-attendance:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
