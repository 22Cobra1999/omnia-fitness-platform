import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { GoogleOAuth } from '@/lib/google/oauth'
import { decrypt } from '@/lib/utils/encryption'

/**
 * Endpoint para sincronización bidireccional entre OMNIA y Google Calendar
 * - Busca eventos de OMNIA y los crea/actualiza en Google Calendar
 * - Busca eventos de Google Calendar y los crea/actualiza en OMNIA
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const coachId = session.user.id

    // Obtener tokens de Google OAuth
    const { data: tokens, error: tokensError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('coach_id', coachId)
      .maybeSingle()

    if (tokensError || !tokens) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar no está conectado',
        connected: false
      }, { status: 400 })
    }

    // Verificar y refrescar token si es necesario
    let accessToken = decrypt(tokens.access_token)
    const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null

    if (expiresAt && GoogleOAuth.isTokenExpired(expiresAt)) {
      try {
        const refreshToken = decrypt(tokens.refresh_token)
        const refreshed = await GoogleOAuth.refreshAccessToken(refreshToken)

        // Actualizar tokens en la base de datos
        const { encrypt } = await import('@/lib/utils/encryption')
        await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: encrypt(refreshed.access_token),
            expires_at: new Date(Date.now() + (refreshed.expires_in * 1000)).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('coach_id', coachId)

        accessToken = refreshed.access_token
      } catch (refreshError: any) {
        console.error('Error refrescando token:', refreshError)
        return NextResponse.json({
          success: false,
          error: 'Error al refrescar el token de Google'
        }, { status: 500 })
      }
    }

    // Usar GoogleOAuth para las operaciones de Calendar

    let syncedCount = 0
    const errors: string[] = []

    // 1. Sincronizar eventos de OMNIA → Google Calendar
    try {
      // Obtener eventos de OMNIA del próximo mes que NO tienen google_event_id
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)

      const { data: omniaEvents, error: omniaError } = await supabase
        .from('calendar_events')
        .select(`
          *,
          calendar_event_participants (
            client_id,
            rsvp_status,
            user_profiles:client_id (
              email
            )
          )
        `)
        .eq('coach_id', coachId)
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .is('google_event_id', null) // Solo eventos que no tienen google_event_id

      if (!omniaError && omniaEvents && omniaEvents.length > 0) {
        console.log(`📤 Sincronizando ${omniaEvents.length} eventos de OMNIA → Google Calendar`)

        // Limitar a 30 eventos por sincronización para evitar timeouts
        const eventsToSync = omniaEvents.slice(0, 30)

        // Obtener todos los eventos de Google Calendar de una vez para comparar
        const syncTimeMin = new Date(monthStart)
        syncTimeMin.setMonth(syncTimeMin.getMonth() - 1)
        const syncTimeMax = new Date(monthEnd)
        syncTimeMax.setMonth(syncTimeMax.getMonth() + 1)

        const allGoogleEvents = await GoogleOAuth.listCalendarEvents(
          accessToken,
          syncTimeMin.toISOString(),
          syncTimeMax.toISOString(),
          250
        )

        // Crear un mapa de eventos de Google por título y fecha/hora para búsqueda rápida
        const googleEventsMap = new Map<string, any>()
        allGoogleEvents.items?.forEach((ge: any) => {
          if (ge.start?.dateTime && ge.summary) {
            const geStart = new Date(ge.start.dateTime)
            const dateStr = geStart.toISOString().split('T')[0]
            const hour = geStart.getHours()
            const key = `${ge.summary}_${dateStr}_${hour}`
            googleEventsMap.set(key, ge)
          }
        })

        for (const event of eventsToSync) {
          try {
            const startTime = new Date(event.start_time)
            const endTime = new Date(event.end_time)
            const dateStr = startTime.toISOString().split('T')[0]
            const hour = startTime.getHours()
            const eventKey = `${event.title}_${dateStr}_${hour}`

            // Preparar asistentes (Attendees)
            const attendees = event.calendar_event_participants?.map((p: any) => {
              const email = p.user_profiles?.email;
              if (!email) return null;
              return { email };
            }).filter(Boolean) || [];

            // Verificar si ya existe en Google Calendar
            const duplicate = googleEventsMap.get(eventKey)

            if (duplicate) {
              console.log(`⚠️ Evento "${event.title}" ya existe en Google Calendar con ID: ${duplicate.id}`)
              // Actualizar con el google_event_id existente
              const meetLink = GoogleOAuth.extractMeetLink(duplicate)
              await supabase
                .from('calendar_events')
                .update({
                  google_event_id: duplicate.id,
                  meet_link: meetLink || event.meet_link,
                  updated_at: new Date().toISOString()
                })
                .eq('id', event.id)
              syncedCount++
              continue
            }

            // Crear evento en Google Calendar usando GoogleOAuth
            const googleEvent = await GoogleOAuth.createCalendarEvent(accessToken, {
              summary: event.title,
              description: event.description || event.notes || '',
              start: {
                dateTime: startTime.toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
              },
              end: {
                dateTime: endTime.toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
              },
              attendees: attendees.length > 0 ? attendees : undefined
            })

            // Extraer meet_link del evento creado
            const meetLink = GoogleOAuth.extractMeetLink(googleEvent)

            // Actualizar calendar_events con google_event_id
            const { error: updateError } = await supabase
              .from('calendar_events')
              .update({
                google_event_id: googleEvent.id,
                meet_link: meetLink || event.meet_link,
                updated_at: new Date().toISOString()
              })
              .eq('id', event.id)

            if (!updateError) {
              syncedCount++
              console.log(`✅ Evento "${event.title}" sincronizado con Google Calendar (con ${attendees.length} invitados)`)
            } else {
              console.error(`❌ Error actualizando evento ${event.id}:`, updateError)
              errors.push(`Error actualizando "${event.title}": ${updateError.message}`)
            }
          } catch (error: any) {
            console.error(`❌ Error sincronizando evento ${event.id}:`, error)
            errors.push(`Error con evento "${event.title}": ${error.message}`)
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error sincronizando OMNIA → Google:', error)
      errors.push(`Error sincronizando eventos de OMNIA: ${error.message}`)
    }

    // 2. Sincronizar eventos de Google Calendar → OMNIA (y actualizar RSVP)
    try {
      const timeMin = new Date()
      timeMin.setMonth(timeMin.getMonth() - 1) // Último mes
      const timeMax = new Date()
      timeMax.setMonth(timeMax.getMonth() + 2) // Próximos 2 meses

      console.log(`📥 Obteniendo eventos de Google Calendar desde ${timeMin.toISOString()} hasta ${timeMax.toISOString()}`)

      const response = await GoogleOAuth.listCalendarEvents(
        accessToken,
        timeMin.toISOString(),
        timeMax.toISOString(),
        100 // Reducir límite para evitar timeouts
      )

      const googleEvents = response.items || []
      console.log(`📥 ${googleEvents.length} eventos obtenidos de Google Calendar`)

      // Obtener todos los google_event_ids existentes en OMNIA de una vez para evitar múltiples queries
      const { data: existingOmniaEvents } = await supabase
        .from('calendar_events')
        .select('id, google_event_id, title, start_time')
        .eq('coach_id', coachId)
        .not('google_event_id', 'is', null)
        .gte('start_time', timeMin.toISOString())
        .lte('start_time', timeMax.toISOString())

      const existingGoogleEventIds = new Map(
        (existingOmniaEvents || []).map((e: any) => [e.google_event_id, e.id])
      )

      // También crear un mapa de eventos por título, fecha y hora para detectar duplicados por contenido
      // Esto evita crear eventos duplicados cuando un evento de OMNIA ya fue sincronizado a Google
      const eventsByTitleAndTime = new Map<string, string>() // key -> google_event_id
      const { data: allOmniaEvents } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, google_event_id')
        .eq('coach_id', coachId)
        .gte('start_time', timeMin.toISOString())
        .lte('start_time', timeMax.toISOString())

      if (allOmniaEvents) {
        allOmniaEvents.forEach((e: any) => {
          if (e.title && e.start_time) {
            const eventDate = new Date(e.start_time)
            const dateStr = eventDate.toISOString().split('T')[0]
            const hour = eventDate.getHours()
            // Clave: título_fecha_hora (ej: "Taller: Meditación_2025-12-30_10")
            const key = `${e.title}_${dateStr}_${hour}`
            eventsByTitleAndTime.set(key, e.google_event_id || '')
          }
        })
      }

      let processedCount = 0
      for (const googleEvent of googleEvents) {
        try {
          const startTime = googleEvent.start?.dateTime || googleEvent.start?.date
          const endTime = googleEvent.end?.dateTime || googleEvent.end?.date

          if (!startTime || !endTime || !googleEvent.id) {
            continue
          }

          let omniaEventId = existingGoogleEventIds.get(googleEvent.id);

          // Si no existe por ID, verificar por contenido (duplicados)
          if (!omniaEventId) {
            const eventDate = new Date(startTime)
            const dateStr = eventDate.toISOString().split('T')[0]
            const hour = eventDate.getHours()
            const eventKey = `${googleEvent.summary || 'Sin título'}_${dateStr}_${hour}`

            if (eventsByTitleAndTime.has(eventKey)) {
              // Existe por contenido, pero no tenía el ID vinculado.
              // Podríamos vincularlo aquí si tuviéramos manera de buscar el ID real rápido.
              // Por ahora, asumimos que si está en el mapa, está "cubierto" de duplicación, 
              // pero si queremos actualizar asistencia, necesitamos el ID.
              // (Omitiré lógica compleja de "vincular por titulo" para asistencia por ahora para no romper flujos básicos, 
              //  la prioridad es no crear duplicados).
            } else {
              // CREAR EVENTO SI NO EXISTE
              // Saltar eventos todo el día para creación inicial (opcional, usuario puede quererlos)
              if (!googleEvent.start?.date) {
                const { data: newEvent, error: insertError } = await supabase
                  .from('calendar_events')
                  .insert({
                    coach_id: coachId,
                    title: googleEvent.summary || 'Sin título',
                    description: googleEvent.description || '',
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date(endTime).toISOString(),
                    event_type: 'other',
                    status: 'scheduled',
                    google_event_id: googleEvent.id,
                    meet_link: googleEvent.hangoutLink || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select('id')
                  .single();

                if (!insertError && newEvent) {
                  syncedCount++
                  omniaEventId = newEvent.id;
                  eventsByTitleAndTime.set(eventKey, googleEvent.id)
                  console.log(`✅ Evento de Google "${googleEvent.summary}" agregado a OMNIA`)
                } else {
                  console.error(`❌ Error insertando evento de Google:`, insertError)
                }
              }
            }
          }

          // ** ACTUALIZAR ASISTENCIA (RSVP) **
          if (omniaEventId && googleEvent.attendees && googleEvent.attendees.length > 0) {
            const attendees = googleEvent.attendees;

            // Buscar perfiles de usuario por email para esos asistentes
            const emails = attendees.map((a: any) => a.email).filter(Boolean);

            const { data: userProfiles } = await supabase
              .from('user_profiles')
              .select('id, email')
              .in('email', emails);

            const emailToUserId = new Map<string, string>();
            userProfiles?.forEach((u: any) => {
              if (u.email) emailToUserId.set(u.email, u.id);
            });

            for (const attendee of attendees) {
              const userId = emailToUserId.get(attendee.email);
              if (userId) {
                // Mapear status de Google a Omnia
                // Google: 'needsAction', 'declined', 'tentative', 'accepted'
                let rsvpStatus = 'pending';
                if (attendee.responseStatus === 'accepted') rsvpStatus = 'confirmed';
                if (attendee.responseStatus === 'declined') rsvpStatus = 'declined'; // Asumiendo que existe 'declined'

                // Actualizar o crear participante
                // Primero verificamos si existe
                const { data: participant } = await supabase
                  .from('calendar_event_participants')
                  .select('id, rsvp_status')
                  .eq('event_id', omniaEventId)
                  .eq('client_id', userId)
                  .maybeSingle();

                if (participant) {
                  // Solo actualizar si cambió
                  if (participant.rsvp_status !== rsvpStatus) {
                    await supabase
                      .from('calendar_event_participants')
                      .update({ rsvp_status: rsvpStatus, updated_at: new Date().toISOString() })
                      .eq('id', participant.id);
                    console.log(`🔄 Actualizado RSVP para ${attendee.email}: ${rsvpStatus}`);
                  }
                } else {
                  // Crear participante (Invite synced from Google)
                  // Solo si es un usuario registrado en Omnia
                  await supabase
                    .from('calendar_event_participants')
                    .insert({
                      event_id: omniaEventId,
                      client_id: userId,
                      rsvp_status: rsvpStatus,
                      participant_role: 'client', // Asumido
                      updated_at: new Date().toISOString(),
                      created_at: new Date().toISOString()
                    });
                  console.log(`➕ Agregado participante ${attendee.email} desde Google`);
                }
              }
            }
          }

          processedCount++
          // Limitar procesamiento para evitar timeouts
          if (processedCount >= 50) {
            console.log(`⚠️ Límite de 50 eventos alcanzado, deteniendo sincronización`)
            break
          }
        } catch (error: any) {
          console.error(`❌ Error procesando evento de Google ${googleEvent.id}:`, error)
          errors.push(`Error con evento de Google: ${error.message}`)
        }
      }
    } catch (error: any) {
      console.error('❌ Error sincronizando Google → OMNIA:', error)
      errors.push(`Error sincronizando eventos de Google: ${error.message}`)
    }

    console.log(`✅ Sincronización completada: ${syncedCount} eventos sincronizados, ${errors.length} errores`)

    // 3. (Advanced) Sincronizar Asistencia Real desde Google Meet API
    // Solo para eventos TIEMPO PASADO recientes (ej: últimas 48hs) donde ya debería haber datos de sesión.
    try {
      const { GoogleMeet } = await import('@/lib/google/meet');

      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Buscar eventos pasados recientes con Link de Meet
      const { data: pastEvents } = await supabase
        .from('calendar_events')
        .select(`
                id, 
                title, 
                meet_link, 
                end_time,
                calendar_event_participants (
                    id, 
                    client_id,
                    user_profiles:client_id (full_name, email)
                )
            `)
        .eq('coach_id', coachId)
        .neq('meet_link', null)
        .lt('end_time', now.toISOString())     // Ya terminaron
        .gt('end_time', twoDaysAgo.toISOString()); // Recientes

      if (pastEvents && pastEvents.length > 0) {
        console.log(`🎥 Procesando asistencia real para ${pastEvents.length} eventos pasados...`);

        for (const event of pastEvents) {
          if (!event.meet_link) continue;

          const attendanceStats = await GoogleMeet.getAttendanceStats(accessToken, event.meet_link);

          if (attendanceStats.size > 0) {
            console.log(`📊 Estadísticas de Meet obtenidas: ${attendanceStats.size} participantes detectados.`);

            for (const participant of event.calendar_event_participants) {
              const fullName = participant.user_profiles?.full_name;
              const email = participant.user_profiles?.email;

              // 1. Intentar match por email (Match Perfecto)
              let stats = attendanceStats.get(email || '___');

              // 2. Si no match, intentar match por nombre completo
              if (!stats && fullName) {
                stats = attendanceStats.get(fullName);
              }

              // 3. Búsqueda fuzzy si aún no hay match
              if (!stats && (fullName || email)) {
                for (const [key, val] of attendanceStats.entries()) {
                  if (
                    (fullName && key.toLowerCase().includes(fullName.toLowerCase())) ||
                    (email && key.toLowerCase().includes(email.toLowerCase()))
                  ) {
                    stats = val;
                    break;
                  }
                }
              }

              if (stats && stats.minutes > 2) { // Consideramos presente si estuvo más de 2 minutos
                await supabase
                  .from('calendar_event_participants')
                  .update({
                    attendance_minutes: stats.minutes,
                    attendance_status: 'present',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', participant.id);
                console.log(`✅ Presente: ${fullName || email} (${stats.minutes} min)`);
              } else {
                // Si el evento terminó hace más de 1 hora y no estuvo presente, marcar como ausente
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                const eventEnd = new Date(event.end_time); // Necesitaríamos traer end_time en la select
                
                if (eventEnd < oneHourAgo) {
                   await supabase
                    .from('calendar_event_participants')
                    .update({
                      attendance_status: 'absent',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', participant.id);
                   console.log(`❌ Ausente: ${fullName || email}`);
                }
              }
            }
          }
        }
      }

    } catch (meetError: any) {
      console.error('⚠️ Error en sincronización de asistencia avanzada (Meet API):', meetError);
      // No fallamos toda la request, es un feature "progressive enhancement"
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limitar errores a 10
    })

  } catch (error: any) {
    console.error('Error en sincronización:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al sincronizar con Google Calendar'
    }, { status: 500 })
  }
}

