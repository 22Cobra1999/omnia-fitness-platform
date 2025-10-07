import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // 1. Obtener el usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // 2. Verificar si el usuario tiene un registro en la tabla clients
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    if (clientError) {
      return NextResponse.json({ error: "Error al verificar cliente: " + clientError.message }, { status: 500 })
    }
    // 3. Verificar si el usuario tiene inscripciones
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("activity_enrollments")
      .select("id, activity_id, status, created_at")
      .eq("client_id", user.id)
    if (enrollmentsError) {
      return NextResponse.json(
        { error: "Error al verificar inscripciones: " + enrollmentsError.message },
        { status: 500 },
      )
    }
    // 4. Devolver la información
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "unknown",
      },
      clientExists: !!client,
      clientData: client,
      enrollments: enrollments || [],
      message: client
        ? "El usuario tiene un registro en la tabla clients"
        : "El usuario NO tiene un registro en la tabla clients",
    })
  } catch (error) {
    console.error("Error en client-check:", error)
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
