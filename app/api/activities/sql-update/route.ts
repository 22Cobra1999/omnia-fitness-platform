import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export async function POST(request: NextRequest) {
  try {
    // console.log("🔄 POST /api/activities/sql-update - Iniciando actualización SQL directa")
    const data = await request.json()
    const { id, title, description, type, coach_id } = data
    if (!id || !title || !type || !coach_id) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: id, title, type, coach_id" },
        { status: 400 },
      )
    }
    console.log("📋 Datos recibidos:", { id, title, type, coach_id })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    // Usar SQL directo para evitar problemas con RLS
    const { data: result, error } = await supabase.rpc("update_activity_direct", {
      p_id: id,
      p_title: title,
      p_description: description || "",
      p_type: type,
      p_coach_id: coach_id,
    })
    if (error) {
      console.error("❌ Error al ejecutar SQL directo:", error)
      return NextResponse.json(
        { success: false, error: `Error al actualizar actividad: ${error.message}` },
        { status: 500 },
      )
    }
    // console.log("✅ Actualización SQL directa exitosa:", result)
    return NextResponse.json({
      success: true,
      activityId: id,
      result,
    })
  } catch (error) {
    console.error("💥 Error en POST /api/activities/sql-update:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
