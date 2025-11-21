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

    console.log(`✅ Series actualizadas para ejercicio ${ejercicioId} (bloque: ${bloque}, orden: ${orden})`)

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









