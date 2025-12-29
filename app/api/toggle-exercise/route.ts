import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../../../lib/supabase/supabase-server'

const countJsonKeysOrArrayLen = (v: any): number => {
  if (!v) return 0
  if (Array.isArray(v)) return v.length
  if (typeof v === 'object') return Object.keys(v).length
  return 0
}

const safeJsonParse = (v: any) => {
  if (!v) return null
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return null
    }
  }
  return v
}

const sumJsonbEachTextNumbers = (obj: any): number => {
  const o = safeJsonParse(obj)
  if (!o || typeof o !== 'object') return 0
  return Object.values(o).reduce((acc: number, v: any) => {
    const n = Number(v)
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
}

const computeNutriKcalFromMacros = (
  macros: any,
  opts?: {
    onlyKeys?: Set<string>
    onlyPrefixes?: Set<string>
  }
): { kcal: number; mins: number; p: number; c: number; f: number } => {
  const m = safeJsonParse(macros) || {}
  let kcal = 0
  let mins = 0
  let p = 0
  let c = 0
  let f = 0
  if (!m || typeof m !== 'object') return { kcal: 0, mins: 0, p: 0, c: 0, f: 0 }

  for (const key of Object.keys(m)) {
    if (opts?.onlyKeys || opts?.onlyPrefixes) {
      const exactMatch = opts?.onlyKeys ? opts.onlyKeys.has(key) : false
      let prefixMatch = false
      if (opts?.onlyPrefixes) {
        for (const pfx of opts.onlyPrefixes) {
          if (key === pfx || key.startsWith(`${pfx}_`)) {
            prefixMatch = true
            break
          }
        }
      }

      // Aceptar si matchea por key exacta O por prefijo
      if (!exactMatch && !prefixMatch) continue
    }
    const row = (m as any)[key] || {}
    const prot = Number(row.proteinas)
    const carbs = Number(row.carbohidratos)
    const fat = Number(row.grasas)
    const rowMins = Number(row.minutos)
    if (Number.isFinite(prot)) p += prot
    if (Number.isFinite(carbs)) c += carbs
    if (Number.isFinite(fat)) f += fat
    if (Number.isFinite(rowMins)) mins += rowMins

    // Preferir calorías explícitas si existen (vienen pre-calculadas por receta)
    const explicitKcal = Number(row.calorias)
    if (Number.isFinite(explicitKcal)) {
      kcal += explicitKcal
      continue
    }

    const computedKcal =
      (Number.isFinite(prot) ? prot : 0) * 4 +
      (Number.isFinite(carbs) ? carbs : 0) * 4 +
      (Number.isFinite(fat) ? fat : 0) * 9
    kcal += computedKcal
  }
  return { kcal, mins, p, c, f }
}

const buildCompletedNutriKeySet = (ejerciciosCompletados: any): Set<string> => {
  const comp = safeJsonParse(ejerciciosCompletados)
  const arr = Array.isArray(comp?.ejercicios) ? comp.ejercicios : []
  const keys = new Set<string>()

  for (const e of arr) {
    // macros keys vienen como "<id>_<bloque>" (ej: 753_1)
    const id = Number(e?.id)
    const bloque = Number(e?.bloque)
    if (Number.isFinite(id) && Number.isFinite(bloque)) {
      keys.add(`${id}_${bloque}`)
    }
  }
  return keys
}

const buildCompletedNutriKeyPrefixSet = (ejerciciosCompletados: any): Set<string> => {
  const comp = safeJsonParse(ejerciciosCompletados)
  const arr = Array.isArray(comp?.ejercicios) ? comp.ejercicios : []
  const prefixes = new Set<string>()

  for (const e of arr) {
    const id = Number(e?.id)
    const bloque = Number(e?.bloque)
    if (!Number.isFinite(id)) continue

    // Prefixes tolerantes: algunos macros vienen como "<id>", otros "<id>_<bloque>", otros "<id>_<bloque>_<orden>"
    prefixes.add(`${id}`)
    if (Number.isFinite(bloque)) {
      prefixes.add(`${id}_${bloque}`)
    }
  }

  return prefixes
}

async function recalcAndUpsertDailySummary(opts: {
  supabase: any
  clienteId: string
  fecha: string
}) {
  const { supabase, clienteId, fecha } = opts

  const [{ data: fitRows, error: fitErr }, { data: nutriRows, error: nutriErr }] = await Promise.all([
    supabase
      .from('progreso_cliente')
      .select('fecha, ejercicios_completados, ejercicios_pendientes, minutos_json, calorias_json')
      .eq('cliente_id', clienteId)
      .eq('fecha', fecha),
    supabase
      .from('progreso_cliente_nutricion')
      .select('fecha, ejercicios_completados, ejercicios_pendientes, macros')
      .eq('cliente_id', clienteId)
      .eq('fecha', fecha)
  ])

  if (fitErr) console.error('❌ [toggle-exercise] daily summary: error leyendo progreso_cliente', fitErr)
  if (nutriErr) console.error('❌ [toggle-exercise] daily summary: error leyendo progreso_cliente_nutricion', nutriErr)

  let fitness_kcal = 0
  let fitness_mins = 0
  let ejercicios_completados = 0
  let ejercicios_pendientes = 0

  for (const r of (fitRows || []) as any[]) {
    ejercicios_completados += countJsonKeysOrArrayLen(safeJsonParse(r.ejercicios_completados) || {})
    ejercicios_pendientes += countJsonKeysOrArrayLen(safeJsonParse(r.ejercicios_pendientes) || {})
    fitness_mins += sumJsonbEachTextNumbers(r.minutos_json)
    fitness_kcal += sumJsonbEachTextNumbers(r.calorias_json)
  }

  let platos_completados = 0
  let platos_pendientes = 0
  let nutri_kcal = 0
  let nutri_mins = 0
  let nutri_protein = 0
  let nutri_carbs = 0
  let nutri_fat = 0

  for (const r of (nutriRows || []) as any[]) {
    const comp = safeJsonParse(r.ejercicios_completados) || {}
    const pend = safeJsonParse(r.ejercicios_pendientes) || {}
    platos_completados += Array.isArray((comp as any)?.ejercicios) ? (comp as any).ejercicios.length : 0
    platos_pendientes += Array.isArray((pend as any)?.ejercicios) ? (pend as any).ejercicios.length : 0

    // kcal/mins/macros deben reflejar SOLO lo completado (no el plan completo)
    // Hay datos legacy donde macros usa key "<id>_<bloque>" y otros donde usa "<id>_<bloque>_<orden>"
    // Soportamos ambos por prefix-match.
    const completedKeys = buildCompletedNutriKeySet(r.ejercicios_completados)
    const completedPrefixes = buildCompletedNutriKeyPrefixSet(r.ejercicios_completados)
    const macrosAgg = computeNutriKcalFromMacros(r.macros, {
      onlyKeys: completedKeys.size ? completedKeys : undefined,
      onlyPrefixes: completedPrefixes.size ? completedPrefixes : undefined
    })

    if (
      Array.isArray((comp as any)?.ejercicios) &&
      (comp as any).ejercicios.length > 0 &&
      macrosAgg.kcal === 0 &&
      macrosAgg.mins === 0
    ) {
      try {
        const m = safeJsonParse(r.macros) || {}
        console.log('🧾 [toggle-exercise] daily summary nutri debug (kcal/mins=0 with completados)', {
          fecha,
          clienteId,
          completados: (comp as any).ejercicios,
          completedKeys: Array.from(completedKeys),
          completedPrefixes: Array.from(completedPrefixes),
          macrosKeys: Object.keys(m).slice(0, 30),
          macrosKeysCount: Object.keys(m).length,
          macrosType: typeof r.macros
        })
      } catch (e) {
        console.log('🧾 [toggle-exercise] daily summary nutri debug failed', String(e))
      }
    }

    nutri_kcal += macrosAgg.kcal
    nutri_mins += macrosAgg.mins
    nutri_protein += macrosAgg.p
    nutri_carbs += macrosAgg.c
    nutri_fat += macrosAgg.f
  }

  const ejercicios_objetivo = ejercicios_completados + ejercicios_pendientes
  const platos_objetivo = platos_completados + platos_pendientes

  // Preservar objetivos si ya existen (vienen de tu sistema de targets/planes)
  const { data: existingSummary, error: existingErr } = await supabase
    .from('progreso_cliente_daily_summary')
    .select(
      [
        'nutri_kcal_objetivo',
        'nutri_mins_objetivo',
        'fitness_kcal_objetivo',
        'fitness_mins_objetivo',
        'platos_objetivo',
        'ejercicios_objetivo'
      ].join(',')
    )
    .eq('cliente_id', clienteId)
    .eq('fecha', fecha)
    .maybeSingle()

  if (existingErr) {
    console.error('❌ [toggle-exercise] daily summary: error leyendo existing progreso_cliente_daily_summary', existingErr)
  }

  const payload: any = {
    cliente_id: clienteId,
    fecha,

    platos_completados,
    platos_pendientes,
    platos_objetivo: Number(existingSummary?.platos_objetivo) || platos_objetivo,

    nutri_kcal,
    nutri_mins,
    nutri_protein,
    nutri_carbs,
    nutri_fat,
    nutri_kcal_objetivo: Number(existingSummary?.nutri_kcal_objetivo) || 0,
    nutri_mins_objetivo: Number(existingSummary?.nutri_mins_objetivo) || 0,

    ejercicios_completados,
    ejercicios_pendientes,
    ejercicios_objetivo: Number(existingSummary?.ejercicios_objetivo) || ejercicios_objetivo,

    fitness_kcal,
    fitness_mins,
    fitness_kcal_objetivo: Number(existingSummary?.fitness_kcal_objetivo) || 0,
    fitness_mins_objetivo: Number(existingSummary?.fitness_mins_objetivo) || 0,

    recalculado_en: new Date().toISOString()
  }

  console.log('🧾 [toggle-exercise] daily summary upsert payload', payload)

  const { error: upsertErr } = await supabase
    .from('progreso_cliente_daily_summary')
    .upsert(payload, { onConflict: 'cliente_id,fecha' })

  if (upsertErr) {
    console.error('❌ [toggle-exercise] daily summary upsert error', upsertErr)
    return { ok: false, error: upsertErr }
  }

  return { ok: true }
}

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

    const persistValue = (original: any, next: any) => {
      // Algunas instalaciones guardan estos JSONs como TEXT (string JSON).
      // Si vino como string, persistimos como string para evitar errores de tipo en Postgres.
      return typeof original === 'string' ? JSON.stringify(next) : next
    }

    const persistedCompletados = persistValue(progressRecord.ejercicios_completados, newCompletados)
    const persistedPendientes = persistValue(progressRecord.ejercicios_pendientes, newPendientes)

    try {
      console.log('🧾 [toggle-exercise] pre-update debug', {
        table: progressTable,
        progressId: progressRecord?.id,
        targetDate,
        requestedCategoria,
        originalTypes: {
          ejercicios_completados: typeof progressRecord?.ejercicios_completados,
          ejercicios_pendientes: typeof progressRecord?.ejercicios_pendientes
        },
        persistedTypes: {
          ejercicios_completados: typeof persistedCompletados,
          ejercicios_pendientes: typeof persistedPendientes
        },
        persistedSizes: {
          ejercicios_completados: typeof persistedCompletados === 'string' ? persistedCompletados.length : JSON.stringify(persistedCompletados || {}).length,
          ejercicios_pendientes: typeof persistedPendientes === 'string' ? persistedPendientes.length : JSON.stringify(persistedPendientes || {}).length
        }
      })
    } catch (e) {
      console.log('🧾 [toggle-exercise] pre-update debug failed', String(e))
    }

    // Actualizar el registro de progreso (detalles_series NO cambia)
    // NOTA: No actualizar `fecha_actualizacion` desde API: en algunos esquemas (ej: progreso_cliente_nutricion)
    // puede no existir y disparar 500. Además, suele estar cubierta por triggers.
    const { error: updateError } = await supabase
      .from(progressTable)
      .update({
        ejercicios_completados: persistedCompletados,
        ejercicios_pendientes: persistedPendientes
      })
      .eq('id', progressRecord.id)

    if (updateError) {
      console.error('Error actualizando progreso:', updateError)
      return NextResponse.json(
        {
          error: 'Error actualizando progreso',
          details: {
            code: (updateError as any)?.code,
            message: (updateError as any)?.message,
            hint: (updateError as any)?.hint,
            table: progressTable
          }
        },
        { status: 500 }
      )
    }

    console.log(`✅ Ejercicio ${ejercicioId} (bloque: ${bloque}, orden: ${orden}) toggleado: ${toggledToCompleted ? 'pendiente → completado' : 'completado → pendiente'}`)

    // Mantener los anillos al día: recalcular summary del día (sin triggers)
    let dailySummaryUpdated = false
    try {
      const r = await recalcAndUpsertDailySummary({
        supabase,
        clienteId: user.id,
        fecha: targetDate
      })
      dailySummaryUpdated = !!r?.ok
    } catch (e) {
      console.error('❌ [toggle-exercise] daily summary recalc failed', e)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ejercicio actualizado exitosamente',
      ejercicioId,
      bloque,
      orden,
      isCompleted: toggledToCompleted,
      dailySummaryUpdated
    })

  } catch (error) {
    console.error('Error en toggle-exercise:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
