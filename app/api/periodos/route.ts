import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// GET - Obtener períodos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const actividadId = searchParams.get('actividad_id')

    let query = supabase
      .from('periodos')
      .select('*')

    if (actividadId) {
      query = query.eq('actividad_id', actividadId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo períodos:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo períodos' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: 'Períodos obtenidos exitosamente'
    })

  } catch (error) {
    console.error('Error en GET /api/periodos:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// POST - Crear/actualizar períodos
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    const {
      actividad_id,
      cantidad_periodos
    } = body

    if (!actividad_id || !cantidad_periodos) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id y cantidad_periodos son requeridos' 
      }, { status: 400 })
    }

    // Verificar si ya existe un período para esta actividad
    const { data: existingPeriod, error: checkError } = await supabase
      .from('periodos')
      .select('id')
      .eq('actividad_id', actividad_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando período existente:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error verificando período existente' 
      }, { status: 500 })
    }

    let result
    if (existingPeriod) {
      // Actualizar período existente
      const { data, error } = await supabase
        .from('periodos')
        .update({
          cantidad_periodos,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', existingPeriod.id)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando período:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Error actualizando período' 
        }, { status: 500 })
      }

      result = data
    } else {
      // Crear nuevo período
      const { data, error } = await supabase
        .from('periodos')
        .insert({
          actividad_id,
          cantidad_periodos
        })
        .select()
        .single()

      if (error) {
        console.error('Error creando período:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Error creando período' 
        }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: existingPeriod ? 'Período actualizado exitosamente' : 'Período creado exitosamente'
    })

  } catch (error) {
    console.error('Error en POST /api/periodos:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// DELETE - Eliminar período
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const actividadId = searchParams.get('actividad_id')

    if (!id && !actividadId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Se requiere id o actividad_id' 
      }, { status: 400 })
    }

    let query = supabase.from('periodos').delete()

    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('actividad_id', actividadId)
    }

    const { error } = await query

    if (error) {
      console.error('Error eliminando período:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error eliminando período' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Período eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error en DELETE /api/periodos:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}






















