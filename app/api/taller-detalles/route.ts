import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hacer la ruta dinámica para evitar evaluación durante el build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const actividadId = searchParams.get('actividad_id')

    if (!actividadId) {
      return NextResponse.json(
        { error: 'actividad_id es requerido' },
        { status: 400 }
      )
    }

    console.log('📡 Cargando datos de taller desde el backend para activityId:', actividadId)

    // Consultar datos de taller para la actividad específica
    const { data: tallerDetalles, error } = await supabase
      .from('taller_detalles')
      .select(`
        id,
        actividad_id,
        nombre,
        descripcion,
        originales,
        activo,
        pdf_url,
        pdf_file_name,
        created_at,
        updated_at
      `)
      .eq('actividad_id', parseInt(actividadId))
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Error consultando taller_detalles:', error)
      return NextResponse.json(
        { error: 'Error consultando datos del taller', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Datos de taller cargados exitosamente:', tallerDetalles?.length || 0, 'temas')

    // Transformar datos al formato esperado por el frontend
    const transformedData = {
      success: true,
      data: tallerDetalles || [],
      count: tallerDetalles?.length || 0
    }

    return NextResponse.json(transformedData)

  } catch (error: any) {
    console.error('❌ Error en taller-detalles GET:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { actividad_id, nombre, descripcion, originales, secundarios } = body

    if (!actividad_id || !nombre) {
      return NextResponse.json(
        { error: 'actividad_id y nombre son requeridos' },
        { status: 400 }
      )
    }

    console.log('📝 Creando nuevo tema de taller para actividad:', actividad_id)

    // Insertar nuevo tema de taller
    const { data, error } = await supabase
      .from('taller_detalles')
      .insert({
        actividad_id: parseInt(actividad_id),
        nombre,
        descripcion: descripcion || '',
        originales: originales || { fechas_horarios: [] }
      })
      .select()

    if (error) {
      console.error('❌ Error creando tema de taller:', error)
      return NextResponse.json(
        { error: 'Error creando tema de taller', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Tema de taller creado exitosamente:', data?.[0]?.id)

    return NextResponse.json({
      success: true,
      data: data?.[0]
    })

  } catch (error: any) {
    console.error('❌ Error en taller-detalles POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { id, nombre, descripcion, originales, secundarios } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      )
    }

    console.log('📝 Actualizando tema de taller:', id)

    // Actualizar tema de taller
    const { data, error } = await supabase
      .from('taller_detalles')
      .update({
        nombre,
        descripcion,
        originales,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('❌ Error actualizando tema de taller:', error)
      return NextResponse.json(
        { error: 'Error actualizando tema de taller', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Tema de taller actualizado exitosamente:', data?.[0]?.id)

    return NextResponse.json({
      success: true,
      data: data?.[0]
    })

  } catch (error: any) {
    console.error('❌ Error en taller-detalles PUT:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      )
    }

    console.log('🗑️ Eliminando tema de taller:', id)

    // Eliminar tema de taller
    const { error } = await supabase
      .from('taller_detalles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error eliminando tema de taller:', error)
      return NextResponse.json(
        { error: 'Error eliminando tema de taller', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Tema de taller eliminado exitosamente:', id)

    return NextResponse.json({
      success: true,
      message: 'Tema de taller eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('❌ Error en taller-detalles DELETE:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
