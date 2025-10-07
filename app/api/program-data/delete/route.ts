import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function POST(request: NextRequest) {
  try {
    console.log("🗑️ API: Iniciando eliminación de datos del programa")
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("❌ Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const { activityId, programType, coachId } = await request.json()
    console.log("📝 Datos recibidos:", { activityId, programType, coachId, userId: user.id })
    if (!activityId || !programType || !coachId) {
      return NextResponse.json({ error: "activityId, programType y coachId son requeridos" }, { status: 400 })
    }
    // Verificar que el usuario sea el coach de la actividad
    if (user.id !== coachId) {
      console.error("❌ Usuario no autorizado para esta actividad")
      return NextResponse.json({ error: "No autorizado para esta actividad" }, { status: 403 })
    }
    const tableName = programType === "fitness" ? "fitness_exercises" : "nutrition_program_details"
    console.log(`🗑️ Eliminando datos de la tabla: ${tableName} para actividad: ${activityId}`)
    // Primero verificar cuántos registros existen
    const { count: existingCount, error: countError } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true })
      .eq("activity_id", activityId)
      .eq("coach_id", coachId)
    if (countError) {
      console.error("❌ Error al contar registros existentes:", countError)
    } else {
      // // console.log(`📊 Registros existentes encontrados: ${existingCount || 0}`)
    }
    // Eliminar los datos existentes
    const { error: deleteError, count: deletedCount } = await supabase
      .from(tableName)
      .delete({ count: "exact" })
      .eq("activity_id", activityId)
      .eq("coach_id", coachId)
    if (deleteError) {
      console.error("❌ Error al eliminar datos:", deleteError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al eliminar los datos existentes",
          details: deleteError.message,
        },
        { status: 500 },
      )
    }
    // console.log(`✅ Datos eliminados exitosamente. Registros eliminados: ${deletedCount || 0}`)
    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${deletedCount || 0} registros de ${programType}`,
      deletedCount: deletedCount || 0,
    })
  } catch (error) {
    console.error("💥 Error crítico en delete route:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
