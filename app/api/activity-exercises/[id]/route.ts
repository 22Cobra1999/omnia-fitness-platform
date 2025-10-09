import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
        try {
          const { id } = await params
          const activityId = parseInt(id)

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

    // Consultar ejercicios existentes con estructura básica
    const { data: exercises, error } = await supabase
      .from('ejercicios_detalles')
      .select(`
        id,
        activity_id,
        nombre_ejercicio,
        descripcion,
        tipo,
        equipo,
        body_parts,
        calorias,
        intensidad,
        detalle_series,
        video_url,
        created_at
      `)
      .eq('activity_id', activityId)
      .order('id', { ascending: true })

          if (error) {
            return NextResponse.json(
              { error: 'Error consultando ejercicios' },
              { status: 500 }
            )
          }

    // Transformar datos al formato esperado por el frontend (nuevo esquema sin día/semana/mes)
    const transformedData: any[] = []
    
    exercises?.forEach(exercise => {
      const baseData = {
        id: exercise.id,
        'Nombre de la Actividad': exercise.nombre_ejercicio,
        'Descripción': exercise.descripcion,
        'Duración (min)': (exercise.duracion_min || 30).toString(),
        'Tipo de Ejercicio': exercise.tipo,
        'Nivel de Intensidad': exercise.intensidad || 'Medio',
        'Equipo Necesario': exercise.equipo,
        'Partes del Cuerpo': exercise.body_parts,
        'Calorías': exercise.calorias?.toString() || '0',
        'Detalle de Series (peso-repeticiones-series)': formatSeriesForDisplay((exercise as any).detalle_series),
        video_url: exercise.video_url || null,
        created_at: exercise.created_at,
        isExisting: true, // Marcar como existente
        // Nuevos campos
        periodo: exercise.periodo || 1,
        bloque: exercise.bloque || 1,
        orden: exercise.orden || 1,
        // Información de período (por ahora hardcodeado)
        periodo_info: null,
        nombre_periodo: `Período ${exercise.periodo || 1}`,
        descripcion_periodo: '',
        duracion_semanas: 1,
        periodo_activo: true
      }
      
      // Agregar fila base (sin intensidades relacionadas)
      transformedData.push(baseData)
    })

          // Función para formatear series para display
          function formatSeriesForDisplay(series: any): string {
            if (!series) {
              return ''
            }
            if (typeof series === 'string') {
              return series
            }
            if (Array.isArray(series)) {
              const result = series.map((serie: any) => 
                `(${serie.peso}-${serie.repeticiones}-${serie.series})`
              ).join(';')
              return result
            }
            return ''
          }

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    })

  } catch (error) {
    console.error('Error en endpoint:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
