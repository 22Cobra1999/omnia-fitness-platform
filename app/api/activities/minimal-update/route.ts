import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
// Endpoint para actualización mínima que solo actualiza campos esenciales
export async function POST(request: NextRequest) {
  try {
    // console.log("🔄 POST /api/activities/minimal-update - Iniciando actualización mínima")
    const data = await request.json()
    console.log("📋 Datos recibidos:", {
      id: data.id,
      title: data.title,
      type: data.type,
      coach_id: data.coach_id,
    })
    // Validar datos requeridos
    if (!data.id || !data.title || !data.type || !data.coach_id) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: id, title, type, coach_id" },
        { status: 400 },
      )
    }
    const supabase = createRouteHandlerClient()
    // Crear un objeto con solo los campos esenciales para minimizar la carga
    const minimalUpdate = {
      title: data.title,
      type: data.type,
      description: data.description || "",
      updated_at: new Date().toISOString(),
    }
    // console.log("🔍 Realizando actualización mínima para ID:", data.id)
    console.log("📝 Campos a actualizar:", Object.keys(minimalUpdate))
    // Ejecutar una actualización directa con solo los campos esenciales
    const { data: result, error } = await supabase
      .from("activities")
      .update(minimalUpdate)
      .eq("id", data.id)
      .eq("coach_id", data.coach_id)
      .select("id, title, type, updated_at")
      .single()
    if (error) {
      console.error("❌ Error en actualización mínima:", error)
      return NextResponse.json({ success: false, error: `Error en actualización: ${error.message}` }, { status: 500 })
    }
    if (!result) {
      return NextResponse.json(
        { success: false, error: "No se encontró la actividad o no tienes permisos" },
        { status: 404 },
      )
    }
    // console.log("✅ Actualización mínima exitosa:", result.id)
    return NextResponse.json({
      success: true,
      activityId: result.id,
      message: "Actualización básica completada. Algunos campos pueden no haberse actualizado.",
    })
  } catch (error) {
    console.error("💥 Error en actualización mínima:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
