// ⚠️ ARCHIVO OBSOLETO - Usa tabla fitness_exercises que ya no existe
// Usar /api/process-csv-modular/route.ts en su lugar
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { parseFitnessCSVRow, validateFitnessCSVHeaders, convertToFitnessExerciseInsert } from "@/lib/csv-parser"
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { csvData, activityId } = body
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({ error: "CSV data es requerido" }, { status: 400 })
    }
    if (!activityId) {
      return NextResponse.json({ error: "activityId es requerido" }, { status: 400 })
    }
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Verificar que el usuario es coach
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single()
    if (userProfile?.role !== "coach") {
      return NextResponse.json({ error: "Solo los coaches pueden procesar CSV de fitness" }, { status: 403 })
    }
    // Validar headers del CSV
    const headers = Object.keys(csvData[0])
    if (!validateFitnessCSVHeaders(headers)) {
      return NextResponse.json({ error: "Headers del CSV no válidos" }, { status: 400 })
    }
    const results = []
    const errors = []
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      try {
        // Parsear la fila del CSV
        const exerciseData = parseFitnessCSVRow(row)
        if (!exerciseData) {
          errors.push(`Fila ${i + 1}: Datos incompletos o inválidos`)
          continue
        }
        // Convertir a formato para insertar en fitness_exercises
        const exerciseInsert = convertToFitnessExerciseInsert(exerciseData, activityId)
        // Buscar ejercicio existente
        const { data: existingExercise, error: exerciseError } = await supabase
          .from("fitness_exercises")
          .select("id")
          .eq("activity_id", activityId)
          .eq("semana", exerciseData.semana)
          .eq("día", exerciseData.dia)
          .eq("nombre_actividad", exerciseData.nombre)
          .single()
        let fitnessExerciseId: string
        if (existingExercise) {
          // Actualizar ejercicio existente con nuevos datos
          const { data: updatedExercise, error: updateError } = await supabase
            .from("fitness_exercises")
            .update({
              duracion_min: exerciseInsert.duracion_min,
              one_rm: exerciseInsert.one_rm,
              detalle_series: exerciseInsert.detalle_series,
              video_url: exerciseInsert.video_url,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingExercise.id)
            .select("id")
            .single()
          if (updateError) {
            errors.push(`Fila ${i + 1}: Error actualizando ejercicio - ${updateError.message}`)
            continue
          }
          fitnessExerciseId = updatedExercise.id
        } else {
          // Crear nuevo ejercicio con todos los datos
          const { data: newExercise, error: createError } = await supabase
            .from("fitness_exercises")
            .insert(exerciseInsert)
            .select("id")
            .single()
          if (createError) {
            errors.push(`Fila ${i + 1}: Error creando ejercicio - ${createError.message}`)
            continue
          }
          fitnessExerciseId = newExercise.id
        }
        results.push({
          row: i + 1,
          exercise: exerciseData.nombre,
          series_count: exerciseData.detalle_series?.length || 0,
          exercise_id: fitnessExerciseId
        })
      } catch (error) {
        errors.push(`Fila ${i + 1}: Error inesperado - ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }
    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error("Error processing fitness CSV:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
