import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Obtener el rol del usuario
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("preferences")
      .eq("user_id", user.id)
      .single()
    const role = userProfile?.preferences?.role || "client"
    // Si es cliente, solo puede ver sus propias inscripciones
    if (role === "client" && user.id !== clientId) {
      return NextResponse.json({ error: "No tienes permiso para ver estas inscripciones" }, { status: 403 })
    }
    // Obtener inscripciones con información de actividades y coaches
    const { data: enrollments, error } = await supabase
      .from("activity_enrollments")
      .select(`
        *,
        activity:activities(
          id, 
          title, 
          description, 
          image_url,
          coach:coach_id(
            id:user_id, 
            name:display_name
          )
        )
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error al obtener inscripciones:", error)
      return NextResponse.json({ error: "Error al obtener inscripciones" }, { status: 500 })
    }
    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Error en GET /api/clients/[id]/enrollments:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
