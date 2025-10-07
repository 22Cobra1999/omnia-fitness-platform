import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
// Endpoint directo que usa credenciales de servicio para evitar problemas de autenticación
export async function POST(request: NextRequest) {
  try {
    // console.log("🔄 POST /api/activities/direct-update - Actualización directa")
    const data = await request.json()
    console.log("📋 Datos recibidos:", {
      id: data.id,
      title: data.title,
      type: data.type,
    })
    // Validar datos requeridos
    if (!data.id || !data.title || !data.type) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos: id, title, type" }, { status: 400 })
    }
    // Usar cliente directo con credenciales de servicio
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Faltan credenciales de Supabase")
      return NextResponse.json({ success: false, error: "Error de configuración del servidor" }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    // Preparar datos para actualización
    const updateData = {
      title: data.title,
      type: data.type,
      description: data.description || "",
      updated_at: new Date().toISOString(),
    }
    // console.log("🔍 Ejecutando actualización directa para ID:", data.id)
    // Ejecutar actualización directa sin verificaciones previas
    const { data: result, error } = await supabase
      .from("activities")
      .update(updateData)
      .eq("id", data.id)
      .select("id, title, type")
      .single()
    if (error) {
      console.error("❌ Error en actualización directa:", error)
      return NextResponse.json({ success: false, error: `Error en actualización: ${error.message}` }, { status: 500 })
    }
    if (!result) {
      return NextResponse.json({ success: false, error: "No se encontró la actividad" }, { status: 404 })
    }
    // console.log("✅ Actualización directa exitosa:", result.id)
    return NextResponse.json({
      success: true,
      activityId: result.id,
      message: "Actualización directa completada",
    })
  } catch (error) {
    console.error("💥 Error en actualización directa:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
