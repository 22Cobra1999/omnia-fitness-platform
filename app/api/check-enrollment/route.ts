import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get("activityId")
    if (!activityId) {
      return NextResponse.json({ error: "ID de actividad requerido" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const userId = session.user.id
    // Verificar si ya está inscrito
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("activity_enrollments")
      .select("id, status")
      .eq("activity_id", activityId)
      .eq("client_id", userId)
      .eq("status", "enrolled")
      .maybeSingle()
    if (enrollmentError) {
      console.error("Error al verificar inscripción:", enrollmentError)
      return NextResponse.json({ error: "Error al verificar inscripción" }, { status: 500 })
    }
    return NextResponse.json({
      isEnrolled: !!enrollment,
      enrollmentId: enrollment?.id || null,
    })
  } catch (error) {
    console.error("Error en check-enrollment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
