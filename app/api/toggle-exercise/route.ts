import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../../../lib/supabase/supabase-server'

const countJsonKeysOrArrayLen = (v: any): number => {
  if (!v) return 0
  if (Array.isArray(v)) return v.length
  if (typeof v === 'object') {
    let count = 0
    if (v.ejercicios) {
      if (Array.isArray(v.ejercicios)) count += v.ejercicios.length
      else count += Object.keys(v.ejercicios).length
    }
    const metadata = ['ejercicios', 'blockCount', 'blockNames', 'orden', 'bloque', 'ejercicio_id']
    Object.keys(v).forEach(k => {
      if (!metadata.includes(k) && !k.startsWith('legacy_')) count++
    })
    return count
  }
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
      if (!exactMatch && !prefixMatch) continue
    }
    const row = (m as any)[key] || {}
    const prot = Number(row.proteinas ?? row.p ?? 0)
    const carbs = Number(row.carbohidratos ?? row.c ?? 0)
    const fat = Number(row.grasas ?? row.f ?? 0)
    const rowMins = Number(row.minutos ?? row.mins ?? 0)
    if (Number.isFinite(prot)) p += prot
    if (Number.isFinite(carbs)) c += carbs
    if (Number.isFinite(fat)) f += fat
    if (Number.isFinite(rowMins)) mins += rowMins

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
  const arr = Array.isArray(comp?.ejercicios) ? comp.ejercicios : (Array.isArray(comp) ? comp : [])
  const keys = new Set<string>()

  for (const e of arr) {
    const id = Number(e?.id ?? e?.ejercicio_id ?? (typeof e === 'string' ? e.split('_')[0] : null))
    const bloque = Number(e?.bloque ?? (typeof e === 'string' ? e.split('_')[1] : null))
    if (Number.isFinite(id) && Number.isFinite(bloque)) {
      keys.add(`${id}_${bloque}`)
    } else if (typeof e === 'string' && e.includes('_')) {
      keys.add(e.split('_').slice(0, 2).join('_'))
    }
  }
  return keys
}

const buildCompletedNutriKeyPrefixSet = (ejerciciosCompletados: any): Set<string> => {
  const comp = safeJsonParse(ejerciciosCompletados)
  const arr = Array.isArray(comp?.ejercicios) ? comp.ejercicios : (Array.isArray(comp) ? comp : [])
  const prefixes = new Set<string>()

  for (const e of arr) {
    const id = Number(e?.id ?? e?.ejercicio_id ?? (typeof e === 'string' ? e.split('_')[0] : null))
    if (Number.isFinite(id)) prefixes.add(`${id}`)
    else if (typeof e === 'string') prefixes.add(e.split('_')[0])
  }
  return prefixes
}

