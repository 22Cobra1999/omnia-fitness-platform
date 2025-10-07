import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
// Endpoint para obtener la disponibilidad específica de una actividad
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const activityId = url.searchParams.get("activity_id")
    const coachId = url.searchParams.get("coach_id")
    if (!activityId) {
      return NextResponse.json({ success: false, error: "ID de actividad requerido" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient()
    // Obtener la actividad con sus datos de disponibilidad
    const { data: activity, error } = await supabase
      .from("activities")
      .select("available_days, available_hours, consultation_type, consultation_duration")
      .eq("id", activityId)
      .single()
    if (error) {
      console.error("Error al obtener disponibilidad de actividad:", error)
      return NextResponse.json(
        { success: false, error: `Error al obtener disponibilidad: ${error.message}` },
        { status: 500 },
      )
    }
    // Si se proporciona un coach_id, verificar también la disponibilidad general del coach
    let coachAvailability = null
    if (coachId) {
      const { data: availability, error: availError } = await supabase
        .from("coach_availability")
        .select("*")
        .eq("coach_id", coachId)
      if (!availError && availability) {
        coachAvailability = availability
      }
    }
    return NextResponse.json({
      success: true,
      availability: {
        activity: {
          available_days: activity.available_days || [],
          available_hours: activity.available_hours || [],
          consultation_type: activity.consultation_type || "",
          consultation_duration: activity.consultation_duration || 30,
        },
        coach: coachAvailability || [],
      },
    })
  } catch (error) {
    console.error("Error en GET /api/coach-activity-availability:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
// Endpoint para actualizar la disponibilidad específica de una actividad
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { activity_id, coach_id, available_days, available_hours, consultation_type, consultation_duration } = data
    if (!activity_id || !coach_id) {
      return NextResponse.json({ success: false, error: "ID de actividad y coach requeridos" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient()
    // Verificar que la actividad pertenezca al coach
    const { data: activityCheck, error: checkError } = await supabase
      .from("activities")
      .select("id")
      .eq("id", activity_id)
      .eq("coach_id", coach_id)
      .single()
    if (checkError || !activityCheck) {
      return NextResponse.json(
        { success: false, error: "Actividad no encontrada o no pertenece al coach" },
        { status: 403 },
      )
    }
    // Actualizar la disponibilidad de la actividad
    const { data: updatedActivity, error } = await supabase
      .from("activities")
      .update({
        available_days,
        available_hours,
        consultation_type,
        consultation_duration,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activity_id)
      .select()
      .single()
    if (error) {
      console.error("Error al actualizar disponibilidad:", error)
      return NextResponse.json(
        { success: false, error: `Error al actualizar disponibilidad: ${error.message}` },
        { status: 500 },
      )
    }
    return NextResponse.json({
      success: true,
      message: "Disponibilidad actualizada correctamente",
      activity: updatedActivity,
    })
  } catch (error) {
    console.error("Error en POST /api/coach-activity-availability:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
