import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { parseFitnessCSVRow, validateFitnessCSVHeaders, convertToFitnessExerciseInsert, dayToNumber } from "@/lib/csv-parser"
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
                    const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                  return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
                }
                const { data: userProfile } = await supabase
                  .from("user_profiles")
                  .select("role")
                  .eq("id", user.id)
                  .single()
                if (userProfile?.role !== "coach") {
                  return NextResponse.json({ error: "Solo los coaches pueden procesar CSV de fitness" }, { status: 403 })
                }
                                const coachId = user.id
                // Ejecutar migración para agregar columna video_url si no existe
                // console.log('🔧 Verificando migración de columna video_url...')
                try {
                  const { error: migrationError } = await supabase
                    .rpc('execute_sql', {
                      sql_query: 'ALTER TABLE fitness_exercises ADD COLUMN IF NOT EXISTS video_url TEXT;'
                    })
                  if (migrationError) {
                    console.warn('⚠️ Error en migración (puede que ya exista):', migrationError)
                  } else {
                    // console.log('✅ Migración de columna video_url completada')
                  }
                } catch (error) {
                  console.warn('⚠️ Error ejecutando migración:', error)
                }
                // Limpiar ejercicios existentes para este activity_id
                console.log('🧹 Limpiando ejercicios existentes para activity_id:', activityId)
                const { error: deleteError } = await supabase
                  .from("fitness_exercises")
                  .delete()
                  .eq("activity_id", activityId)
                if (deleteError) {
                  console.error('❌ Error limpiando ejercicios existentes:', deleteError)
                  return NextResponse.json({ error: "Error limpiando ejercicios existentes" }, { status: 500 })
                }
                // console.log('✅ Ejercicios existentes eliminados')
                // Normalizar el formato del CSV
    let normalizedCSVData = csvData
    // Si el CSV viene como array de arrays (formato del componente), convertirlo a objetos
    if (Array.isArray(csvData[0]) && csvData[0].length > 0) {
      // console.log('🔄 Convirtiendo CSV de array a objetos...')
      const headers = csvData[0] as string[]
      // // console.log('📊 Headers detectados:', headers)
      normalizedCSVData = csvData.slice(1).map((row: any, index: number) => {
        const obj: any = {}
        headers.forEach((header, colIndex) => {
          obj[header] = row[colIndex] || ''
        })
        return obj
      })
      // console.log('✅ CSV convertido a objetos:', normalizedCSVData.length, 'filas')
    }
    // Validar headers del CSV
    const headers = Object.keys(normalizedCSVData[0])
    // console.log('🔍 Validando headers:', headers)
    if (!validateFitnessCSVHeaders(headers)) {
      return NextResponse.json({ error: "Headers del CSV no válidos" }, { status: 400 })
    }
    const results = []
    const errors = []
    for (let i = 0; i < normalizedCSVData.length; i++) {
      const row = normalizedCSVData[i]
      try {
        // Parsear la fila del CSV
        // console.log(`🔄 Procesando fila ${i + 1}:`, row)
        const exerciseData = parseFitnessCSVRow(row)
        if (!exerciseData) {
          console.error(`❌ Fila ${i + 1}: Datos incompletos o inválidos`)
          errors.push(`Fila ${i + 1}: Datos incompletos o inválidos`)
          continue
        }
        // console.log(`✅ Fila ${i + 1} parseada:`, exerciseData)
        // Convertir a formato para insertar en fitness_exercises
        const exerciseInsert = convertToFitnessExerciseInsert(exerciseData, activityId, coachId)
        // // console.log(`📊 Datos para insertar:`, exerciseInsert)
        // Crear nuevo ejercicio (ya limpiamos los existentes)
        console.log(`🆕 Creando nuevo ejercicio`)
        const { data: newExercise, error: createError } = await supabase
          .from("fitness_exercises")
          .insert(exerciseInsert)
          .select("id")
          .single()
        if (createError) {
          console.error(`❌ Error creando ejercicio:`, createError)
          errors.push(`Fila ${i + 1}: Error creando ejercicio - ${createError.message}`)
          continue
        }
        // console.log(`✅ Ejercicio creado:`, newExercise)
        const fitnessExerciseId = newExercise.id
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
    // // console.log('📊 Resumen del procesamiento:')
    console.log('- Total de filas procesadas:', results.length)
    console.log('- Total de errores:', errors.length)
    console.log('- Resultados:', results)
    console.log('- Errores:', errors)
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
