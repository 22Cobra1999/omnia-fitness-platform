import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../../../lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ejercicioId, bloque, orden, fecha, series, activityId, propagateAlways, adjustedKcal, adjustedMin } = body

    console.log('🚀 [API update-exercise-series] Incoming:', { ejercicioId, activityId, fecha, seriesCount: series?.length, propagateAlways, adjustedKcal, adjustedMin })

    if (!ejercicioId || !activityId || !fecha) {
      console.warn('❌ [API update-exercise-series] Missing params:', { ejercicioId, activityId, fecha })
      return NextResponse.json({ error: 'Faltan parámetros: ejercicioId, activityId y fecha son obligatorios', received: { ejercicioId, activityId, fecha } }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user
    const targetDate = fecha
    const bloqueNum = Number(bloque)
    const ordenNum = Number(orden)

    // 1. Localizar el registro de progreso para este día
    let { data: progressRecords, error: progressError } = await supabase
      .from('progreso_cliente')
      .select('id, detalles_series, ejercicios_pendientes, ejercicios_completados, peso, series, reps')
      .eq('cliente_id', user.id)
      .eq('actividad_id', activityId)
      .eq('fecha', targetDate)
      .order('id', { ascending: false })

    let progressRecord = progressRecords?.[0]

    // 2. SI NO EXISTE EL REGISTRO, CREARLO (Self-healing)
    if (!progressRecord) {
      console.log(`ℹ️ [API update-exercise-series] No se encontró registro para ${targetDate}. Intentando crear uno nuevo...`)

      // Obtener el enrollment para saber cuándo empezó
      const { data: enrollment } = await supabase
        .from('activity_enrollments')
        .select('id, start_date')
        .eq('client_id', user.id)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!enrollment) {
        console.warn('❌ [API update-exercise-series] No registration found for client:', user.id, 'activity:', activityId)
        return NextResponse.json({ error: 'No se encontró inscripción activa para esta actividad' }, { status: 404 })
      }

      // Calcular qué semana del ciclo es
      const start = new Date(enrollment.start_date)
      const current = new Date(targetDate)
      const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const totalWeekNumber = Math.floor(diffDays / 7) + 1

      // Obtener max semanas de planificación
      const { data: allPlan } = await supabase
        .from('planificacion_ejercicios')
        .select('numero_semana')
        .eq('actividad_id', activityId)
        .order('numero_semana', { ascending: false })
        .limit(1)
      const maxSemanas = allPlan?.[0]?.numero_semana || 1
      const weekInCycle = ((totalWeekNumber - 1) % maxSemanas) + 1

      const diasMap: Record<number, string> = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' }
      const diaColumna = diasMap[current.getDay()] || 'lunes'

      // Obtener la planificación para ese día
      const { data: plan } = await supabase
        .from('planificacion_ejercicios')
        .select(`${diaColumna}`)
        .eq('actividad_id', activityId)
        .eq('numero_semana', weekInCycle)
        .single()

      let detallesPlan: any = {}
      if (plan && plan[diaColumna]) {
        const rawPlan = typeof plan[diaColumna] === 'string' ? JSON.parse(plan[diaColumna]) : plan[diaColumna]
        // Convertir formato de bloques a detalles_series inicial
        Object.keys(rawPlan).forEach(bKey => {
          if (bKey === 'blockCount' || bKey === 'blockNames') return
          const block = rawPlan[bKey]
          if (Array.isArray(block)) {
            block.forEach((ej: any) => {
              const key = `${ej.id}_${bKey}_${ej.orden || 1}`
              detallesPlan[key] = {
                ejercicio_id: Number(ej.id),
                bloque: Number(bKey),
                orden: Number(ej.orden || 1),
                detalle_series: ej.detalle_series || "Sin especificar"
              }
            })
          }
        })
      }

      // Crear el registro inicial
      const { data: newRecord, error: insertError } = await supabase
        .from('progreso_cliente')
        .insert({
          cliente_id: user.id,
          actividad_id: activityId,
          enrollment_id: enrollment.id,
          fecha: targetDate,
          ejercicios_pendientes: detallesPlan,
          ejercicios_completados: {},
          detalles_series: detallesPlan
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ [API update-exercise-series] Error creating progress record:', insertError)
        return NextResponse.json({ error: 'Error al inicializar registro de progreso' }, { status: 500 })
      }
      progressRecord = newRecord
    }

    // 3. Actualizar el ejercicio específico en detalles_series
    const currentDetalles = typeof progressRecord.detalles_series === 'string'
      ? JSON.parse(progressRecord.detalles_series)
      : (progressRecord.detalles_series || {})

    // También actualizar columnas individuales si existen
    const currentPeso = typeof progressRecord.peso === 'string' ? JSON.parse(progressRecord.peso) : (progressRecord.peso || {})
    const currentSeries = typeof progressRecord.series === 'string' ? JSON.parse(progressRecord.series) : (progressRecord.series || {})
    const currentReps = typeof progressRecord.reps === 'string' ? JSON.parse(progressRecord.reps) : (progressRecord.reps || {})

    // Buscar el key correcto
    const keysToTry = [
      `${ejercicioId}_${bloqueNum}_${ordenNum}`,
      `${ejercicioId}_${ordenNum}`,
      `${ejercicioId}`
    ]

    let targetKey = keysToTry.find(k => currentDetalles[k]) || keysToTry[0]

    // Asegurar que la entrada sea un objeto
    if (!currentDetalles[targetKey] || typeof currentDetalles[targetKey] !== 'object') {
      let baseObj = {}
      if (typeof currentDetalles[targetKey] === 'string') {
        try { baseObj = JSON.parse(currentDetalles[targetKey]) } catch (e) { }
      }
      currentDetalles[targetKey] = {
        ...baseObj,
        ejercicio_id: Number(ejercicioId),
        bloque: bloqueNum,
        orden: ordenNum
      }
    }

    // Convertir series a string para la BD: "(reps-peso-series);(reps-peso-series);..."
    const detalleSeriesString = series
      .map((s: { reps: string, kg: string, series: string }) => `(${s.reps || '0'}-${s.kg || '0'}-${s.series || '0'})`)
      .join(';')

    currentDetalles[targetKey].detalle_series = detalleSeriesString

    // Actualizar columnas individuales con el primer set (generalmente el PR o el más representativo)
    if (series && series.length > 0) {
      const firstSet = series[0]
      currentPeso[targetKey] = Number(firstSet.kg || 0)
      currentSeries[targetKey] = Number(firstSet.series || 1)
      currentReps[targetKey] = Number(firstSet.reps || 0)
    }

    // Actualizar el registro
    const updatePayload: any = {
      detalles_series: currentDetalles,
      peso: currentPeso,
      series: currentSeries,
      reps: currentReps,
      fecha_actualizacion: new Date().toISOString()
    }

    if (adjustedKcal != null) {
      const kcalJson = typeof progressRecord.calorias === 'string' ? JSON.parse(progressRecord.calorias) : (progressRecord.calorias || {})
      kcalJson[targetKey] = adjustedKcal
      updatePayload.calorias = kcalJson
    }
    if (adjustedMin != null) {
      const minJson = typeof progressRecord.minutos === 'string' ? JSON.parse(progressRecord.minutos) : (progressRecord.minutos || {})
      minJson[targetKey] = adjustedMin
      updatePayload.minutos = minJson
    }

    const { error: updateError } = await supabase
      .from('progreso_cliente')
      .update(updatePayload)
      .eq('id', progressRecord.id)

    if (updateError) throw updateError

    console.log('✅ [API update-exercise-series] Series updated successfully')

    // 4. Propagación a futuro (SÓLO SI SE SOLICITA)
    if (propagateAlways) {
      try {
        const { data: futureRecords } = await supabase
          .from('progreso_cliente')
          .select('id, detalles_series, peso, series, reps')
          .eq('cliente_id', user.id)
          .eq('actividad_id', activityId)
          .gt('fecha', targetDate)
        if (futureRecords && futureRecords.length > 0) {
          console.log(`🔄 [API update-exercise-series] Propagating to ${futureRecords.length} future records`)
          for (const rec of futureRecords) {
            const futDetalles = typeof rec.detalles_series === 'string' ? JSON.parse(rec.detalles_series) : (rec.detalles_series || {})
            const futPeso = typeof rec.peso === 'string' ? JSON.parse(rec.peso) : (rec.peso || {})
            const futSeries = typeof rec.series === 'string' ? JSON.parse(rec.series) : (rec.series || {})
            const futReps = typeof rec.reps === 'string' ? JSON.parse(rec.reps) : (rec.reps || {})
            const futKcal = typeof rec.calorias === 'string' ? JSON.parse(rec.calorias) : (rec.calorias || {})
            const futMin = typeof rec.minutos === 'string' ? JSON.parse(rec.minutos) : (rec.minutos || {})

            // En propagación, SOLO actualizamos si el key exacto (Caso) existe
            // para evitar afectar otros bloques del mismo ejercicio.
            const futKey = targetKey

            if (futDetalles[futKey]) {
              if (typeof futDetalles[futKey] !== 'object') {
                futDetalles[futKey] = { ejercicio_id: Number(ejercicioId), bloque: bloqueNum, orden: ordenNum }
              }

              futDetalles[futKey].detalle_series = detalleSeriesString

              if (series && series.length > 0) {
                const firstSet = series[0]
                futPeso[futKey] = Number(firstSet.kg || 0)
                futSeries[futKey] = Number(firstSet.series || 1)
                futReps[futKey] = Number(firstSet.reps || 0)
              }

              const futureUpdatePayload: any = {
                detalles_series: futDetalles,
                peso: futPeso,
                series: futSeries,
                reps: futReps,
                fecha_actualizacion: new Date().toISOString()
              }

              if (adjustedKcal != null) {
                futKcal[futKey] = adjustedKcal
                futureUpdatePayload.calorias = futKcal
              }
              if (adjustedMin != null) {
                futMin[futKey] = adjustedMin
                futureUpdatePayload.minutos = futMin
              }

              await supabase
                .from('progreso_cliente')
                .update(futureUpdatePayload)
                .eq('id', rec.id)
            }
          }
        }
      } catch (e) {
        console.error('❌ [API update-exercise-series] Error in future propagation:', e)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Series actualizadas correctamente',
      detalle_series: detalleSeriesString
    })

  } catch (error: any) {
    console.error('❌ [API update-exercise-series] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Error interno' }, { status: 500 })
  }
}
