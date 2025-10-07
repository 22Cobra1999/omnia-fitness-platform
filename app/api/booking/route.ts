import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { coach_id, client_id, activity_id, date, start_time, end_time, consultation_type, notes } = body
    // Validar datos requeridos
    if (!coach_id || !client_id || !date || !start_time || !end_time || !consultation_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    // Verificar que el usuario es el cliente o un administrador
    if (user.id !== client_id) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()
      if (!roleData || (roleData.role !== "admin" && user.id !== coach_id)) {
        return NextResponse.json({ error: "Not authorized to make this booking" }, { status: 403 })
      }
    }
    // Verificar si el cliente tiene créditos disponibles
    const { data: credits, error: creditsError } = await supabase
      .from("client_consultation_credits")
      .select("id, remaining_sessions")
      .eq("client_id", client_id)
      .eq("coach_id", coach_id)
      .eq("consultation_type", consultation_type)
      .eq("activity_id", activity_id)
      .single()
    if (creditsError || !credits) {
      return NextResponse.json({ error: "No tienes créditos disponibles para este tipo de consulta" }, { status: 400 })
    }
    if (credits.remaining_sessions <= 0) {
      return NextResponse.json({ error: "Has agotado tus créditos para este tipo de consulta" }, { status: 400 })
    }
    // Formatear fechas para el evento del calendario
    const startDateTime = `${date}T${start_time}:00`
    const endDateTime = `${date}T${end_time}:00`
    // Verificar si el horario está disponible
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("coach_id", coach_id)
      .or(`start_time.lt.${endDateTime},end_time.gt.${startDateTime}`)
      .not("status", "eq", "cancelled")
    if (bookingsError) {
      console.error("Error checking existing bookings:", bookingsError)
      return NextResponse.json({ error: "Error al verificar disponibilidad" }, { status: 500 })
    }
    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json({ error: "El horario seleccionado ya no está disponible" }, { status: 409 })
    }
    // Crear el evento en el calendario
    const { data: calendarEvent, error: calendarError } = await supabase
      .from("calendar_events")
      .insert({
        coach_id,
        client_id,
        title: `Consulta de ${consultation_type === "videocall" ? "Videollamada" : "Mensaje"}`,
        description: notes || `Consulta programada para ${date} a las ${start_time}`,
        start_time: startDateTime,
        end_time: endDateTime,
        event_type: consultation_type,
        status: "scheduled",
        activity_id,
      })
      .select()
      .single()
    if (calendarError) {
      console.error("Error creating calendar event:", calendarError)
      return NextResponse.json({ error: "Error al crear el evento en el calendario" }, { status: 500 })
    }
    // Actualizar los créditos del cliente (usar un crédito)
    const { error: updateError } = await supabase
      .from("client_consultation_credits")
      .update({
        used_sessions: credits.used_sessions + 1,
      })
      .eq("id", credits.id)
    if (updateError) {
      console.error("Error updating client credits:", updateError)
      // Intentar eliminar el evento del calendario si falló la actualización de créditos
      await supabase.from("calendar_events").delete().eq("id", calendarEvent.id)
      return NextResponse.json({ error: "Error al actualizar los créditos" }, { status: 500 })
    }
    return NextResponse.json(
      {
        success: true,
        message: "Consulta programada exitosamente",
        event: calendarEvent,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in booking API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
