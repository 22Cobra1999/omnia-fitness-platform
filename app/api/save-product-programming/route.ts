import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// POST - Guardar programación completa de un producto
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    const {
      actividad_id,
      semanas_programacion, // Array de semanas con ejercicios por día
      cantidad_periodos = 1
    } = body

    if (!actividad_id || !semanas_programacion || !Array.isArray(semanas_programacion)) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id y semanas_programacion son requeridos' 
      }, { status: 400 })
    }

    console.log('💾 Guardando programación para actividad:', actividad_id)
    console.log('📅 Semanas a programar:', semanas_programacion.length)
    console.log('🔄 Períodos:', cantidad_periodos)

    // 1. Guardar/actualizar períodos
    const { data: periodData, error: periodError } = await supabase
      .from('periodos')
      .upsert({
        actividad_id,
        cantidad_periodos
      }, {
        onConflict: 'actividad_id'
      })
      .select()
      .single()

    if (periodError) {
      console.error('Error guardando períodos:', periodError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error guardando períodos' 
      }, { status: 500 })
    }

    // 2. Guardar programación de ejercicios por semana
    const planificaciones = []
    
    for (let i = 0; i < semanas_programacion.length; i++) {
      const semana = semanas_programacion[i]
      const numeroSemana = i + 1
      
      // Preparar datos de la semana
      const semanaData = {
        actividad_id,
        numero_semana: numeroSemana,
        lunes: semana.lunes || {},
        martes: semana.martes || {},
        miercoles: semana.miercoles || {},
        jueves: semana.jueves || {},
        viernes: semana.viernes || {},
        sabado: semana.sabado || {},
        domingo: semana.domingo || {}
      }

      // Guardar/actualizar planificación de la semana
      const { data: planificacionData, error: planificacionError } = await supabase
        .from('planificacion_ejercicios')
        .upsert(semanaData, {
          onConflict: 'actividad_id,numero_semana'
        })
        .select()
        .single()

      if (planificacionError) {
        console.error(`Error guardando planificación semana ${numeroSemana}:`, planificacionError)
        return NextResponse.json({ 
          success: false, 
          error: `Error guardando planificación semana ${numeroSemana}` 
        }, { status: 500 })
      }

      planificaciones.push(planificacionData)
    }

    // 3. Obtener resumen de la programación guardada
    const { data: savedPlanificaciones, error: summaryError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', actividad_id)
      .order('numero_semana')

    if (summaryError) {
      console.error('Error obteniendo resumen:', summaryError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo resumen de programación' 
      }, { status: 500 })
    }

    // 4. Calcular estadísticas
    const totalSemanas = savedPlanificaciones.length
    const totalEjercicios = savedPlanificaciones.reduce((total, semana) => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      return total + dias.reduce((diaTotal, dia) => {
        const ejercicios = semana[dia]?.ejercicios || []
        return diaTotal + ejercicios.length
      }, 0)
    }, 0)

    const totalDias = savedPlanificaciones.reduce((total, semana) => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      return total + dias.filter(dia => {
        const ejercicios = semana[dia]?.ejercicios || []
        return ejercicios.length > 0
      }).length
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        actividad_id,
        periodos: periodData,
        planificaciones: savedPlanificaciones,
        estadisticas: {
          total_semanas: totalSemanas,
          total_dias: totalDias,
          total_ejercicios: totalEjercicios,
          cantidad_periodos: cantidad_periodos
        }
      },
      message: `Programación guardada exitosamente: ${totalSemanas} semanas, ${totalDias} días, ${totalEjercicios} ejercicios`
    })

  } catch (error) {
    console.error('Error en POST /api/save-product-programming:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// GET - Obtener programación completa de un producto
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

    // Obtener períodos
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

    // Obtener planificaciones
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

    // Calcular estadísticas
    const totalSemanas = planificaciones.length
    const totalEjercicios = planificaciones.reduce((total, semana) => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      return total + dias.reduce((diaTotal, dia) => {
        const ejercicios = semana[dia]?.ejercicios || []
        return diaTotal + ejercicios.length
      }, 0)
    }, 0)

    const totalDias = planificaciones.reduce((total, semana) => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      return total + dias.filter(dia => {
        const ejercicios = semana[dia]?.ejercicios || []
        return ejercicios.length > 0
      }).length
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        actividad_id: actividadId,
        periodos: periodos || null,
        planificaciones: planificaciones || [],
        estadisticas: {
          total_semanas: totalSemanas,
          total_dias: totalDias,
          total_ejercicios: totalEjercicios,
          cantidad_periodos: periodos?.cantidad_periodos || 1
        }
      },
      message: 'Programación obtenida exitosamente'
    })

  } catch (error) {
    console.error('Error en GET /api/save-product-programming:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}






















