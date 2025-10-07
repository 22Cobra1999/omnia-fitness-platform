import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function POST(request: NextRequest) {
  try {
    console.log("💾 API: Iniciando guardado de datos del programa")
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
    const { programType, activityId, programData, coachId, uploadMode = "append" } = await request.json()
    console.log("📝 Datos recibidos:", {
      programType,
      activityId,
      coachId,
      uploadMode,
      dataLength: programData?.length || 0,
      userId: user.id,
    })
    if (!programType || !activityId || !programData || !coachId) {
      return NextResponse.json(
        { error: "programType, activityId, programData y coachId son requeridos" },
        { status: 400 },
      )
    }
    // Verificar que el usuario sea el coach
    if (user.id !== coachId) {
      console.error("❌ Usuario no autorizado para esta actividad")
      return NextResponse.json({ error: "No autorizado para esta actividad" }, { status: 403 })
    }
    if (!Array.isArray(programData) || programData.length === 0) {
      return NextResponse.json({ error: "programData debe ser un array no vacío" }, { status: 400 })
    }
    const tableName = programType === "fitness" ? "fitness_exercises" : "nutrition_program_details"
    console.log(`💾 Insertando ${programData.length} registros en la tabla: ${tableName}`)
    // Preparar los datos para insertar
    const dataToInsert = programData.map((item: any) => ({
      ...item,
      activity_id: activityId,
      coach_id: coachId,
      created_at: new Date().toISOString(),
    }))
    // // console.log("📊 Primer registro de ejemplo:", dataToInsert[0])
    // Insertar los datos en lotes para evitar problemas con grandes volúmenes
    const batchSize = 100
    let totalInserted = 0
    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize)
      console.log(`📦 Insertando lote ${Math.floor(i / batchSize) + 1}: ${batch.length} registros`)
      const { data: insertedData, error: insertError } = await supabase.from(tableName).insert(batch).select()
      if (insertError) {
        console.error("❌ Error al insertar lote:", insertError)
        return NextResponse.json(
          {
            success: false,
            error: "Error al insertar datos en la base de datos",
            details: insertError.message,
            insertedSoFar: totalInserted,
          },
          { status: 500 },
        )
      }
      totalInserted += insertedData?.length || batch.length
      // console.log(`✅ Lote insertado. Total insertado hasta ahora: ${totalInserted}`)
    }
    console.log(`🎉 Todos los datos insertados exitosamente. Total: ${totalInserted}`)
    return NextResponse.json({
      success: true,
      message: `Se guardaron ${totalInserted} registros de ${programType} correctamente`,
      recordsCount: totalInserted,
    })
  } catch (error) {
    console.error("💥 Error crítico en save route:", error)
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
