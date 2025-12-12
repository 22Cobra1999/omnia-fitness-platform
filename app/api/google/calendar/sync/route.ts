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
        .select('*')
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
              }
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
              console.log(`✅ Evento "${event.title}" sincronizado con Google Calendar`)
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

    // 2. Sincronizar eventos de Google Calendar → OMNIA
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
        .select('google_event_id, title, start_time')
        .eq('coach_id', coachId)
        .not('google_event_id', 'is', null)
        .gte('start_time', timeMin.toISOString())
        .lte('start_time', timeMax.toISOString())

      const existingGoogleEventIds = new Set(
        (existingOmniaEvents || []).map(e => e.google_event_id).filter(Boolean)
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
        allOmniaEvents.forEach(e => {
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
          // Saltar eventos que ya están en OMNIA por google_event_id
          if (googleEvent.id && existingGoogleEventIds.has(googleEvent.id)) {
            continue // Ya existe, saltar
          }

          // Saltar eventos todo el día
          if (googleEvent.start?.date) {
            continue
          }

          const startTime = googleEvent.start?.dateTime || googleEvent.start?.date
          const endTime = googleEvent.end?.dateTime || googleEvent.end?.date

          if (!startTime || !endTime || !googleEvent.id) {
            continue
          }

          // Verificar duplicados por título, fecha y hora (más preciso)
          const eventDate = new Date(startTime)
          const dateStr = eventDate.toISOString().split('T')[0]
          const hour = eventDate.getHours()
          const eventKey = `${googleEvent.summary || 'Sin título'}_${dateStr}_${hour}`
          
          // Verificar si ya existe un evento con el mismo título, fecha y hora
          if (eventsByTitleAndTime.has(eventKey)) {
            const existingGoogleEventId = eventsByTitleAndTime.get(eventKey)
            // Si el evento existente no tiene google_event_id, actualizarlo
            if (!existingGoogleEventId && googleEvent.id) {
              const { data: existingEvent } = await supabase
                .from('calendar_events')
                .select('id')
                .eq('coach_id', coachId)
                .eq('title', googleEvent.summary || 'Sin título')
                .gte('start_time', new Date(eventDate.setHours(0, 0, 0, 0)).toISOString())
                .lte('start_time', new Date(eventDate.setHours(23, 59, 59, 999)).toISOString())
                .is('google_event_id', null)
                .maybeSingle()
              
              if (existingEvent) {
                await supabase
                  .from('calendar_events')
                  .update({
                    google_event_id: googleEvent.id,
                    meet_link: googleEvent.hangoutLink || null,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingEvent.id)
                console.log(`✅ Evento existente actualizado con google_event_id: "${googleEvent.summary}"`)
                continue
              }
            }
            console.log(`⚠️ Evento duplicado detectado: "${googleEvent.summary}" el ${dateStr} a las ${hour}:00`)
            continue // Ya existe un evento con el mismo título, fecha y hora
          }

          // Crear evento en OMNIA
          const { error: insertError } = await supabase
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

          if (!insertError) {
            syncedCount++
            eventsByTitleAndTime.set(eventKey, googleEvent.id) // Agregar al mapa para evitar duplicados
            console.log(`✅ Evento de Google "${googleEvent.summary}" agregado a OMNIA`)
          } else {
            console.error(`❌ Error insertando evento de Google:`, insertError)
            errors.push(`Error insertando "${googleEvent.summary}": ${insertError.message}`)
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

