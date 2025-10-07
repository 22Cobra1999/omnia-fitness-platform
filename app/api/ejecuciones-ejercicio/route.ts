import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET: Obtener ejecuciones de ejercicios del usuario
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET /api/ejecuciones-ejercicio] INICIO - Nueva petición GET');
    const supabase = await createClient()
    
    // Verificar que supabase.auth existe
    if (!supabase || !supabase.auth) {
      console.error('❌ [GET /api/ejecuciones-ejercicio] Error: supabase.auth no está disponible');
      return NextResponse.json({ error: 'Error de configuración de autenticación' }, { status: 500 })
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔍 [GET /api/ejecuciones-ejercicio] Usuario obtenido:', user?.id || 'No usuario');
    
    if (authError || !user) {
      console.error('❌ [GET /api/ejecuciones-ejercicio] Error de autenticación:', authError);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const idsCsv = searchParams.get('ids')
    const ejercicioId = searchParams.get('ejercicio_id')
    const completado = searchParams.get('completado')
    const fecha = searchParams.get('fecha')
    console.log('🔎 [GET /api/ejecuciones-ejercicio] params:', { id, idsCsv, ejercicioId, completado, fecha, userId: user.id })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(supabaseUrl, serviceKey)

    let query = admin
      .from('ejecuciones_ejercicio')
      .select('id, ejercicio_id, periodo_id, completado, fecha_ejercicio, updated_at, completed_at, client_id')
      .eq('client_id', user.id)

    if (id) query = query.eq('id', Number(id))
    if (idsCsv) {
      const parsed = idsCsv.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n))
      if (parsed.length) query = query.in('id', parsed)
    }
    if (ejercicioId) query = query.eq('ejercicio_id', Number(ejercicioId))
    if (completado !== null) query = query.eq('completado', completado === 'true')
    if (fecha) {
      const start = `${fecha}T00:00:00.000Z`
      const endDate = new Date(`${fecha}T00:00:00Z`)
      endDate.setUTCDate(endDate.getUTCDate() + 1)
      const end = endDate.toISOString()
      query = query.gte('fecha_ejercicio', start).lt('fecha_ejercicio', end)
    }

    const { data, error } = await query.order('fecha_ejercicio', { ascending: false })
    if (error) {
      console.error('❌ [GET /api/ejecuciones-ejercicio] error:', error)
      return NextResponse.json({ success: true, ejecuciones: [] })
    }

    const rows = (data || []).map((r: any) => ({ ...r, client_id: undefined }))
    console.log('✅ [GET /api/ejecuciones-ejercicio] rows:', rows.length)
    return NextResponse.json({ success: true, ejecuciones: rows })
  } catch (error) {
    console.error('Error in ejecuciones get:', error)
    return NextResponse.json({ success: true, ejecuciones: [] })
  }
}

