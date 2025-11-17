import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../../../lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { executionId, bloque, orden, fecha } = await request.json()
    
    if (!executionId) {
      return NextResponse.json({ error: 'executionId requerido' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user

    // Obtener el registro de progreso para la fecha especificada o hoy
    const targetDate = fecha || new Date().toISOString().split('T')[0]
    const { data: progressRecord, error: progressError } = await supabase
      .from('progreso_cliente')
      .select('id, ejercicios_completados, ejercicios_pendientes, actividad_id, detalles_series')
      .eq('cliente_id', user.id)
      .eq('fecha', targetDate)
      .single()

    if (progressError || !progressRecord) {
      console.error('Error obteniendo progreso:', progressError)
      return NextResponse.json({ error: `No se encontró registro de progreso para ${targetDate}` }, { status: 404 })
    }

    // Parsear objetos de ejercicios (nuevo formato)
    const completados = progressRecord.ejercicios_completados 
      ? (typeof progressRecord.ejercicios_completados === 'string' 
          ? JSON.parse(progressRecord.ejercicios_completados) 
          : progressRecord.ejercicios_completados)
      : {}
    const pendientes = progressRecord.ejercicios_pendientes 
      ? (typeof progressRecord.ejercicios_pendientes === 'string' 
          ? JSON.parse(progressRecord.ejercicios_pendientes) 
          : progressRecord.ejercicios_pendientes)
      : {}
    const detallesSeries = progressRecord.detalles_series 
      ? (typeof progressRecord.detalles_series === 'string' 
          ? JSON.parse(progressRecord.detalles_series) 
          : progressRecord.detalles_series)
      : {}

    const ejercicioId = parseInt(executionId)
    
    // Buscar el key exacto en detalles_series que coincida con ejercicio_id, bloque y orden
    let ejercicioKey = null
    for (const key of Object.keys(detallesSeries)) {
      const detalle = detallesSeries[key]
      if (detalle && 
          detalle.ejercicio_id === ejercicioId && 
          detalle.bloque === bloque &&
          detalle.orden === orden) {
        ejercicioKey = key
        break
      }
    }

    if (!ejercicioKey) {
      console.error('❌ Ejercicio no encontrado en detalles_series')
      console.error('🔍 Buscando ejercicio:', { ejercicioId, bloque, orden })
      console.error('🔍 Keys disponibles en detalles_series:', Object.keys(detallesSeries))
      console.error('🔍 Detalles_series completo:', detallesSeries)
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }
    
    // Verificar si está en completados o pendientes usando el key único
    const isCompleted = ejercicioKey in completados
    const isPending = ejercicioKey in pendientes

    let newCompletados = { ...completados }
    let newPendientes = { ...pendientes }

    if (isCompleted) {
      // Mover de completados a pendientes
      delete newCompletados[ejercicioKey]
      newPendientes[ejercicioKey] = pendientes[ejercicioKey] || {}
    } else if (isPending) {
      // Mover de pendientes a completados
      delete newPendientes[ejercicioKey]
      newCompletados[ejercicioKey] = completados[ejercicioKey] || {}
    } else {
      // Si no está en ninguna lista, agregarlo como completado
      newCompletados[ejercicioKey] = {}
    }

    // Actualizar el registro de progreso (detalles_series NO cambia)
    const { error: updateError } = await supabase
      .from('progreso_cliente')
      .update({
        ejercicios_completados: newCompletados,
        ejercicios_pendientes: newPendientes,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', progressRecord.id)

    if (updateError) {
      console.error('Error actualizando progreso:', updateError)
      return NextResponse.json({ error: 'Error actualizando progreso' }, { status: 500 })
    }

    console.log(`✅ Ejercicio ${ejercicioId} (bloque: ${bloque}, orden: ${orden}) toggleado: ${isCompleted ? 'completado → pendiente' : 'pendiente → completado'}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Ejercicio actualizado exitosamente',
      ejercicioId,
      bloque,
      orden,
      isCompleted: !isCompleted
    })

  } catch (error) {
    console.error('Error en toggle-exercise:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
