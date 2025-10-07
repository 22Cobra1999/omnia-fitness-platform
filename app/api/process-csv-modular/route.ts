import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseModularCSVRow, validateModularCSVHeaders, parseSeriesString, dayToNumber } from "@/lib/csv-parser-modular"

// Función para formatear detalle_series como JSON
function formatDetalleSeries(detalleSeries: any[]): any[] {
  if (!detalleSeries || detalleSeries.length === 0) return []
  
  return detalleSeries.map(s => ({
    peso: s.peso,
    repeticiones: s.repeticiones,
    series: s.series
  }))
}

// Función para normalizar tipos de ejercicio
// Valores válidos según constraint: fuerza, cardio, movilidad, flexibilidad, equilibrio, hiit, aeróbico, funcional, otro
function normalizeTipoEjercicio(tipo: string): string {
  const tipoLower = tipo.toLowerCase()
  
  // Mapear tipos comunes a valores válidos del constraint
  const tipoMap: { [key: string]: string } = {
    'fuerza': 'fuerza',
    'strength': 'fuerza',
    'cardio': 'cardio',
    'cardiovascular': 'cardio',
    'aeróbico': 'aeróbico',
    'aerobic': 'aeróbico',
    'hiit': 'hiit',
    'flexibilidad': 'flexibilidad',
    'flexibility': 'flexibilidad',
    'movilidad': 'movilidad',
    'mobility': 'movilidad',
    'equilibrio': 'equilibrio',
    'balance': 'equilibrio',
    'funcional': 'funcional',
    'functional': 'funcional',
    'yoga': 'flexibilidad', // Mapear yoga a flexibilidad
    'pilates': 'flexibilidad', // Mapear pilates a flexibilidad
    'crossfit': 'funcional', // Mapear crossfit a funcional
    'otro': 'otro',
    'other': 'otro'
  }
  
  return tipoMap[tipoLower] || 'fuerza' // Por defecto fuerza
}

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

    // Usar service role key para debugging
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Para debugging, usar un coach ID fijo
    const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'

    // console.log('🚀 Procesando CSV modular para actividad:', activityId)
    // // console.log('📊 Total de filas:', csvData.length)
    // console.log('🔍 Primera fila de ejemplo:', csvData[0])

    // Validar headers del CSV
    const headers = Object.keys(csvData[0])
    // console.log('🔍 Headers del CSV:', headers)
    
    if (!validateModularCSVHeaders(headers)) {
      return NextResponse.json({ error: "Headers del CSV no válidos para el formato modular" }, { status: 400 })
    }

    const results = []
    const errors = []

    // Limpiar datos existentes para esta actividad
    console.log('🧹 Limpiando datos existentes para actividad:', activityId)
    
    // Eliminar organizacion_ejercicios existente
    const { error: deleteOrgError } = await supabase
      .from("organizacion_ejercicios")
      .delete()
      .eq("activity_id", activityId)

    if (deleteOrgError) {
      console.error('❌ Error eliminando organizacion_ejercicios:', deleteOrgError)
      errors.push(`Error eliminando datos existentes: ${deleteOrgError.message}`)
    }

    // Eliminar ejercicios_detalles existente
    const { error: deleteEjError } = await supabase
      .from("ejercicios_detalles")
      .delete()
      .eq("activity_id", activityId)

    if (deleteEjError) {
      console.error('❌ Error eliminando ejercicios_detalles:', deleteEjError)
      errors.push(`Error eliminando ejercicios existentes: ${deleteEjError.message}`)
    }

    // Procesar cada fila del CSV
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      try {
        // console.log(`🔄 Procesando fila ${i + 1}:`, row)
        
        const exerciseData = parseModularCSVRow(row)
        if (!exerciseData) {
          console.error(`❌ Fila ${i + 1}: Datos incompletos o inválidos`)
          console.error(`❌ Fila ${i + 1} raw data:`, row)
          errors.push(`Fila ${i + 1}: Datos incompletos o inválidos`)
          continue
        }

        // console.log(`✅ Fila ${i + 1} parseada:`, exerciseData)
        // console.log(`🔍 Datos para insertar:`, { activity_id: activityId, nombre: exerciseData.nombre })
          body_parts: exerciseData.partes_cuerpo,
          calorias: parseInt(exerciseData.calorias) || 0,
          detalle_series: formatDetalleSeries(exerciseData.detalle_series),
          video_url: exerciseData.video_url || '',
          created_by: coachId
        })

        // 1. Crear o encontrar ejercicio en ejercicios_detalles
        const { data: existingExercise } = await supabase
          .from("ejercicios_detalles")
          .select("id")
          .eq("activity_id", activityId)
          .eq("nombre_ejercicio", exerciseData.nombre)
          .single()

        let ejercicioId: number

        if (existingExercise) {
          ejercicioId = existingExercise.id
          console.log(`♻️ Usando ejercicio existente:`, ejercicioId)
        } else {
          // Crear nuevo ejercicio
          const { data: newExercise, error: createError } = await supabase
            .from("ejercicios_detalles")
            .insert({
              activity_id: activityId,
              nombre_ejercicio: exerciseData.nombre,
              tipo: normalizeTipoEjercicio(exerciseData.tipo_ejercicio),
              descripcion: exerciseData.descripcion,
              equipo: exerciseData.equipo_necesario,
              body_parts: exerciseData.partes_cuerpo,
              calorias: parseInt(exerciseData.calorias) || 0,
              detalle_series: formatDetalleSeries(exerciseData.detalle_series),
              video_url: exerciseData.video_url || '',
              created_by: coachId
            })
            .select("id")
            .single()

          if (createError) {
            console.error(`❌ Error creando ejercicio:`, createError)
            errors.push(`Fila ${i + 1}: Error creando ejercicio - ${createError.message}`)
            continue
          }

          ejercicioId = newExercise.id
          // console.log(`✅ Ejercicio creado:`, ejercicioId)
        }

        // 2. Crear entrada en organizacion_ejercicios
        const { error: orgError } = await supabase
          .from("organizacion_ejercicios")
          .insert({
            activity_id: activityId,
            semana: exerciseData.semana,
            dia: dayToNumber(exerciseData.dia),
            ejercicio_id: ejercicioId,
            bloque: 1, // Por defecto
            orden: (exerciseData.semana - 1) * 7 + dayToNumber(exerciseData.dia)
          })

        if (orgError) {
          console.error(`❌ Error creando organizacion_ejercicios:`, orgError)
          errors.push(`Fila ${i + 1}: Error organizando ejercicio - ${orgError.message}`)
          continue
        }

        // 3. Crear intensidades basadas en el detalle de series
        const series = parseSeriesString(exerciseData.detalle_series)
        if (series.length > 0) {
          for (let j = 0; j < series.length; j++) {
            const serie = series[j]
            const { error: intensityError } = await supabase
              .from("intensidades")
              .insert({
                ejercicio_id: ejercicioId,
                nombre: `${exerciseData.nivel_intensidad} - Serie ${j + 1}`,
                orden: j + 1,
                reps: serie.repeticiones,
                series: serie.series,
                peso: serie.peso,
                duracion_minutos: exerciseData.duracion_min,
                descanso_segundos: 90, // Por defecto
                created_by: coachId
              })

            if (intensityError) {
              console.error(`❌ Error creando intensidad:`, intensityError)
              errors.push(`Fila ${i + 1}: Error creando intensidad - ${intensityError.message}`)
            }
          }
        }

        results.push({
          row: i + 1,
          exercise: exerciseData.nombre,
          semana: exerciseData.semana,
          dia: exerciseData.dia,
          series_count: series.length,
          ejercicio_id: ejercicioId
        })

        // console.log(`✅ Fila ${i + 1} procesada exitosamente`)

      } catch (error) {
        console.error(`❌ Error procesando fila ${i + 1}:`, error)
        errors.push(`Fila ${i + 1}: Error inesperado - ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    console.log('🎉 Procesamiento completado')
    // console.log('✅ Resultados exitosos:', results.length)
    console.log('❌ Errores:', errors.length)

    return NextResponse.json({
      success: true,
      message: `CSV procesado exitosamente. ${results.length} ejercicios procesados.`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total_rows: csvData.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('❌ Error general procesando CSV modular:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Función auxiliar para convertir día a número
function dayToNumber(day: string): number {
  const dayMap: { [key: string]: number } = {
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6,
    'sabado': 6,
    'domingo': 7
  }
  
  return dayMap[day.toLowerCase()] || 1
}
