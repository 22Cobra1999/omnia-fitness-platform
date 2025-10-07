import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SimpleExerciseData } from '@/lib/csv-parser-simple'

export async function POST(request: NextRequest) {
  try {
    const { csvData, activityId, coachId } = await request.json()

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json(
        { error: 'Datos CSV no válidos' },
        { status: 400 }
      )
    }

    if (!activityId) {
      return NextResponse.json(
        { error: 'ID de actividad requerido' },
        { status: 400 }
      )
    }

    // Usar service role key para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Para debugging, usar un coach ID fijo
    const fixedCoachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'

    // console.log('🚀 Procesando CSV simple para actividad:', activityId)
    // // console.log('📊 Total de filas:', csvData.length)
    // console.log('🔍 Primera fila de ejemplo:', csvData[0])

    const results = []
    const errors = []

    // Función para normalizar tipo de ejercicio
    function normalizeTipoEjercicio(tipo: string): string {
      const tipoLower = tipo.toLowerCase()
      const validTypes = ['fuerza', 'cardio', 'movilidad', 'flexibilidad', 'equilibrio', 'hiit', 'aeróbico', 'funcional', 'otro']
      
      if (validTypes.includes(tipoLower)) {
        return tipoLower
      }
      
      // Mapeos comunes
      const mappings: { [key: string]: string } = {
        'fuerza': 'fuerza',
        'cardio': 'cardio',
        'hiit': 'hiit',
        'flexibilidad': 'flexibilidad',
        'movilidad': 'movilidad',
        'equilibrio': 'equilibrio',
        'aerobico': 'aeróbico',
        'funcional': 'funcional'
      }
      
      return mappings[tipoLower] || 'otro'
    }

    // Función para parsear series
    function parseSeriesString(seriesStr: string): Array<{peso: number, repeticiones: number, series: number}> {
      if (!seriesStr || seriesStr.trim() === '') {
        return []
      }

      try {
        // Formato: "(80-8-4);(85-6-3);(90-4-2)"
        const series = seriesStr.split(';').map(s => s.trim())
        return series.map(serie => {
          // Remover paréntesis y dividir por guiones
          const cleanSerie = serie.replace(/[()]/g, '')
          const parts = cleanSerie.split('-')
          
          if (parts.length >= 3) {
            return {
              peso: parseFloat(parts[0]) || 0,
              repeticiones: parseInt(parts[1]) || 0,
              series: parseInt(parts[2]) || 0
            }
          }
          return { peso: 0, repeticiones: 0, series: 0 }
        })
      } catch (error) {
        console.error('Error parseando series:', error)
        return []
      }
    }

    // Ya no usamos día/semana. Orden secuencial por ingreso
    let sequentialOrder = 1

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i] as any
      try {
        // console.log(`🔄 Procesando fila ${i + 1}:`, row)
        
        // Validar datos mínimos (nuevo)
        const nombreActividad = row['Nombre de la Actividad'] || row.nombre
        if (!nombreActividad) {
          console.error(`❌ Fila ${i + 1}: Falta 'Nombre de la Actividad'`)
          errors.push(`Fila ${i + 1}: Falta 'Nombre de la Actividad'`)
          continue
        }

        // Parsear series
        const series = parseSeriesString(row['Detalle de Series (peso-repeticiones-series)'] || row.detalle_series)
        // // console.log(`📊 Series parseadas para fila ${i + 1}:`, series)

        // Crear ejercicio en ejercicios_detalles con toda la información
        const { data: ejercicioData, error: ejercicioError } = await supabase
          .from("ejercicios_detalles")
          .insert({
            activity_id: activityId,
            nombre_ejercicio: nombreActividad,
            tipo: normalizeTipoEjercicio(row['Tipo de Ejercicio'] || row.tipo_ejercicio || ''),
            descripcion: row['Descripción'] || row.descripcion || '',
            equipo: row['Equipo Necesario'] || row.equipo_necesario || '',
            body_parts: row['Partes del Cuerpo'] || row.body_parts || '',
            calorias: parseInt(row['Calorías'] || row.calorias) || 0,
            intensidad: row['Nivel de Intensidad'] || row.nivel_intensidad || 'Principiante',
            video_url: row.video_url || '',
            // Organización mínima sin semana/día
            periodo: 1,
            bloque: 1,
            orden: sequentialOrder++,
            created_by: fixedCoachId
          })
          .select()
          .single()

        if (ejercicioError) {
          console.error(`❌ Error creando ejercicio:`, ejercicioError)
          errors.push(`Fila ${i + 1}: Error creando ejercicio - ${ejercicioError.message}`)
          continue
        }

        const ejercicioId = ejercicioData.id
        // console.log(`✅ Ejercicio creado con ID: ${ejercicioId}`)

        // Crear intensidad con todas las series
        if (series.length > 0) {
          const { error: intensityError } = await supabase
            .from("intensidades")
            .insert({
              ejercicio_id: ejercicioId,
              nombre_ejercicio: nombreActividad,
              intensidad: row['Nivel de Intensidad'] || row.nivel_intensidad || '',
              detalle_series: series, // JSONB con todas las series
              duracion_minutos: parseInt(row['Duración (min)'] || row.duracion_min) || 30,
              calorias: parseInt(row['Calorías'] || row.calorias) || 0,
              created_by: fixedCoachId
            })

            if (intensityError) {
              console.error(`❌ Error creando intensidad:`, intensityError)
              errors.push(`Fila ${i + 1}: Error creando intensidad - ${intensityError.message}`)
            }
          }
        }

        results.push({
          row: i + 1,
          exercise: nombreActividad,
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
        errors: errors.length
      }
    })

  } catch (error) {
    console.error('❌ Error general procesando CSV:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
