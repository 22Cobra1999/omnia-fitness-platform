import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actividadId = searchParams.get('actividad_id')
    
    if (!actividadId) {
      return NextResponse.json(
        { success: false, error: 'ID de actividad requerido' },
        { status: 400 }
      )
    }
    
    console.log('📡 GET /api/taller-detalles - Obteniendo detalles para actividad:', actividadId)
    
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    
    // Obtener detalles del taller
    console.log('🔍 Consultando tabla taller_detalles para actividad_id:', actividadId)
    
    const { data: tallerDetalles, error } = await supabase
      .from('taller_detalles')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Error al obtener detalles del taller:', error)
      console.error('❌ Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { success: false, error: `Error al obtener detalles: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Detalles del taller obtenidos:', {
      cantidad: tallerDetalles?.length || 0,
      temas: tallerDetalles?.map(t => t.nombre) || [],
      rawData: tallerDetalles
    })
    
    return NextResponse.json({
      success: true,
      data: tallerDetalles || []
    })
    
  } catch (error) {
    console.error('💥 Error en GET /api/taller-detalles:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/taller-detalles - Creando nuevo detalle de taller')
    
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Validar datos requeridos
    if (!body.actividad_id || !body.nombre) {
      return NextResponse.json(
        { success: false, error: 'actividad_id y nombre son requeridos' },
        { status: 400 }
      )
    }
    
    // Insertar nuevo detalle de taller
    const { data: nuevoDetalle, error } = await supabase
      .from('taller_detalles')
      .insert({
        actividad_id: body.actividad_id,
        nombre: body.nombre,
        descripcion: body.descripcion || '',
        originales: body.originales || { fechas_horarios: [] }
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creando detalle de taller:', error)
      return NextResponse.json(
        { success: false, error: `Error al crear detalle: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Detalle de taller creado:', nuevoDetalle.id)
    
    return NextResponse.json({
      success: true,
      data: nuevoDetalle
    })
    
  } catch (error) {
    console.error('💥 Error en POST /api/taller-detalles:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 PUT /api/taller-detalles - Actualizando detalle de taller')
    
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Validar datos requeridos
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID del detalle es requerido' },
        { status: 400 }
      )
    }
    
    // Actualizar detalle de taller
    const { data: detalleActualizado, error } = await supabase
      .from('taller_detalles')
      .update({
        nombre: body.nombre,
        descripcion: body.descripcion,
        originales: body.originales,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error actualizando detalle de taller:', error)
      return NextResponse.json(
        { success: false, error: `Error al actualizar detalle: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Detalle de taller actualizado:', detalleActualizado.id)
    
    return NextResponse.json({
      success: true,
      data: detalleActualizado
    })
    
  } catch (error) {
    console.error('💥 Error en PUT /api/taller-detalles:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/taller-detalles - Eliminando detalle de taller')
    
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const detalleId = searchParams.get('id')
    
    if (!detalleId) {
      return NextResponse.json(
        { success: false, error: 'ID del detalle es requerido' },
        { status: 400 }
      )
    }
    
    // Eliminar detalle de taller
    const { error } = await supabase
      .from('taller_detalles')
      .delete()
      .eq('id', detalleId)
    
    if (error) {
      console.error('❌ Error eliminando detalle de taller:', error)
      return NextResponse.json(
        { success: false, error: `Error al eliminar detalle: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Detalle de taller eliminado:', detalleId)
    
    return NextResponse.json({
      success: true,
      message: 'Detalle eliminado correctamente'
    })
    
  } catch (error) {
    console.error('💥 Error en DELETE /api/taller-detalles:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}
