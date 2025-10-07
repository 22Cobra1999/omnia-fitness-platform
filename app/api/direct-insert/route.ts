import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Obtener datos del cuerpo de la solicitud
    const { activityId } = await request.json()
    if (!activityId) {
      return NextResponse.json({ error: "Se requiere activityId" }, { status: 400 })
    }
    // Obtener la sesión actual
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }
    const userId = session.user.id
    console.log("Intentando inserción directa para usuario:", userId, "actividad:", activityId)
    // Intentar inserción SQL directa usando RPC
    const { data: insertResult, error: insertError } = await supabase
      .rpc("insert_enrollment", {
        p_activity_id: activityId,
        p_client_id: userId,
        p_status: "active",
      })
      .catch((err) => {
        console.error("Error en RPC insert_enrollment:", err)
        return { data: null, error: err }
      })
    if (insertError) {
      console.error("Error en inserción directa:", insertError)
      // Intentar inserción normal como fallback
      console.log("Intentando inserción normal como fallback")
      const { data: fallbackResult, error: fallbackError } = await supabase
        .from("activity_enrollments")
        .insert({
          activity_id: activityId,
          client_id: userId,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select()
      if (fallbackError) {
        console.error("Error en inserción fallback:", fallbackError)
        return NextResponse.json(
          {
            success: false,
            error: "Falló la inserción directa y el fallback",
            rpcError: insertError,
            fallbackError: fallbackError,
          },
          { status: 500 },
        )
      }
      return NextResponse.json({
        success: true,
        message: "Inserción fallback exitosa",
        data: fallbackResult,
      })
    }
    return NextResponse.json({
      success: true,
      message: "Inserción directa exitosa",
      data: insertResult,
    })
  } catch (error) {
    console.error("Error en direct-insert:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
