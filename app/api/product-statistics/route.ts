import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// GET - Obtener estadísticas de un producto
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const actividadId = searchParams.get('actividad_id')

    if (!actividadId) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id es requerido' 
      }, { status: 400 })
    }

    console.log('📊 Obteniendo estadísticas para actividad:', actividadId)

    // 1. Obtener información de la actividad
    const { data: actividad, error: actividadError } = await supabase
      .from('activities')
      .select('id, title, type, difficulty, price, created_at')
      .eq('id', actividadId)
      .single()

    if (actividadError) {
      console.error('Error obteniendo actividad:', actividadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo actividad' 
      }, { status: 500 })
    }

    // 2. Obtener períodos
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('*')
      .eq('actividad_id', actividadId)
      .single()

    if (periodosError && periodosError.code !== 'PGRST116') {
      console.error('Error obteniendo períodos:', periodosError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo períodos' 
      }, { status: 500 })
    }

    // 3. Obtener planificaciones
    const { data: planificaciones, error: planificacionesError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('numero_semana')

    if (planificacionesError) {
      console.error('Error obteniendo planificaciones:', planificacionesError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo planificaciones' 
      }, { status: 500 })
    }

    // 4. Obtener ejercicios originales
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, tipo, intensidad')
      .eq('activity_id', actividadId)

    if (ejerciciosError) {
      console.error('Error obteniendo ejercicios:', ejerciciosError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo ejercicios' 
      }, { status: 500 })
    }

    // 5. Obtener progreso de clientes
    const { data: progreso, error: progresoError } = await supabase
      .from('progreso_cliente')
      .select('*')
      .eq('actividad_id', actividadId)

    if (progresoError) {
      console.error('Error obteniendo progreso:', progresoError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo progreso' 
      }, { status: 500 })
    }

    // 6. Calcular estadísticas detalladas
    const totalSemanas = planificaciones.length
    const totalEjercicios = ejercicios.length
    
    // Ejercicios por semana
    const ejerciciosPorSemana = planificaciones.map(semana => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      const totalEjerciciosSemana = dias.reduce((total, dia) => {
        const ejercicios = semana[dia]?.ejercicios || []
        return total + ejercicios.length
      }, 0)
      
      const diasConEjercicios = dias.filter(dia => {
        const ejercicios = semana[dia]?.ejercicios || []
        return ejercicios.length > 0
      }).length

      return {
        numero_semana: semana.numero_semana,
        total_ejercicios: totalEjerciciosSemana,
        dias_con_ejercicios: diasConEjercicios,
        distribucion_dias: dias.reduce((dist, dia) => {
          dist[dia] = semana[dia]?.ejercicios?.length || 0
          return dist
        }, {})
      }
    })

    // Ejercicios por tipo
    const ejerciciosPorTipo = ejercicios.reduce((acc, ejercicio) => {
      const tipo = ejercicio.tipo || 'Sin tipo'
      acc[tipo] = (acc[tipo] || 0) + 1
      return acc
    }, {})

    // Ejercicios por intensidad
    const ejerciciosPorIntensidad = ejercicios.reduce((acc, ejercicio) => {
      const intensidad = ejercicio.intensidad || 'Sin intensidad'
      acc[intensidad] = (acc[intensidad] || 0) + 1
      return acc
    }, {})

    // Progreso de clientes
    const clientesUnicos = new Set(progreso.map(p => p.cliente_id)).size
    const totalEjecuciones = progreso.length
    const ejerciciosCompletados = progreso.reduce((total, p) => {
      return total + (p.ejercicios_completados?.length || 0)
    }, 0)
    const ejerciciosPendientes = progreso.reduce((total, p) => {
      return total + (p.ejercicios_pendientes?.length || 0)
    }, 0)

    // 7. Calcular totales generales
    const totalDias = ejerciciosPorSemana.reduce((total, semana) => {
      return total + semana.dias_con_ejercicios
    }, 0)

    const totalEjerciciosProgramados = ejerciciosPorSemana.reduce((total, semana) => {
      return total + semana.total_ejercicios
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        actividad: {
          id: actividad.id,
          title: actividad.title,
          type: actividad.type,
          difficulty: actividad.difficulty,
          price: actividad.price,
          created_at: actividad.created_at
        },
        programacion: {
          total_semanas: totalSemanas,
          total_dias: totalDias,
          total_ejercicios: totalEjercicios,
          total_ejercicios_programados: totalEjerciciosProgramados,
          cantidad_periodos: periodos?.cantidad_periodos || 1
        },
        ejercicios: {
          por_tipo: ejerciciosPorTipo,
          por_intensidad: ejerciciosPorIntensidad,
          por_semana: ejerciciosPorSemana
        },
        clientes: {
          total_clientes: clientesUnicos,
          total_ejecuciones: totalEjecuciones,
          ejercicios_completados: ejerciciosCompletados,
          ejercicios_pendientes: ejerciciosPendientes,
          tasa_completado: totalEjecuciones > 0 ? (ejerciciosCompletados / (ejerciciosCompletados + ejerciciosPendientes) * 100).toFixed(2) : 0
        },
        resumen: {
          es_programa_completo: totalSemanas > 0 && totalDias > 0,
          nivel_dificultad: actividad.difficulty,
          duracion_estimada: `${totalSemanas} semanas`,
          intensidad_promedio: Object.keys(ejerciciosPorIntensidad).length > 0 ? 
            Object.keys(ejerciciosPorIntensidad).reduce((a, b) => 
              ejerciciosPorIntensidad[a] > ejerciciosPorIntensidad[b] ? a : b
            ) : 'Sin datos'
        }
      },
      message: 'Estadísticas obtenidas exitosamente'
    })

  } catch (error) {
    console.error('Error en GET /api/product-statistics:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}






















