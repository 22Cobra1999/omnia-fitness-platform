import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
// Función para validar los datos del programa
function validateProgramData(programType: string, programData: any[]) {
  if (!programData || !Array.isArray(programData) || programData.length === 0) {
    return { valid: false, error: "No se proporcionaron datos válidos para el programa" }
  }
  // Validaciones específicas según el tipo de programa
  if (programType === "fitness") {
    // Validar que cada elemento tenga al menos los campos requeridos
    const requiredFields = ["día", "semana", "nombre_actividad"]
    for (const item of programData) {
      for (const field of requiredFields) {
        if (item[field] === undefined) {
          return { valid: false, error: `Falta el campo requerido '${field}' en uno o más registros` }
        }
      }
    }
  } else if (programType === "nutrition") {
    // Validar que cada elemento tenga al menos los campos requeridos
    const requiredFields = ["día", "semana", "comida", "nombre"]
    for (const item of programData) {
      for (const field of requiredFields) {
        if (item[field] === undefined) {
          return { valid: false, error: `Falta el campo requerido '${field}' en uno o más registros` }
        }
      }
    }
  } else {
    return { valid: false, error: "Tipo de programa no válido" }
  }
  return { valid: true }
}
export async function POST(request: NextRequest) {
  try {
    // Obtener los datos de la solicitud
    const data = await request.json()
    const { programType, activityId, programData, coachId } = data
    console.log(`Recibida solicitud para guardar datos de programa ${programType} para actividad ${activityId}`)
    console.log(`Datos recibidos: ${programData.length} registros`)
    // Validar los datos
    const validation = validateProgramData(programType, programData)
    if (!validation.valid) {
      console.error(`Error de validación: ${validation.error}`)
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }
    // Inicializar el cliente de Supabase
    const supabase = getSupabaseClient()
    // Determinar la tabla según el tipo de programa
    const tableName = programType === "fitness" ? "fitness_exercises" : "nutrition_program_details"
    console.log(`Insertando datos en la tabla ${tableName}`)
    // Primero, eliminar los registros existentes para esta actividad
    const { error: deleteError } = await supabase.from(tableName).delete().eq("activity_id", activityId)
    if (deleteError) {
      console.error(`Error al eliminar registros existentes: ${deleteError.message}`)
      return NextResponse.json(
        { success: false, error: `Error al eliminar registros existentes: ${deleteError.message}` },
        { status: 500 },
      )
    }
    console.log(`Registros existentes eliminados correctamente`)
    // Preparar los datos para la inserción
    const dataToInsert = programData.map((item: any) => ({
      ...item,
      activity_id: activityId,
      coach_id: coachId,
    }))
    // Insertar los nuevos registros
    const { data: insertedData, error: insertError } = await supabase.from(tableName).insert(dataToInsert).select()
    if (insertError) {
      console.error(`Error al insertar datos: ${insertError.message}`)
      return NextResponse.json(
        { success: false, error: `Error al insertar datos: ${insertError.message}` },
        { status: 500 },
      )
    }
    console.log(`Datos insertados correctamente: ${insertedData.length} registros`)
    // Actualizar el campo program_data en la tabla activities
    const { error: updateError } = await supabase
      .from("activities")
      .update({
        program_data: {
          [programType]: programData,
        },
      })
      .eq("id", activityId)
    if (updateError) {
      console.error(`Error al actualizar program_data: ${updateError.message}`)
      // No fallamos la operación completa si esto falla, ya que los datos ya se guardaron en la tabla específica
      console.log("Continuando a pesar del error en la actualización de program_data")
    } else {
      console.log(`Campo program_data actualizado correctamente`)
    }
    return NextResponse.json({
      success: true,
      message: `Se guardaron ${insertedData.length} registros correctamente`,
      recordsCount: insertedData.length,
    })
  } catch (error) {
    console.error("Error en el endpoint save-simple:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al procesar la solicitud",
      },
      { status: 500 },
    )
  }
}
