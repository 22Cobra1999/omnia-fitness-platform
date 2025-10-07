import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
// GET - Obtener una actividad reciente específica
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Obtener la actividad reciente
    const { data, error } = await supabase
      .from("recent_activities")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()
    if (error) {
      console.error("Error al obtener actividad reciente:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ activity: data })
  } catch (error) {
    console.error(`Error en GET /api/recent-activities/${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
// PUT - Actualizar una actividad reciente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Obtener datos de la actividad del cuerpo de la solicitud
    const activityData = await request.json()
    // Verificar que la actividad pertenezca al usuario
    const { data: existingActivity, error: fetchError } = await supabase
      .from("recent_activities")
      .select("user_id")
      .eq("id", params.id)
      .single()
    if (fetchError || !existingActivity) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }
    if (existingActivity.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado para modificar esta actividad" }, { status: 403 })
    }
    // Actualizar la actividad
    const { data, error } = await supabase
      .from("recent_activities")
      .update(activityData)
      .eq("id", params.id)
      .select()
      .single()
    if (error) {
      console.error("Error al actualizar actividad reciente:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ activity: data })
  } catch (error) {
    console.error(`Error en PUT /api/recent-activities/${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
// DELETE - Eliminar una actividad reciente
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Verificar que la actividad pertenezca al usuario
    const { data: existingActivity, error: fetchError } = await supabase
      .from("recent_activities")
      .select("user_id")
      .eq("id", params.id)
      .single()
    if (fetchError || !existingActivity) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }
    if (existingActivity.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado para eliminar esta actividad" }, { status: 403 })
    }
    // Eliminar la actividad
    const { error } = await supabase.from("recent_activities").delete().eq("id", params.id)
    if (error) {
      console.error("Error al eliminar actividad reciente:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error en DELETE /api/recent-activities/${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
