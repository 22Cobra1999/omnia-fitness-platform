import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { GoogleOAuth } from '@/lib/google/oauth'
import { decrypt } from '@/lib/utils/encryption'

/**
 * Endpoint para actualizar un evento en Google Calendar cuando se actualiza en OMNIA
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId, startTime, endTime, title, description } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'eventId es requerido' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const coachId = session.user.id

    // Obtener el evento de OMNIA
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('coach_id', coachId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    // Si no tiene google_event_id, no hay nada que actualizar en Google Calendar
    if (!event.google_event_id) {
      return NextResponse.json({
        success: true,
        message: 'Evento no tiene google_event_id, no se actualiza en Google Calendar'
      })
    }

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

    // Usar los valores proporcionados o los del evento
    const newStartTime = startTime || event.start_time
    const newEndTime = endTime || event.end_time
    const newTitle = title || event.title
    const newDescription = description || event.description || ''

    // Actualizar evento en Google Calendar
    const updatedGoogleEvent = await GoogleOAuth.updateCalendarEvent(
      accessToken,
      event.google_event_id,
      {
        summary: newTitle,
        description: newDescription,
        start: {
          dateTime: new Date(newStartTime).toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        end: {
          dateTime: new Date(newEndTime).toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        }
      }
    )

    // Extraer meet_link actualizado si existe
    const meetLink = GoogleOAuth.extractMeetLink(updatedGoogleEvent)

    // Actualizar el meet_link en OMNIA si cambió
    if (meetLink && meetLink !== event.meet_link) {
      await supabase
        .from('calendar_events')
        .update({
          meet_link: meetLink,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
    }

    return NextResponse.json({
      success: true,
      googleEventId: updatedGoogleEvent.id,
      meetLink: meetLink || event.meet_link
    })

  } catch (error: any) {
    console.error('Error actualizando evento en Google Calendar:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al actualizar evento en Google Calendar'
    }, { status: 500 })
  }
}


















