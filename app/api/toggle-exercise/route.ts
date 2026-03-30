import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { NextResponse } from 'next/server'

// Helper: Safe JSON parse with fallback
const safeJsonParse = (val: any, fallback: any = {}) => {
  if (!val) return fallback
  if (typeof val !== 'string') return val
  try {
    return JSON.parse(val)
  } catch (e) {
    return fallback
  }
}

// Helper: Count keys or array length
const countJsonKeysOrArrayLen = (obj: any) => {
  if (!obj) return 0
  if (Array.isArray(obj)) return obj.length
  if (obj.ejercicios && Array.isArray(obj.ejercicios)) return obj.ejercicios.length
  if (typeof obj === 'object') return Object.keys(obj).filter(k => k !== 'blockCount' && k !== 'blockNames' && k !== 'ejercicios').length
  return 0
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { executionId, bloque, orden, fecha, categoria, activityId, enrollmentId: rawEnrollmentId, exercises } = body

    console.log('🔄 [API toggle-exercise] START:', { executionId, bloque, orden, fecha, categoria, activityId, rawEnrollmentId, exercisesCount: exercises?.length })

    if ((executionId === undefined || activityId === undefined) && !exercises) {
      return NextResponse.json({ error: 'Faltan parámetros: executionId y activityId son obligatorios (o proporcione exercises para bulk)' }, { status: 400 })
    }

    const enrollmentId = rawEnrollmentId !== undefined && rawEnrollmentId !== null
      ? (typeof rawEnrollmentId === 'number' ? rawEnrollmentId : (typeof rawEnrollmentId === 'string' ? (/^\d+$/.test(rawEnrollmentId) ? Number(rawEnrollmentId) : rawEnrollmentId) : null))
      : null

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
        console.log(`🔍 [API toggle-exercise] Searching in ${table} for:`, { clientId: user.id, fecha: targetDate, enrollmentId, activityId })
        let query = supabase.from(table).select(selectFields(table))
          .eq('cliente_id', user.id)
          .eq('fecha', targetDate)

        if (enrollmentId) {
          query = query.or(`enrollment_id.eq.${enrollmentId},enrollment_id.is.null`)
        } else {
          query = query.eq('actividad_id', activityId)
        }

        const { data, error } = await query.order('id', { ascending: false })

        if (error) {
          console.error(`❌ [API toggle-exercise] Error querying ${table}:`, error.message)
          continue
        }

        if (data && data.length > 0) {
          progressTable = table
          progressRecord = data[0]
          console.log(`✅ [API toggle-exercise] Found record in ${table}, ID: ${progressRecord.id}`)
          break
        }
      } catch (err: any) {
        console.error(`💥 [API toggle-exercise] Crash querying ${table}:`, err.message)
      }
    }

    if (!progressTable || !progressRecord) {
      console.log(`ℹ️ No se encontró registro para ${targetDate}. Inicializando...`)

      // Obtener detalles de la planificación para inicializar
      const { data: planData, error: planError } = await supabase
        .from('planificacion_ejercicios')
        .select('*')
        .eq('actividad_id', activityId)
        .eq('dia', new Date(targetDate).getDay() || 7) // Fallback simple para el día
        .single()

      const pents: Record<string, any> = {}
      const info: Record<string, any> = {}
      const details: Record<string, any> = {}

      if (planData && planData.ejercicios) {
        const bloques = typeof planData.ejercicios === 'string' ? JSON.parse(planData.ejercicios) : planData.ejercicios
        Object.keys(bloques).forEach(bKey => {
          const block = bloques[bKey]
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

      const currentTable = requestedCategoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente'
      const { data: newRecord, error: insertError } = await supabase
        .from(currentTable)
        .insert({
          cliente_id: user.id,
          actividad_id: activityId,
          enrollment_id: enrollmentId,
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

    // 2. Parsear y normalizar
    const rawComp = safeJsonParse(progressRecord.ejercicios_completados) || {}
    const rawPend = safeJsonParse(progressRecord.ejercicios_pendientes) || {}

    const removeFromRef = (ref: any, ejId: number, b: number, o: number, key: string) => {
      if (!ref) return null
      const _internal = (target: any) => {
        if (Array.isArray(target)) {
          const idx = target.findIndex((e: any) => {
            if (!e) return false
            if (typeof e === 'string') return e === key || e === String(ejId)
            if (typeof e === 'number') return e === ejId
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
      let found = _internal(ref)
      if (found) return found
      if (ref.ejercicios) {
        found = _internal(ref.ejercicios)
        if (found) return found
      }
      return null
    }

    const addToRef = (ref: any, ejId: number, b: number, o: number, key: string, val: any) => {
      let target = ref
      if (ref.ejercicios) target = ref.ejercicios
      const valueToInsert = val !== undefined && val !== null ? val : ejId
      if (Array.isArray(target)) {
        target.push(valueToInsert)
      } else if (typeof target === 'object' && target !== null) {
        target[key] = valueToInsert
      }
    }

    const processToggle = (itemExId: number, itemExB: number, itemExO: number) => {
      const itemExKey = `${itemExId}_${itemExB}_${itemExO}`
      const removedFromComp = removeFromRef(rawComp, itemExId, itemExB, itemExO, itemExKey)
      if (removedFromComp) {
        addToRef(rawPend, itemExId, itemExB, itemExO, itemExKey, removedFromComp)
        return false
      } else {
        const removedFromPend = removeFromRef(rawPend, itemExId, itemExB, itemExO, itemExKey)
        if (removedFromPend) {
          addToRef(rawComp, itemExId, itemExB, itemExO, itemExKey, removedFromPend)
          return true
        } else {
          addToRef(rawComp, itemExId, itemExB, itemExO, itemExKey, itemExId)
          return true
        }
      }
    }

    let isCompleted = false
    const exercisesToProcess = body.exercises && Array.isArray(body.exercises) ? body.exercises : null

    if (exercisesToProcess) {
      console.log(`📦 [API toggle-exercise] BULK processing ${exercisesToProcess.length} exercises`)
      exercisesToProcess.forEach((ex: any) => {
        const eId = Number(ex.id || (typeof ex === 'object' ? ex.ejercicio_id : ex))
        const eB = Number(ex.bloque || 1)
        const eO = Number(ex.orden || 1)
        processToggle(eId, eB, eO)
      })
      isCompleted = true // Bulk is considered "completed" action usually
    } else {
      const exId = ejercicioId
      const exB = bloqueNum
      const exO = ordenNum
      isCompleted = processToggle(exId, exB, exO)
    }

    const persist = (orig: any, next: any) => typeof orig === 'string' ? JSON.stringify(next) : next

    const { error: updErr } = await supabase
      .from(progressTable)
      .update({
        ejercicios_completados: persist(progressRecord.ejercicios_completados, rawComp),
        ejercicios_pendientes: persist(progressRecord.ejercicios_pendientes, rawPend)
      })
      .eq('id', progressRecord.id)

    if (updErr) {
      return NextResponse.json({ error: 'Error al actualizar base de datos', details: updErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isCompleted,
      recordId: progressRecord.id
    })

  } catch (error: any) {
    console.error('❌ [API toggle-exercise] UNHANDLED EXCEPTION:', error)
    return NextResponse.json({ error: 'Error interno del servidor', message: error?.message }, { status: 500 })
  }
}