async function refreshDailyProgress(opts: {
  supabase: any
  clienteId: string
  fecha: string
  enrollmentId: string | number
}) {
  const { supabase, clienteId, fecha, enrollmentId } = opts

  // Triggering the manual refresh if needed, but since we updated the source table (progreso_cliente or nutricion),
  // the database trigger 'tr_refresh_daily_progreso_*' will automatically update 'progreso_diario_actividad'.
  // However, for immediate UI response, we can fetch the source and calculate if the trigger is async.
  // In Supabase/Postgres, triggers are sync by default. So we just return ok.
  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { executionId, bloque, orden, fecha, categoria, activityId, enrollmentId } = body

    console.log('🚀 [API toggle-exercise] Incoming:', { executionId, activityId, fecha, categoria })

    if (!executionId || !activityId) {
      console.warn('❌ [API toggle-exercise] Missing params:', { executionId, activityId })
      return NextResponse.json({ error: 'Faltan parámetros básicos', received: { executionId, activityId } }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user
    const bloqueNum = Number(bloque)
    const ordenNum = Number(orden)
    const targetDate = fecha || new Date().toISOString().split('T')[0]
    const ejercicioId = Number(executionId)

    // 1. Localizar el registro de progreso
    let requestedCategoria = typeof categoria === 'string' ? categoria : undefined
    if (!requestedCategoria) {
      const { data: act } = await supabase.from('activities').select('categoria').eq('id', activityId).maybeSingle()
      requestedCategoria = act?.categoria || 'fitness'
    }

    const candidateTables = requestedCategoria === 'nutricion' ? ['progreso_cliente_nutricion'] : ['progreso_cliente']
    const selectFields = (table: string) => table === 'progreso_cliente_nutricion'
      ? 'id, ejercicios_completados, ejercicios_pendientes, actividad_id'
      : 'id, ejercicios_completados, ejercicios_pendientes, actividad_id, detalles_series'

    let progressTable: string | null = null
    let progressRecord: any = null

    for (const table of candidateTables) {
      let query = supabase.from(table).select(selectFields(table)).eq('cliente_id', user.id).eq('fecha', targetDate)
      if (enrollmentId) query = query.eq('enrollment_id', enrollmentId)
      else query = query.eq('actividad_id', activityId)

      const { data } = await query.order('id', { ascending: false }).limit(1)
      if (data?.[0]) {
        progressTable = table
        progressRecord = data[0]
        break
      }
    }

    if (!progressTable || !progressRecord) {
      // Fallback extremo: intentar por actividad_id sin importar enrollment
      for (const table of candidateTables) {
        const { data } = await supabase.from(table).select(selectFields(table)).eq('cliente_id', user.id).eq('actividad_id', activityId).eq('fecha', targetDate).limit(1)
        if (data?.[0]) {
          progressTable = table
          progressRecord = data[0]
          break
        }
      }
    }

    if (!progressTable || !progressRecord) {
      console.log(`ℹ️ No se encontró registro para ${targetDate}. Intentando crear uno nuevo en toggle-exercise...`)

      // Obtener el enrollment
      const { data: enrollment } = await supabase
        .from('activity_enrollments')
        .select('id, start_date')
        .eq('client_id', user.id)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: 'No se encontró inscripción activa' }, { status: 404 })
      }

      // Calcular semana ciclo
      const start = new Date(enrollment.start_date)
      const current = new Date(targetDate)
      const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const totalWeekNumber = Math.floor(diffDays / 7) + 1

      const { data: allPlan } = await supabase.from('planificacion_ejercicios').select('numero_semana').eq('actividad_id', activityId).order('numero_semana', { ascending: false }).limit(1)
      const maxSemanas = allPlan?.[0]?.numero_semana || 1
      const weekInCycle = ((totalWeekNumber - 1) % maxSemanas) + 1

      const diasMap: Record<number, string> = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' }
      const diaColumna = diasMap[current.getDay()] || 'lunes'

      // Obtener planificación
      const { data: plan } = await supabase.from('planificacion_ejercicios').select(`${diaColumna}`).eq('actividad_id', activityId).eq('numero_semana', weekInCycle).single()

      let detallesPlan: any = {}
      if (plan && plan[diaColumna]) {
        const rawPlan = typeof plan[diaColumna] === 'string' ? JSON.parse(plan[diaColumna]) : plan[diaColumna]
        Object.keys(rawPlan).forEach(bKey => {
          if (bKey === 'blockCount' || bKey === 'blockNames') return
          const block = rawPlan[bKey]
          if (Array.isArray(block)) {
            block.forEach((ej: any) => {
              const key = `${ej.id}_${bKey}_${ej.orden || 1}`
              detallesPlan[key] = { ejercicio_id: Number(ej.id), bloque: Number(bKey), orden: Number(ej.orden || 1), detalle_series: ej.detalle_series || "Sin especificar" }
            })
          }
        })
      }

      // Crear el registro inicial
      const currentTable = requestedCategoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente'
      const { data: newRecord, error: insertError } = await supabase
        .from(currentTable)
        .insert({
          cliente_id: user.id,
          actividad_id: activityId,
          enrollment_id: enrollment.id,
          fecha: targetDate,
          ejercicios_pendientes: detallesPlan,
          ejercicios_completados: {},
          detalles_series: requestedCategoria === 'nutricion' ? undefined : detallesPlan,
          macros: requestedCategoria === 'nutricion' ? detallesPlan : undefined
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creando registro en toggle:', insertError)
        return NextResponse.json({ error: 'Error al inicializar registro' }, { status: 500 })
      }
      progressTable = currentTable
      progressRecord = newRecord
    }

    // 2. Parsear y normalizar estructuras (pueden ser Map o Array)
    const rawComp = safeJsonParse(progressRecord.ejercicios_completados)
    const rawPend = safeJsonParse(progressRecord.ejercicios_pendientes)
    const rawDetalles = safeJsonParse(progressRecord.detalles_series) || {}

    // Función universal para buscar/remover
    const removeFromRef = (ref: any, ejId: number, b: number, o: number, key: string) => {
      if (!ref) return null

      const _internal = (target: any) => {
        if (Array.isArray(target)) {
          const idx = target.findIndex((e: any) => {
            if (typeof e === 'string') return e === key || e === String(ejId)
            const itemID = Number(e.id ?? e.ejercicio_id)
            const itemB = Number(e.bloque ?? 1)
            const itemO = Number(e.orden ?? 1)
            return itemID === ejId && itemB === b && itemO === o
          })
          if (idx !== -1) return target.splice(idx, 1)[0]
        } else if (target && typeof target === 'object') {
          if (key in target) {
            const val = target[key]
            delete target[key]
            return val
          }
          const foundKey = Object.keys(target).find(k => {
            if (k === 'ejercicios' || k === 'blockCount' || k === 'blockNames') return false
            const d = target[k]
            return d && Number(d.ejercicio_id ?? k.split('_')[0]) === ejId && Number(d.bloque ?? k.split('_')[1] ?? 1) === b && Number(d.orden ?? k.split('_')[2] ?? 1) === o
          })
          if (foundKey) {
            const val = target[foundKey]
            delete target[foundKey]
            return val
          }
        }
        return null
      }

      // 1. Try in root
      let found = _internal(ref)
      if (found) return found

      // 2. Try in .ejercicios
      if (ref.ejercicios) {
        found = _internal(ref.ejercicios)
        if (found) return found
      }
      return null
    }

    const addToRef = (ref: any, ejId: number, b: number, o: number, key: string, val: any) => {
      let target = ref
      if (ref.ejercicios) {
        target = ref.ejercicios
      }

      if (Array.isArray(target)) {
        const item = (val && typeof val === 'object' && Object.keys(val).length > 0)
          ? { ...val, id: ejId, bloque: b, orden: o }
          : { id: ejId, bloque: b, orden: o, ejercicio_id: ejId }
        target.push(item)
      } else if (typeof target === 'object') {
        target[key] = (val && typeof val === 'object' && Object.keys(val).length > 0) ? val : { id: ejId, bloque: b, orden: o, ejercicio_id: ejId }
      }
    }

    const exerciseKey = `${ejercicioId}_${bloqueNum}_${ordenNum}`
    console.log(`🔄 [API toggle-exercise] Toggling key ${exerciseKey}`, {
      in_completados: Object.keys(rawComp),
      in_pendientes: Object.keys(rawPend)
    })

    let toggledToCompleted = false

    // Intentar mover de completado a pendiente
    const removedFromComp = removeFromRef(rawComp, ejercicioId, bloqueNum, ordenNum, exerciseKey)
    if (removedFromComp) {
      console.log(`✅ [API toggle-exercise] Removed from COMPLETADOS, adding to PENDIENTES`)
      addToRef(rawPend, ejercicioId, bloqueNum, ordenNum, exerciseKey, removedFromComp)
      toggledToCompleted = false
    } else {
      // No estaba en completados, buscar en pendientes o simplemente agregarlo a completados
      console.log(`✅ [API toggle-exercise] Not in COMPLETADOS, moving from PENDIENTES to COMPLETADOS`)
      const removedFromPend = removeFromRef(rawPend, ejercicioId, bloqueNum, ordenNum, exerciseKey)
      addToRef(rawComp, ejercicioId, bloqueNum, ordenNum, exerciseKey, removedFromPend || {})
      toggledToCompleted = true
    }

    console.log(`📊 [API toggle-exercise] AFTER:`, {
      toggledToCompleted,
      in_completados: Object.keys(rawComp),
      in_pendientes: Object.keys(rawPend)
    })

    // 3. Persistir conservando el tipo original (string vs objeto)
    const persist = (orig: any, next: any) => typeof orig === 'string' ? JSON.stringify(next) : next

    const { error: updErr } = await supabase.from(progressTable).update({
      ejercicios_completados: persist(progressRecord.ejercicios_completados, rawComp),
      ejercicios_pendientes: persist(progressRecord.ejercicios_pendientes, rawPend)
    }).eq('id', progressRecord.id)

    if (updErr) throw updErr

    try {
      await refreshDailyProgress({ supabase, clienteId: user.id, fecha: targetDate, enrollmentId: enrollmentId || progressRecord.enrollment_id })
    } catch (e) { console.error('Summary error:', e) }

    return NextResponse.json({ success: true, isCompleted: toggledToCompleted })

  } catch (error: any) {
    console.error('❌ POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor', details: error?.message || String(error) }, { status: 500 })
  }
}
