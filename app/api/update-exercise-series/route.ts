import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../../../lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { ejercicioId, bloque, orden, fecha, series } = await request.json()
    
    if (!ejercicioId || !bloque || !orden || !series || !Array.isArray(series)) {
      return NextResponse.json({ error: 'Parámetros requeridos: ejercicioId, bloque, orden, fecha, series (array)' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user

    // Obtener el registro de progreso para la fecha especificada o hoy
    const targetDate = fecha || new Date().toISOString().split('T')[0]

    // ✅ Regla de negocio: solo permitir editar hoy o fechas futuras
    const today = new Date()
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const [year, month, day] = targetDate.split('-').map(Number)
    const targetLocal = new Date(year, (month || 1) - 1, day || 1)

    if (targetLocal < todayLocal) {
      return NextResponse.json(
        { error: 'Solo podés editar las series de hoy o de días futuros. Los días pasados no se pueden modificar.' },
        { status: 403 }
      )
    }
    const { data: progressRecord, error: progressError } = await supabase
      .from('progreso_cliente')
      .select('id, detalles_series')
      .eq('cliente_id', user.id)
      .eq('fecha', targetDate)
      .single()

    if (progressError || !progressRecord) {
      console.error('Error obteniendo progreso:', progressError)
      return NextResponse.json({ error: `No se encontró registro de progreso para ${targetDate}` }, { status: 404 })
    }

    // Parsear detalles_series
    const detallesSeries = progressRecord.detalles_series 
      ? (typeof progressRecord.detalles_series === 'string' 
          ? JSON.parse(progressRecord.detalles_series) 
          : progressRecord.detalles_series)
      : {}

    // Buscar el key exacto en detalles_series que coincida con ejercicio_id, bloque y orden
    const ejercicioKey = `${ejercicioId}_${orden}`
    
    if (!detallesSeries[ejercicioKey]) {
      console.error('❌ Ejercicio no encontrado en detalles_series')
      console.error('🔍 Buscando ejercicio:', { ejercicioId, bloque, orden, ejercicioKey })
      console.error('🔍 Keys disponibles en detalles_series:', Object.keys(detallesSeries))
      return NextResponse.json({ error: 'Ejercicio no encontrado en detalles_series' }, { status: 404 })
    }

    // Convertir el array de series al formato string: "(reps-peso-series);(reps-peso-series);..."
    const detalleSeriesString = series
      .map((s: { reps: string, kg: string, series: string }) => {
        const reps = s.reps || '0'
        const kg = s.kg || '0'
        const seriesCount = s.series || '0'
        return `(${reps}-${kg}-${seriesCount})`
      })
      .join(';')

    // Actualizar el detalle_series para este ejercicio específico
    detallesSeries[ejercicioKey] = {
      ...detallesSeries[ejercicioKey],
      detalle_series: detalleSeriesString
    }

    // Actualizar el registro de progreso
    const { error: updateError } = await supabase
      .from('progreso_cliente')
      .update({
        detalles_series: detallesSeries,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', progressRecord.id)

    if (updateError) {
      console.error('Error actualizando series:', updateError)
      return NextResponse.json({ error: 'Error actualizando series' }, { status: 500 })
    }

    console.log(`✅ Series actualizadas para ejercicio ${ejercicioId} (bloque: ${bloque}, orden: ${orden}) en fecha ${targetDate}`)

    // ✅ Nueva lógica: propagar los últimos valores a días futuros del mismo cliente
    try {
      const { data: futureRecords, error: futureError } = await supabase
        .from('progreso_cliente')
        .select('id, fecha, detalles_series')
        .eq('cliente_id', user.id)
        .gt('fecha', targetDate)

      if (futureError) {
        console.error('Error buscando registros futuros para propagar series:', futureError)
      } else if (futureRecords && futureRecords.length > 0) {
        console.log(`🔄 Propagando series actualizadas a ${futureRecords.length} días futuros`)

        for (const record of futureRecords) {
          const recordDetallesSeries = record.detalles_series
            ? (typeof record.detalles_series === 'string'
                ? JSON.parse(record.detalles_series)
                : record.detalles_series)
            : {}

          if (!recordDetallesSeries[ejercicioKey]) {
            continue
          }

          recordDetallesSeries[ejercicioKey] = {
            ...recordDetallesSeries[ejercicioKey],
            detalle_series: detalleSeriesString
          }

          const { error: propagateError } = await supabase
            .from('progreso_cliente')
            .update({
              detalles_series: recordDetallesSeries,
              fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', record.id)

          if (propagateError) {
            console.error(
              `Error propagando series al registro de fecha ${record.fecha} (id ${record.id}):`,
              propagateError
            )
          }
        }
      }
    } catch (propagationError) {
      console.error('Error general al propagar series a días futuros:', propagationError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Series actualizadas exitosamente',
      ejercicioId,
      bloque,
      orden,
      detalle_series: detalleSeriesString
    })

  } catch (error) {
    console.error('Error en update-exercise-series:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}















