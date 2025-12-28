import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../../../lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { executionId, bloque, orden, fecha, categoria, activityId } = await request.json()
    
    if (!executionId) {
      return NextResponse.json({ error: 'executionId requerido' }, { status: 400 })
    }

    if (!activityId) {
      return NextResponse.json({ error: 'activityId requerido' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user

    const bloqueNum = typeof bloque === 'string' ? parseInt(bloque) : Number(bloque)
    const ordenNum = typeof orden === 'string' ? parseInt(orden) : Number(orden)

    // Determinar tabla de progreso. No confiar solo en `categoria` porque puede venir undefined/mal.
    // Buscar por (cliente_id, actividad_id, fecha) y usar fallback entre tablas.
    const targetDate = fecha || new Date().toISOString().split('T')[0]
    let requestedCategoria = typeof categoria === 'string' ? categoria : undefined

    console.log('🧩 [toggle-exercise] request', {
      userId: user.id,
      activityId,
      activityIdNum: Number(activityId),
      targetDate,
      bloque: bloqueNum,
      orden: ordenNum,
      categoria: requestedCategoria,
      executionId
    })

    if (requestedCategoria !== 'nutricion' && requestedCategoria !== 'fitness') {
      const { data: activityRow, error: activityError } = await supabase
        .from('activities')
        .select('categoria')
        .eq('id', Number(activityId))
        .maybeSingle()

      if (!activityError && activityRow?.categoria) {
        requestedCategoria = activityRow.categoria
      }
    }

    const candidateTables = requestedCategoria === 'nutricion'
      ? ['progreso_cliente_nutricion']
      : requestedCategoria === 'fitness'
        ? ['progreso_cliente']
        : ['progreso_cliente_nutricion', 'progreso_cliente']

    const getSelectFieldsForTable = (table: string) => {
      return table === 'progreso_cliente_nutricion'
        ? 'id, ejercicios_completados, ejercicios_pendientes, actividad_id'
        : 'id, ejercicios_completados, ejercicios_pendientes, actividad_id, detalles_series'
    }

    let progressTable: 'progreso_cliente' | 'progreso_cliente_nutricion' | null = null
    let progressRecord: any = null
    let progressError: any = null

    for (const table of candidateTables) {
      let { data, error } = await supabase
        .from(table)
        .select(getSelectFieldsForTable(table))
        .eq('cliente_id', user.id)
        .eq('actividad_id', Number(activityId))
        .eq('fecha', targetDate)
        .order('id', { ascending: false })
        .limit(1)

      console.log('🔎 [toggle-exercise] lookup (num)', {
        table,
        rows: Array.isArray(data) ? data.length : 0,
        error: error ? { code: error.code, message: error.message } : null
      })

      if ((!data || (Array.isArray(data) && data.length === 0)) && !error) {
        const result = await supabase
          .from(table)
          .select(getSelectFieldsForTable(table))
          .eq('cliente_id', user.id)
          .eq('actividad_id', String(activityId))
          .eq('fecha', targetDate)
          .order('id', { ascending: false })
          .limit(1)
        data = result.data
        error = result.error

        console.log('🔎 [toggle-exercise] lookup (str)', {
          table,
          rows: Array.isArray(data) ? data.length : 0,
          error: error ? { code: error.code, message: error.message } : null
        })
      }

      if (error) {
        progressError = error
        continue
      }

      const row = Array.isArray(data) ? data[0] : null
      if (row) {
        progressTable = table as any
        progressRecord = row
        progressError = null
        break
      }
    }

    // Fallback adicional: buscar por (cliente_id, fecha) y matchear actividad_id en JS.
    // Esto evita falsos 404 cuando hay duplicados o actividad_id guardado como string/número.
    if (!progressTable || !progressRecord) {
      const desiredActivityIdNum = Number(activityId)
      const desiredActivityIdStr = String(activityId)

      for (const table of candidateTables) {
        const { data, error } = await supabase
          .from(table)
          .select(getSelectFieldsForTable(table))
          .eq('cliente_id', user.id)
          .eq('fecha', targetDate)
          .order('id', { ascending: false })
          .limit(50)

        console.log('🔎 [toggle-exercise] lookup (by date)', {
          table,
          rows: Array.isArray(data) ? data.length : 0,
          error: error ? { code: error.code, message: error.message } : null
        })

        if (error) {
          progressError = error
          continue
        }

        const rows = Array.isArray(data) ? data : []
        const match = rows.find((r: any) => {
          const rIdNum = Number(r?.actividad_id)
          const rIdStr = String(r?.actividad_id)
          return (Number.isFinite(rIdNum) && rIdNum === desiredActivityIdNum) || rIdStr === desiredActivityIdStr
        })

        if (match) {
          progressTable = table as any
          progressRecord = match
          progressError = null
          break
        }
      }
    }

    if (!progressTable || !progressRecord) {
      const ejercicioIdFallback = parseInt(executionId)
      const tablesFallback: Array<'progreso_cliente_nutricion' | 'progreso_cliente'> = ['progreso_cliente_nutricion', 'progreso_cliente']

      for (const table of tablesFallback) {
        const { data, error } = await supabase
          .from(table)
          .select(getSelectFieldsForTable(table))
          .eq('cliente_id', user.id)
          .eq('fecha', targetDate)
          .order('id', { ascending: false })
          .limit(25)

        if (error) {
          progressError = error
          continue
        }

        const rows = Array.isArray(data) ? data : []
        for (const row of rows) {
          if (table === 'progreso_cliente') {
            const ds = row.detalles_series
              ? (typeof row.detalles_series === 'string' ? JSON.parse(row.detalles_series) : row.detalles_series)
              : {}
            const keys = Object.keys(ds || {})
            const found = keys.some((k) => {
              const d = ds[k]
              return d && d.ejercicio_id === ejercicioIdFallback && d.bloque === bloqueNum && d.orden === ordenNum
            })
            if (found) {
              progressTable = table
              progressRecord = row
              break
            }
          } else {
            const pendientesRaw = row.ejercicios_pendientes
              ? (typeof row.ejercicios_pendientes === 'string' ? JSON.parse(row.ejercicios_pendientes) : row.ejercicios_pendientes)
              : {}
            const completadosRaw = row.ejercicios_completados
              ? (typeof row.ejercicios_completados === 'string' ? JSON.parse(row.ejercicios_completados) : row.ejercicios_completados)
              : {}
            const ejerciciosPend = Array.isArray(pendientesRaw?.ejercicios) ? pendientesRaw.ejercicios : []
            const ejerciciosComp = Array.isArray(completadosRaw?.ejercicios) ? completadosRaw.ejercicios : []
            const ejerciciosAll = [...(ejerciciosPend as any[]), ...(ejerciciosComp as any[])]
            const found = ejerciciosAll.some((e: any) => {
              return (
                e &&
                Number(e.id) === ejercicioIdFallback &&
                Number(e.bloque) === bloqueNum &&
                Number(e.orden) === ordenNum
              )
            })
            if (found) {
              progressTable = table
              progressRecord = row
              break
            }
          }
        }

        if (progressTable && progressRecord) break
      }
    }

    if (!progressTable || !progressRecord) {
      console.error('Error obteniendo progreso:', progressError)

      const debug: any = {
        userId: user.id,
        activityId: Number(activityId),
        targetDate,
        requestedCategoria,
        tablesTried: candidateTables
      }

      try {
        const { data: anyNutri } = await supabase
          .from('progreso_cliente_nutricion')
          .select('id, actividad_id, fecha')
          .eq('cliente_id', user.id)
          .eq('fecha', targetDate)
          .order('id', { ascending: false })
          .limit(5)

        const { data: anyFit } = await supabase
          .from('progreso_cliente')
          .select('id, actividad_id, fecha')
          .eq('cliente_id', user.id)
          .eq('fecha', targetDate)
          .order('id', { ascending: false })
          .limit(5)

        debug.sameDayNutriRows = anyNutri || []
        debug.sameDayFitnessRows = anyFit || []
      } catch (e) {
        debug.debugQueryError = String(e)
      }

      return NextResponse.json(
        { error: `No se encontró registro de progreso para ${targetDate}`, debug },
        { status: 404 }
      )
    }

    // Parsear objetos de ejercicios según el tipo de tabla
    let completados: any = {}, pendientes: any = {}, detallesSeries: any = {}
    
    if (progressTable === 'progreso_cliente_nutricion') {
      // Nutrición: ejercicios_pendientes es un objeto con estructura de array
      completados = progressRecord.ejercicios_completados 
        ? (typeof progressRecord.ejercicios_completados === 'string' 
            ? JSON.parse(progressRecord.ejercicios_completados) 
            : progressRecord.ejercicios_completados)
        : {}
      pendientes = progressRecord.ejercicios_pendientes 
        ? (typeof progressRecord.ejercicios_pendientes === 'string' 
            ? JSON.parse(progressRecord.ejercicios_pendientes) 
            : progressRecord.ejercicios_pendientes)
        : {}
      // En nutrición no hay detalles_series, usamos el array de ejercicios_pendientes
    } else {
      // Fitness: estructura tradicional
      completados = progressRecord.ejercicios_completados 
        ? (typeof progressRecord.ejercicios_completados === 'string' 
            ? JSON.parse(progressRecord.ejercicios_completados) 
            : progressRecord.ejercicios_completados)
        : {}
      pendientes = progressRecord.ejercicios_pendientes 
        ? (typeof progressRecord.ejercicios_pendientes === 'string' 
            ? JSON.parse(progressRecord.ejercicios_pendientes) 
            : progressRecord.ejercicios_pendientes)
        : {}
      detallesSeries = progressRecord.detalles_series 
        ? (typeof progressRecord.detalles_series === 'string' 
            ? JSON.parse(progressRecord.detalles_series) 
            : progressRecord.detalles_series)
        : {}
    }

    const ejercicioId = parseInt(executionId)
    
    let ejercicioKey = null
    
    if (progressTable === 'progreso_cliente_nutricion') {
      // Nutrición: buscar en el array de ejercicios_pendientes
      if (pendientes.ejercicios && Array.isArray(pendientes.ejercicios)) {
        const ejercicio = (pendientes.ejercicios as any[]).find((e: any) => 
          Number(e.id) === ejercicioId && Number(e.bloque) === bloqueNum && Number(e.orden) === ordenNum
        )
        if (ejercicio) {
          ejercicioKey = `${ejercicioId}_${bloqueNum}_${ordenNum}`
        }
      }

      if (!ejercicioKey && completados.ejercicios && Array.isArray(completados.ejercicios)) {
        const ejercicio = (completados.ejercicios as any[]).find((e: any) =>
          Number(e.id) === ejercicioId && Number(e.bloque) === bloqueNum && Number(e.orden) === ordenNum
        )
        if (ejercicio) {
          ejercicioKey = `${ejercicioId}_${bloqueNum}_${ordenNum}`
        }
      }
    } else {
      // Fitness: buscar en detalles_series
      for (const key of Object.keys(detallesSeries)) {
        const detalle = detallesSeries[key]
        if (detalle && 
            detalle.ejercicio_id === ejercicioId && 
            detalle.bloque === bloqueNum &&
            detalle.orden === ordenNum) {
          ejercicioKey = key
          break
        }
      }
    }

    if (!ejercicioKey) {
      console.error('❌ Ejercicio no encontrado en detalles_series')
      console.error('🔍 Buscando ejercicio:', { ejercicioId, bloque, orden })
      console.error('🔍 Keys disponibles en detalles_series:', Object.keys(detallesSeries))
      console.error('🔍 Detalles_series completo:', detallesSeries)
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }
    
    let newCompletados = { ...completados }
    let newPendientes = { ...pendientes }
    let toggledToCompleted = false

    if (progressTable === 'progreso_cliente_nutricion') {
      // Nutrición: manejar arrays en ejercicios_pendientes/ejercicios_completados
      if (!newCompletados.ejercicios) newCompletados.ejercicios = []
      if (!newPendientes.ejercicios) newPendientes.ejercicios = []
      
      const ejercicioIndex = (newPendientes.ejercicios as any[]).findIndex((e: any) => 
        e.id === ejercicioId && e.bloque === bloqueNum && e.orden === ordenNum
      )
      
      if (ejercicioIndex !== -1) {
        // Mover de pendientes a completados
        const ejercicio = (newPendientes.ejercicios as any[]).splice(ejercicioIndex, 1)[0]
        ;(newCompletados.ejercicios as any[]).push(ejercicio)
        toggledToCompleted = true
      } else {
        // Buscar en completados para mover a pendientes
        const completadoIndex = (newCompletados.ejercicios as any[]).findIndex((e: any) => 
          e.id === ejercicioId && e.bloque === bloqueNum && e.orden === ordenNum
        )
        if (completadoIndex !== -1) {
          const ejercicio = (newCompletados.ejercicios as any[]).splice(completadoIndex, 1)[0]
          ;(newPendientes.ejercicios as any[]).push(ejercicio)
          toggledToCompleted = false
        }
      }
    } else {
      // Fitness: manejar objetos simples
      const isCompleted = ejercicioKey in completados
      const isPending = ejercicioKey in pendientes

      if (isCompleted) {
        // Mover de completados a pendientes
        delete newCompletados[ejercicioKey]
        newPendientes[ejercicioKey] = pendientes[ejercicioKey] || {}
        toggledToCompleted = false
      } else if (isPending) {
        // Mover de pendientes a completados
        delete newPendientes[ejercicioKey]
        newCompletados[ejercicioKey] = completados[ejercicioKey] || {}
        toggledToCompleted = true
      } else {
        // Si no está en ninguna lista, agregarlo como completado
        newCompletados[ejercicioKey] = {}
        toggledToCompleted = true
      }
    }

    // Actualizar el registro de progreso (detalles_series NO cambia)
    const { error: updateError } = await supabase
      .from(progressTable)
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

    console.log(`✅ Ejercicio ${ejercicioId} (bloque: ${bloque}, orden: ${orden}) toggleado: ${toggledToCompleted ? 'pendiente → completado' : 'completado → pendiente'}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Ejercicio actualizado exitosamente',
      ejercicioId,
      bloque,
      orden,
      isCompleted: toggledToCompleted
    })

  } catch (error) {
    console.error('Error en toggle-exercise:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
