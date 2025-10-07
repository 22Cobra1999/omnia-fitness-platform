import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
// Endpoint para verificar la salud de la conexión a la base de datos
export async function GET() {
  try {
    // console.log("🔍 Verificando salud de la base de datos...")
    const startTime = Date.now()
    const supabase = createRouteHandlerClient()
    // Prueba 1: Consulta simple para verificar conectividad
    console.log("🧪 Prueba 1: Consulta simple")
    const { data: test1, error: error1 } = await supabase.from("activities").select("count()").limit(1)
    if (error1) {
      console.error("❌ Prueba 1 fallida:", error1)
      return NextResponse.json(
        {
          success: false,
          error: `Error en prueba 1: ${error1.message}`,
          tests: { test1: false },
        },
        { status: 500 },
      )
    }
    // Prueba 2: Verificar políticas de seguridad
    console.log("🧪 Prueba 2: Verificar políticas")
    const { data: test2, error: error2 } = await supabase.from("activities").select("id").limit(1)
    if (error2) {
      console.error("❌ Prueba 2 fallida:", error2)
      return NextResponse.json(
        {
          success: false,
          error: `Error en prueba 2: ${error2.message}`,
          tests: { test1: true, test2: false },
        },
        { status: 500 },
      )
    }
    const duration = Date.now() - startTime
    // console.log(`✅ Verificación completada en ${duration}ms`)
    return NextResponse.json({
      success: true,
      message: "Base de datos funcionando correctamente",
      duration: `${duration}ms`,
      tests: {
        test1: true,
        test2: true,
      },
    })
  } catch (error) {
    console.error("💥 Error al verificar salud de la base de datos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
