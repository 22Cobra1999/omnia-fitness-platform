import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const body = await request.json()
    const { consultation_type, preferred_date, preferred_time, duration, notes, activity_id, coach_id } = body
    // Validar datos requeridos
    if (!consultation_type || !preferred_date || !preferred_time || !activity_id || !coach_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }
    // Verificar que el cliente tiene créditos disponibles
    const { data: credits, error: creditsError } = await supabase
      .from("client_consultation_credits")
      .select("*")
      .eq("client_id", user.id)
      .eq("activity_id", activity_id)
      .eq("consultation_type", consultation_type)
      .gt("remaining_sessions", 0)
      .single()
    if (creditsError || !credits) {
      return NextResponse.json(
        {
          error: "No tienes sesiones disponibles para este tipo de consulta",
        },
        { status: 400 },
      )
    }
    // Crear fechas de inicio y fin
    const startDateTime = new Date(`${preferred_date}T${preferred_time}:00`)
    const endDateTime = new Date(startDateTime.getTime() + (duration || 60) * 60 * 1000)
    // Crear evento en el calendario
    const { data: calendarEvent, error: calendarError } = await supabase
      .from("calendar_events")
      .insert({
        coach_id,
        client_id: user.id,
        title: `Consulta por ${consultation_type === "videocall" ? "Videollamada" : "Mensaje"}`,
        description: notes || `Consulta programada desde la actividad`,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        event_type: consultation_type,
        status: "scheduled",
        activity_id,
      })
      .select()
      .single()
    if (calendarError) {
      console.error("Error creating calendar event:", calendarError)
      return NextResponse.json({ error: "Error al crear evento en calendario" }, { status: 500 })
    }
    // Usar un crédito
    const { error: useError } = await supabase
      .from("client_consultation_credits")
      .update({
        used_sessions: credits.used_sessions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credits.id)
    if (useError) {
      console.error("Error using consultation credit:", useError)
      // Intentar eliminar el evento creado si falla el uso del crédito
      await supabase.from("calendar_events").delete().eq("id", calendarEvent.id)
      return NextResponse.json({ error: "Error al usar crédito de consulta" }, { status: 500 })
    }
    return NextResponse.json(
      {
        calendar_event: calendarEvent,
        remaining_sessions: credits.remaining_sessions - 1,
        message: "Consulta programada exitosamente",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in book consultation API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
