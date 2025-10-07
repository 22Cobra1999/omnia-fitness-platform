import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// GET - Obtener progreso de clientes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const actividadId = searchParams.get('actividad_id')
    const clienteId = searchParams.get('cliente_id')
    const fecha = searchParams.get('fecha')

    let query = supabase
      .from('progreso_cliente')
      .select('*')

    if (actividadId) {
      query = query.eq('actividad_id', actividadId)
    }

    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    }

    if (fecha) {
      query = query.eq('fecha', fecha)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo progreso:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo progreso de cliente' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: 'Progreso obtenido exitosamente'
    })

  } catch (error) {
    console.error('Error en GET /api/progreso-cliente:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// POST - Crear/actualizar progreso de cliente
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    const {
      actividad_id,
      cliente_id,
      fecha,
      ejercicios_completados = [],
      ejercicios_pendientes = [],
      detalles_series = {},
      minutos_json = {},
      calorias_json = {}
    } = body

    if (!actividad_id || !cliente_id || !fecha) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id, cliente_id y fecha son requeridos' 
      }, { status: 400 })
    }

    // Verificar si ya existe progreso para esta combinación
    const { data: existingProgress, error: checkError } = await supabase
      .from('progreso_cliente')
      .select('id')
      .eq('actividad_id', actividad_id)
      .eq('cliente_id', cliente_id)
      .eq('fecha', fecha)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando progreso existente:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error verificando progreso existente' 
      }, { status: 500 })
    }

    let result
    if (existingProgress) {
      // Actualizar progreso existente
      const { data, error } = await supabase
        .from('progreso_cliente')
        .update({
          ejercicios_completados,
          ejercicios_pendientes,
          detalles_series,
          minutos_json,
          calorias_json,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando progreso:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Error actualizando progreso' 
        }, { status: 500 })
      }

      result = data
    } else {
      // Crear nuevo progreso
      const { data, error } = await supabase
        .from('progreso_cliente')
        .insert({
          actividad_id,
          cliente_id,
          fecha,
          ejercicios_completados,
          ejercicios_pendientes,
          detalles_series,
          minutos_json,
          calorias_json
        })
        .select()
        .single()

      if (error) {
        console.error('Error creando progreso:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Error creando progreso' 
        }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: existingProgress ? 'Progreso actualizado exitosamente' : 'Progreso creado exitosamente'
    })

  } catch (error) {
    console.error('Error en POST /api/progreso-cliente:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// PUT - Actualizar progreso específico
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID es requerido para actualizar' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('progreso_cliente')
      .update({
        ...updateData,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando progreso:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error actualizando progreso' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Progreso actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error en PUT /api/progreso-cliente:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// DELETE - Eliminar progreso
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID es requerido para eliminar' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('progreso_cliente')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando progreso:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error eliminando progreso' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Progreso eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error en DELETE /api/progreso-cliente:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}






















