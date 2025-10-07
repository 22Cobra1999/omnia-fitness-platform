import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// GET - Obtener planificación de ejercicios
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const actividadId = searchParams.get('actividad_id')
    const numeroSemana = searchParams.get('numero_semana')

    let query = supabase
      .from('planificacion_ejercicios')
      .select('*')

    if (actividadId) {
      query = query.eq('actividad_id', actividadId)
    }

    if (numeroSemana) {
      query = query.eq('numero_semana', numeroSemana)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo planificación:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo planificación de ejercicios' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: 'Planificación obtenida exitosamente'
    })

  } catch (error) {
    console.error('Error en GET /api/planificacion-ejercicios:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// POST - Crear/actualizar planificación de ejercicios
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    const {
      actividad_id,
      numero_semana,
      lunes = {},
      martes = {},
      miercoles = {},
      jueves = {},
      viernes = {},
      sabado = {},
      domingo = {}
    } = body

    if (!actividad_id || !numero_semana) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id y numero_semana son requeridos' 
      }, { status: 400 })
    }

    // Verificar si ya existe una planificación para esta actividad y semana
    const { data: existingPlan, error: checkError } = await supabase
      .from('planificacion_ejercicios')
      .select('id')
      .eq('actividad_id', actividad_id)
      .eq('numero_semana', numero_semana)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando planificación existente:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error verificando planificación existente' 
      }, { status: 500 })
    }

    let result
    if (existingPlan) {
      // Actualizar planificación existente
      const { data, error } = await supabase
        .from('planificacion_ejercicios')
        .update({
          lunes,
          martes,
          miercoles,
          jueves,
          viernes,
          sabado,
          domingo,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', existingPlan.id)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando planificación:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Error actualizando planificación' 
        }, { status: 500 })
      }

      result = data
    } else {
      // Crear nueva planificación
      const { data, error } = await supabase
        .from('planificacion_ejercicios')
        .insert({
          actividad_id,
          numero_semana,
          lunes,
          martes,
          miercoles,
          jueves,
          viernes,
          sabado,
          domingo
        })
        .select()
        .single()

      if (error) {
        console.error('Error creando planificación:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Error creando planificación' 
        }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: existingPlan ? 'Planificación actualizada exitosamente' : 'Planificación creada exitosamente'
    })

  } catch (error) {
    console.error('Error en POST /api/planificacion-ejercicios:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// DELETE - Eliminar planificación
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const actividadId = searchParams.get('actividad_id')
    const numeroSemana = searchParams.get('numero_semana')

    if (!id && (!actividadId || !numeroSemana)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Se requiere id o (actividad_id y numero_semana)' 
      }, { status: 400 })
    }

    let query = supabase.from('planificacion_ejercicios').delete()

    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('actividad_id', actividadId).eq('numero_semana', numeroSemana)
    }

    const { error } = await query

    if (error) {
      console.error('Error eliminando planificación:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error eliminando planificación' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Planificación eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error en DELETE /api/planificacion-ejercicios:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}























