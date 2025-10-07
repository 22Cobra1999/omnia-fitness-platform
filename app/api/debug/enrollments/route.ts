import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Obtener params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    // Obtener las últimas inscripciones
    const { data: enrollments, error } = await supabase
      .from("activity_enrollments")
      .select(`
        *,
        activities (
          id, title, price
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      console.error("Error al obtener inscripciones:", error)
      return NextResponse.json({ error: "Error al obtener inscripciones" }, { status: 500 })
    }
    // Obtener información del usuario actual
    const { data: userInfo } = await supabase.auth.getUser()
    return NextResponse.json({
      enrollments,
      currentUser: userInfo?.user,
      message: "Últimas inscripciones recuperadas exitosamente",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en debug enrollments:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