// POST: Crear nueva ejecución de ejercicio
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      periodo_id, 
      ejercicio_id, 
      intensidad_aplicada, 
      duracion, 
      calorias_estimadas, 
      fecha_ejecucion,
      peso_usado,
      repeticiones_realizadas,
      series_completadas,
      tiempo_real_segundos,
      nota_cliente
    } = body

    // Validar campos requeridos
    if (!periodo_id || !ejercicio_id || !intensidad_aplicada) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: periodo_id, ejercicio_id, intensidad_aplicada' 
      }, { status: 400 })
    }

    // Verificar que el período pertenece al usuario
    const { data: periodo, error: periodoError } = await supabase
      .from('periodos_asignados')
      .select(`
        id,
        activity_enrollments!inner(
          client_id
        )
      `)
      .eq('id', periodo_id)
      .eq('activity_enrollments.client_id', user.id)
      .single()

    if (periodoError || !periodo) {
      return NextResponse.json({ 
        error: 'Período no encontrado o no autorizado' 
      }, { status: 404 })
    }

    // Crear nueva ejecución
    const { data: nuevaEjecucion, error: createError } = await supabase
      .from('ejecuciones_ejercicio')
      .insert({
        periodo_id,
        ejercicio_id,
        intensidad_aplicada,
        duracion,
        calorias_estimadas,
        fecha_ejecucion: fecha_ejecucion || new Date().toISOString().split('T')[0],
        completado: false,
        peso_usado,
        repeticiones_realizadas,
        series_completadas,
        tiempo_real_segundos,
        nota_cliente
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
      console.error('Error creating ejecucion:', createError)
      return NextResponse.json({ 
        error: 'Error al crear ejecución', 
        details: createError.message,
        code: createError.code 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ejecucion: nuevaEjecucion
    })
  } catch (error) {
    console.error('Error in ejecuciones post:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT: Actualizar ejecución de ejercicio
export async function PUT(request: NextRequest) {
  try {
    console.log('🔥 [PUT /api/ejecuciones-ejercicio] INICIO - Nueva petición recibida');
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ [PUT /api/ejecuciones-ejercicio] Error de autenticación:', authError);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('✅ [PUT /api/ejecuciones-ejercicio] Usuario autenticado:', user.id);
    const body = await request.json()
    console.log('📥 [PUT /api/ejecuciones-ejercicio] payload completo:', body)
    const { 
      id,
      intensidad_aplicada,
      duracion,
      calorias_estimadas,
      completado,
      peso_usado,
      repeticiones_realizadas,
      series_completadas,
      tiempo_real_segundos,
      nota_cliente,
      nota_coach
    } = body

    if (!id) {
      console.error('❌ [PUT /api/ejecuciones-ejercicio] ID de ejecución requerido');
      return NextResponse.json({ error: 'ID de ejecución requerido' }, { status: 400 })
    }

    console.log(`🔍 [PUT /api/ejecuciones-ejercicio] Buscando ejecución con ID: ${id} para usuario: ${user.id}`);
    
    // Usar admin client (service role) y verificar pertenencia con client_id directo
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      console.error('❌ [PUT /api/ejecuciones-ejercicio] Configuración faltante');
      return NextResponse.json({ error: 'Config faltante', details: 'SUPABASE_SERVICE_ROLE_KEY/URL' }, { status: 500 })
    }
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(supabaseUrl, serviceKey)

    console.log(`🔍 [PUT /api/ejecuciones-ejercicio] Ejecutando query para buscar ejecución...`);
    const { data: execRow, error: execErr } = await admin
      .from('ejecuciones_ejercicio')
      .select('id, client_id, ejercicio_id, completado, fecha_ejercicio')
      .eq('id', id)
      .single()
    
    console.log(`🔍 [PUT /api/ejecuciones-ejercicio] Resultado de búsqueda:`, { execRow, execErr });
    
    if (execErr) {
      console.error('❌ [PUT /api/ejecuciones-ejercicio] Error buscando ejecución:', execErr);
      return NextResponse.json({ 
        error: 'Error buscando ejecución', 
        details: execErr.message,
        code: execErr.code 
      }, { status: 404 })
    }
    
    if (!execRow) {
      console.error('❌ [PUT /api/ejecuciones-ejercicio] Ejecución no encontrada');
      return NextResponse.json({ error: 'Ejecución no encontrada' }, { status: 404 })
    }
    
    if (execRow.client_id !== user.id) {
      console.error('❌ [PUT /api/ejecuciones-ejercicio] Usuario no autorizado. Ejecución pertenece a:', execRow.client_id, 'pero usuario es:', user.id);
      return NextResponse.json({ error: 'No autorizado para actualizar esta ejecución' }, { status: 403 })
    }

    console.log('✅ [PUT /api/ejecuciones-ejercicio] Ejecución encontrada y autorizada:', execRow);

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    console.log(`📝 [PUT /api/ejecuciones-ejercicio] Preparando datos de actualización...`);
    console.log(`📝 [PUT /api/ejecuciones-ejercicio] Estado actual de la ejecución:`, execRow);

    if (intensidad_aplicada !== undefined) updateData.intensidad_aplicada = intensidad_aplicada
    if (duracion !== undefined) updateData.duracion = duracion
    if (calorias_estimadas !== undefined) updateData.calorias_estimadas = calorias_estimadas
    if (completado !== undefined) {
      updateData.completado = completado
      if (completado) {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }
      console.log(`🔄 [PUT /api/ejecuciones-ejercicio] Cambiando estado de completado: ${execRow.completado} → ${completado}`);
    }
    if (peso_usado !== undefined) updateData.peso_usado = peso_usado
    if (repeticiones_realizadas !== undefined) updateData.repeticiones_realizadas = repeticiones_realizadas
    if (series_completadas !== undefined) updateData.series_completadas = series_completadas
    if (tiempo_real_segundos !== undefined) updateData.tiempo_real_segundos = tiempo_real_segundos
    if (nota_cliente !== undefined) updateData.nota_cliente = nota_cliente
    if (nota_coach !== undefined) updateData.nota_coach = nota_coach

    console.log(`📝 [PUT /api/ejecuciones-ejercicio] Datos a actualizar:`, updateData);

    // Actualizar ejecución (admin)
    console.log(`🔄 [PUT /api/ejecuciones-ejercicio] Ejecutando UPDATE en base de datos...`);
    const { data: ejecucionActualizada, error: updateError } = await admin
      .from('ejecuciones_ejercicio')
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

    console.log(`🔄 [PUT /api/ejecuciones-ejercicio] Resultado del UPDATE:`, { ejecucionActualizada, updateError });

    if (updateError) {
      console.error('❌ [PUT /api/ejecuciones-ejercicio] Error al actualizar ejecución:', updateError);
      return NextResponse.json({ error: 'Error al actualizar ejecución', details: updateError.message }, { status: 500 })
    }

    console.log('✅ [PUT /api/ejecuciones-ejercicio] Ejecución actualizada correctamente:', ejecucionActualizada);

    return NextResponse.json({
      success: true,
      ejecucion: ejecucionActualizada
    })
  } catch (error) {
    console.error('Error in ejecuciones put:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE: Eliminar ejecución de ejercicio
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ejecucionId = searchParams.get('id')

    if (!ejecucionId) {
      return NextResponse.json({ error: 'ID de ejecución requerido' }, { status: 400 })
    }

    // Verificar que la ejecución pertenece al usuario
    const { data: ejecucion, error: ejecucionError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        periodos_asignados!inner(
          activity_enrollments!inner(
            client_id
          )
        )
      `)
      .eq('id', ejecucionId)
      .eq('periodos_asignados.activity_enrollments.client_id', user.id)
      .single()

    if (ejecucionError || !ejecucion) {
      return NextResponse.json({ 
        error: 'Ejecución no encontrada o no autorizada' 
      }, { status: 404 })
    }

    // Eliminar ejecución
    const { error: deleteError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .eq('id', ejecucionId)

    if (deleteError) {
      console.error('Error deleting ejecucion:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar ejecución' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Ejecución eliminada correctamente'
    })
  } catch (error) {
    console.error('Error in ejecuciones delete:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}































