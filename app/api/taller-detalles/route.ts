import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

// Hacer la ruta dinámica para evitar evaluación durante el build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getSupabaseClients() {
  return {
    service: createServiceRoleClient(),
    anon: await createRouteHandlerClient()
  }
}

const isInvalidApiKeyError = (err: any) => {
  const msg = String(err?.message || '')
  return msg.toLowerCase().includes('invalid api key')
}

export async function GET(request: NextRequest) {
  try {
    const { service, anon } = await getSupabaseClients()
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
    const runQuery = async (sb: any) =>
      sb
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

    let { data: tallerDetalles, error } = await runQuery(service || anon)
    if (error && service && isInvalidApiKeyError(error)) {
      console.warn('⚠️ [taller-detalles] Invalid service role key; retrying with anon client')
      ;({ data: tallerDetalles, error } = await runQuery(anon))
    }

    if (error) {
      console.error('❌ Error consultando taller_detalles:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint
      })
      return NextResponse.json(
        {
          error: 'Error consultando datos del taller',
          details: error.message,
          code: (error as any).code,
          hint: (error as any).hint
        },
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
    const { service, anon } = await getSupabaseClients()
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
    const runInsert = async (sb: any) =>
      sb
        .from('taller_detalles')
        .insert({
          actividad_id: parseInt(actividad_id),
          nombre,
          descripcion: descripcion || '',
          originales: originales || { fechas_horarios: [] }
        })
        .select()

    let { data, error } = await runInsert(service || anon)
    if (error && service && isInvalidApiKeyError(error)) {
      console.warn('⚠️ [taller-detalles] Invalid service role key; retrying with anon client')
      ;({ data, error } = await runInsert(anon))
    }

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
    const { service, anon } = await getSupabaseClients()
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
    const runUpdate = async (sb: any) =>
      sb
        .from('taller_detalles')
        .update({
          nombre,
          descripcion,
          originales,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()

    let { data, error } = await runUpdate(service || anon)
    if (error && service && isInvalidApiKeyError(error)) {
      console.warn('⚠️ [taller-detalles] Invalid service role key; retrying with anon client')
      ;({ data, error } = await runUpdate(anon))
    }

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
    const { service, anon } = await getSupabaseClients()
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
    const runDelete = async (sb: any) =>
      sb
        .from('taller_detalles')
        .delete()
        .eq('id', id)

    let { error } = await runDelete(service || anon)
    if (error && service && isInvalidApiKeyError(error)) {
      console.warn('⚠️ [taller-detalles] Invalid service role key; retrying with anon client')
      ;({ error } = await runDelete(anon))
    }

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
