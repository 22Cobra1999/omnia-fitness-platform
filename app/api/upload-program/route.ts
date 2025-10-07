import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function POST(request: NextRequest) {
  // console.log("🚀 API Route /api/upload-program ejecutándose")
  try {
    // Test básico
    const body = await request.json().catch(() => null)
    if (body?.test) {
      // console.log("✅ Test request recibido")
      return NextResponse.json({
        success: true,
        message: "API route funcionando correctamente",
        timestamp: new Date().toISOString(),
      })
    }
    console.log("📝 Procesando FormData...")
    const supabase = createClient(cookieStore)
    console.log("🔐 Cliente Supabase creado")
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    console.log("👤 Usuario:", user?.id || "No autenticado")
    if (authError || !user) {
      console.log("❌ Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Intentar obtener FormData
    const formData = await request.formData()
    console.log("📋 FormData obtenido, keys:", Array.from(formData.keys()))
    const file = formData.get("file") as File
    const programType = formData.get("programType") as string
    const activityId = formData.get("activityId") as string
    console.log("📁 Archivo:", file?.name || "No file")
    console.log("🏷️ Tipo:", programType || "No type")
    console.log("🆔 Activity ID:", activityId || "No ID")
    if (!file || !programType || !activityId) {
      console.log("❌ Datos faltantes")
      return NextResponse.json(
        {
          error: "Archivo, tipo de programa y ID de actividad son requeridos",
          received: {
            file: !!file,
            programType: !!programType,
            activityId: !!activityId,
          },
        },
        { status: 400 },
      )
    }
    // console.log("✅ Todos los datos presentes, procesando...")
    return NextResponse.json({
      success: true,
      message: "Datos recibidos correctamente (sin procesar aún)",
      details: {
        fileName: file.name,
        fileSize: file.size,
        programType,
        activityId,
        userId: user.id,
      },
    })
  } catch (error) {
    console.error("💥 Error en API route:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
export async function GET() {
  // console.log("🚀 GET request a /api/upload-program")
  return NextResponse.json({
    message: "API route funcionando",
    method: "GET",
    timestamp: new Date().toISOString(),
  })
}
