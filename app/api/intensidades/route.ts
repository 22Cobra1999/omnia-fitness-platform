import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

const cookieStore = cookies()

// GET: Obtener intensidades de ejercicios
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ejercicioId = searchParams.get('ejercicio_id')
    const activityId = searchParams.get('activity_id')

    // Construir query base
    let query = supabase
      .from('intensidades')
      .select(`
        *,
        ejercicios_detalles!inner(
          id,
          nombre_ejercicio,
          descripcion,
          tipo,
          activity_id
        )
      `)
      .order('orden', { ascending: true })

    // Aplicar filtros
    if (ejercicioId) {
      query = query.eq('ejercicio_id', ejercicioId)
    }
    if (activityId) {
      query = query.eq('ejercicios_detalles.activity_id', activityId)
    }

    const { data: intensidades, error: intensidadesError } = await query

    if (intensidadesError) {
      console.error('Error fetching intensidades:', intensidadesError)
      return NextResponse.json({ 
        error: 'Error al obtener intensidades', 
        details: intensidadesError.message,
        code: intensidadesError.code 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      intensidades: intensidades || []
    })
  } catch (error) {
    console.error('Error in intensidades get:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST: Crear nueva intensidad
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      ejercicio_id, 
      nombre, 
      orden, 
      reps, 
      series, 
      peso, 
      duracion_minutos, 
      descanso_segundos 
    } = body

    // Validar campos requeridos
    if (!ejercicio_id || !nombre || !orden) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: ejercicio_id, nombre, orden' 
      }, { status: 400 })
    }

    // Verificar que el ejercicio existe
    const { data: ejercicio, error: ejercicioError } = await supabase
      .from('ejercicios_detalles')
      .select('id')
      .eq('id', ejercicio_id)
      .single()

    if (ejercicioError || !ejercicio) {
      return NextResponse.json({ 
        error: 'Ejercicio no encontrado' 
      }, { status: 404 })
    }

    // Crear nueva intensidad
    const { data: nuevaIntensidad, error: createError } = await supabase
      .from('intensidades')
      .insert({
        ejercicio_id,
        nombre,
        orden,
        reps,
        series,
        peso,
        duracion_minutos,
        descanso_segundos,
        created_by: user.id
      })
      .select(`
        *,
        ejercicios_detalles!inner(
          id,
          nombre_ejercicio,
          descripcion,
          tipo
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating intensidad:', createError)
      return NextResponse.json({ 
        error: 'Error al crear intensidad', 
        details: createError.message,
        code: createError.code 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      intensidad: nuevaIntensidad
    })
  } catch (error) {
    console.error('Error in intensidades post:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT: Actualizar intensidad
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      nombre,
      orden,
      reps,
      series,
      peso,
      duracion_minutos,
      descanso_segundos
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de intensidad requerido' }, { status: 400 })
    }

    // Verificar que la intensidad existe
    const { data: intensidad, error: intensidadError } = await supabase
      .from('intensidades')
      .select('id')
      .eq('id', id)
      .single()

    if (intensidadError || !intensidad) {
      return NextResponse.json({ 
        error: 'Intensidad no encontrada' 
      }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (nombre !== undefined) updateData.nombre = nombre
    if (orden !== undefined) updateData.orden = orden
    if (reps !== undefined) updateData.reps = reps
    if (series !== undefined) updateData.series = series
    if (peso !== undefined) updateData.peso = peso
    if (duracion_minutos !== undefined) updateData.duracion_minutos = duracion_minutos
    if (descanso_segundos !== undefined) updateData.descanso_segundos = descanso_segundos

    // Actualizar intensidad
    const { data: intensidadActualizada, error: updateError } = await supabase
      .from('intensidades')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        ejercicios_detalles!inner(
          id,
          nombre_ejercicio,
          descripcion,
          tipo
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating intensidad:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar intensidad', 
        details: updateError.message,
        code: updateError.code 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      intensidad: intensidadActualizada
    })
  } catch (error) {
    console.error('Error in intensidades put:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE: Eliminar intensidad
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const intensidadId = searchParams.get('id')

    if (!intensidadId) {
      return NextResponse.json({ error: 'ID de intensidad requerido' }, { status: 400 })
    }

    // Verificar que la intensidad existe
    const { data: intensidad, error: intensidadError } = await supabase
      .from('intensidades')
      .select('id')
      .eq('id', intensidadId)
      .single()

    if (intensidadError || !intensidad) {
      return NextResponse.json({ 
        error: 'Intensidad no encontrada' 
      }, { status: 404 })
    }

    // Eliminar intensidad
    const { error: deleteError } = await supabase
      .from('intensidades')
      .delete()
      .eq('id', intensidadId)

    if (deleteError) {
      console.error('Error deleting intensidad:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar intensidad' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Intensidad eliminada correctamente'
    })
  } catch (error) {
    console.error('Error in intensidades delete:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

































