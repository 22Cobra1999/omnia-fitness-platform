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
    const { executionId, bloque, orden, fecha, categoria, activityId, enrollmentId: rawEnrollmentId } = body
    
    // Support both numeric IDs and UUID strings
    const enrollmentId = rawEnrollmentId !== undefined && rawEnrollmentId !== null
      ? (typeof rawEnrollmentId === 'number' ? rawEnrollmentId : (typeof rawEnrollmentId === 'string' ? (/^\d+$/.test(rawEnrollmentId) ? Number(rawEnrollmentId) : rawEnrollmentId) : null))
      : null

    console.log('🚀 [API toggle-exercise] STARTING toggle for:', {
      executionId,
      bloque,
      orden,
      fecha,
      categoria,
      activityId,
      enrollmentId,
      rawEnrollmentId: typeof rawEnrollmentId === 'string' && rawEnrollmentId.length > 20 ? 'UUID...' : rawEnrollmentId
    })

    if (!activityId || (!executionId && !body.exercises)) {
      console.warn('❌ [API toggle-exercise] Missing required params', { activityId, executionId, hasExercises: !!body.exercises })
      return NextResponse.json({
        error: 'Faltan parámetros básicos',
        received: { executionId, activityId, hasExercises: !!body.exercises }
      }, { status: 400 })
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
    const selectFields = (table: string) => {
      if (table === 'progreso_cliente_nutricion') {
        return 'id, ejercicios_completados, ejercicios_pendientes, actividad_id, macros'
      }
      return 'id, ejercicios_completados, ejercicios_pendientes, actividad_id, detalles_series, informacion'
    }

    let progressTable: string | null = null
    let progressRecord: any = null

    for (const table of candidateTables) {
      try {
        console.log(`🔍 [API toggle-exercise] Searching in ${table}...`)
        let query = supabase.from(table).select(selectFields(table)).eq('cliente_id', user.id).eq('fecha', targetDate)

        if (enrollmentId) {
          // If it's a number, use numeric eq. If it's a UUID string, use text eq.
          query = query.eq('enrollment_id', enrollmentId)
        } else {
          query = query.eq('actividad_id', activityId)
        }

        const { data, error } = await query.order('id', { ascending: false }).limit(1)

        if (error) {
          console.error(`❌ [API toggle-exercise] Error querying ${table}:`, {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details,
            table,
            enrollmentId
          })

          // If the error is a type mismatch (P0001 or 22P02), try the fallback without enrollmentId
          if (error.code === '22P02' || error.code === 'P0001') {
            console.log(`⚠️ [API toggle-exercise] Type mismatch detected for enrollment_id on ${table}. Falling back to activity_id.`)
            const { data: fallbackData, error: fallbackError } = await supabase.from(table).select(selectFields(table)).eq('cliente_id', user.id).eq('actividad_id', activityId).eq('fecha', targetDate).limit(1)
            if (!fallbackError && fallbackData?.[0]) {
              progressTable = table
              progressRecord = fallbackData[0]
              break
            }
          }
          continue
        }

        if (data?.[0]) {
          progressTable = table
          progressRecord = data[0]
          console.log(`✅ [API toggle-exercise] Found record in ${table}, ID: ${progressRecord.id}`, {
            has_pendientes: !!progressRecord.ejercicios_pendientes,
            has_completados: !!progressRecord.ejercicios_completados
          })
          break
        }
      } catch (err: any) {
        console.error(`💥 [API toggle-exercise] Crash querying ${table}:`, err.message)
      }
    }

    if (!progressTable || !progressRecord) {
      // Fallback extremo: intentar por actividad_id sin importar enrollment
      for (const table of candidateTables) {
        try {
          const { data, error } = await supabase.from(table).select(selectFields(table)).eq('cliente_id', user.id).eq('actividad_id', activityId).eq('fecha', targetDate).limit(1)
          if (error) continue
          if (data?.[0]) {
            progressTable = table
            progressRecord = data[0]
            break
          }
        } catch (err) { continue }
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
      if (isNaN(start.getTime())) {
        console.error('❌ [API toggle-exercise] Invalid enrollment.start_date:', enrollment.start_date)
        return NextResponse.json({ error: 'La inscripción no tiene una fecha de inicio válida' }, { status: 400 })
      }
      const current = new Date(targetDate)
      const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const totalWeekNumber = Math.max(1, Math.floor(diffDays / 7) + 1)

      const { data: allPlan } = await supabase.from('planificacion_ejercicios').select('numero_semana').eq('actividad_id', activityId).order('numero_semana', { ascending: false }).limit(1)
      const maxSemanas = allPlan?.[0]?.numero_semana || 1
      const weekInCycle = ((totalWeekNumber - 1) % maxSemanas) + 1

      const diasMap: Record<number, string> = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' }
      const diaColumna = diasMap[current.getDay()] || 'lunes'

      // Obtener planificación
      const { data: plan } = await supabase.from('planificacion_ejercicios').select(`${diaColumna}`).eq('actividad_id', activityId).eq('numero_semana', weekInCycle).single()

      let pents: any = {}
      let info: any = {}
      let details: any = {}
      if (plan && plan[diaColumna]) {
        const rawPlan = typeof plan[diaColumna] === 'string' ? JSON.parse(plan[diaColumna]) : plan[diaColumna]
        Object.keys(rawPlan).forEach(bKey => {
          if (bKey === 'blockCount' || bKey === 'blockNames') return
          const block = rawPlan[bKey]
          if (Array.isArray(block)) {
            block.forEach((ej: any) => {
              const key = `${ej.id}_${bKey}_${ej.orden || 1}`
              pents[key] = Number(ej.id)
              info[key] = { id: Number(ej.id), bloque: Number(bKey), orden: Number(ej.orden || 1), ejercicio_id: Number(ej.id) }
              details[key] = ej.detalle_series || "Sin especificar"
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
          ejercicios_pendientes: pents,
          ejercicios_completados: {},
          informacion: info,
          detalles_series: requestedCategoria === 'nutricion' ? undefined : details,
          macros: requestedCategoria === 'nutricion' ? details : undefined
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
    const rawComp = safeJsonParse(progressRecord.ejercicios_completados) || {}
    const rawPend = safeJsonParse(progressRecord.ejercicios_pendientes) || {}
    const rawDetalles = safeJsonParse(progressRecord.detalles_series) || {}

    // Función universal para buscar/remover
    // Función universal para buscar/remover
    const removeFromRef = (ref: any, ejId: number, b: number, o: number, key: string) => {
      if (!ref) return null

      const _internal = (target: any) => {
        if (Array.isArray(target)) {
          const idx = target.findIndex((e: any) => {
            if (!e) return false
            // Check if it's a string key like "110_1_1"
            if (typeof e === 'string') return e === key || e === String(ejId)
            // Check if it's a primitive number
            if (typeof e === 'number') return e === ejId
            // Check if it's an object {ejercicio_id: 110, ...}
            const itemID = Number(e.id ?? e.ejercicio_id ?? (typeof e === 'number' ? e : NaN))
            const itemB = Number(e.bloque ?? (typeof e === 'string' && e.includes('_') ? e.split('_')[1] : 1))
            const itemO = Number(e.orden ?? (typeof e === 'string' && e.includes('_') ? e.split('_')[2] : 1))
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
            const dId = Number(d?.ejercicio_id ?? d?.id ?? (typeof d === 'number' ? d : k.split('_')[0]))
            const dB = Number(d?.bloque ?? k.split('_')[1] ?? 1)
            const dO = Number(d?.orden ?? k.split('_')[2] ?? 1)
            return dId === ejId && dB === b && dO === o
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
        target.push(ejId)
      } else if (typeof target === 'object' && target !== null) {
        target[key] = ejId
      }
    }

    // 2. TOGGLE LOGIC (Supports single exercise or bulk array)
    const exercisesToToggle = body.exercises && Array.isArray(body.exercises)
      ? body.exercises
      : [{ id: ejercicioId, bloque: bloqueNum, orden: ordenNum }]

    console.log(`🔄 [API toggle-exercise] Toggling ${exercisesToToggle.length} exercises...`)

    let toggledToCompleted = false

    for (const ex of exercisesToToggle) {
      const exId = Number(ex.id)
      const exB = Number(ex.bloque || 1)
      const exO = Number(ex.orden || 1)
      const exKey = `${exId}_${exB}_${exO}`

      // Intentar mover de completado a pendiente
      const removedFromComp = removeFromRef(rawComp, exId, exB, exO, exKey)
      if (removedFromComp) {
        addToRef(rawPend, exId, exB, exO, exKey, removedFromComp)
        toggledToCompleted = false
      } else {
        const removedFromPend = removeFromRef(rawPend, exId, exB, exO, exKey)
        addToRef(rawComp, exId, exB, exO, exKey, removedFromPend || exId)
        toggledToCompleted = true
      }
    }

    console.log(`📊 [API toggle-exercise] AFTER:`, {
      toggledToCompleted,
      compKeys: Object.keys(rawComp),
      pendKeys: Object.keys(rawPend),
      is_nutri: requestedCategoria === 'nutricion'
    })

    // 3. Persistir conservando el tipo original (string vs objeto)
    const persist = (orig: any, next: any) => typeof orig === 'string' ? JSON.stringify(next) : next

    console.log(`💾 [API toggle-exercise] Persisting to ${progressTable} ID ${progressRecord.id}...`, {
      toggledToCompleted,
      compKeys: Object.keys(rawComp),
      pendKeys: Object.keys(rawPend)
    })

    const updatePayload = {
      ejercicios_completados: persist(progressRecord.ejercicios_completados, rawComp),
      ejercicios_pendientes: persist(progressRecord.ejercicios_pendientes, rawPend)
    }

    console.log('📦 [API toggle-exercise] Payload to DB:', JSON.stringify(updatePayload, null, 2))

    const { error: updErr } = await supabase
      .from(progressTable)
      .update(updatePayload)
      .eq('id', progressRecord.id)

    if (updErr) {
      console.error('❌ [API toggle-exercise] DB UPDATE ERROR:', {
        message: updErr.message,
        code: updErr.code,
        hint: updErr.hint,
        details: updErr.details
      })
      return NextResponse.json({
        error: 'Error al actualizar base de datos',
        details: updErr.message,
        code: updErr.code,
        hint: updErr.hint
      }, { status: 500 })
    }

    console.log('✅ [API toggle-exercise] Update successful for ID:', progressRecord.id)

    return NextResponse.json({
      success: true,
      isCompleted: toggledToCompleted,
      recordId: progressRecord.id
    })

  } catch (error: any) {
    console.error('❌ [API toggle-exercise] UNHANDLED EXCEPTION:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      details: String(error)
    }, { status: 500 })
  }
}
