import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

// Hacer la ruta dinámica para evitar evaluación durante el build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const authSupabase = await createRouteHandlerClient()
  let user = null as any
  const { data: userData, error: authError } = await authSupabase.auth.getUser()
  if (!authError && userData?.user) {
    user = userData.user
  } else {
    const { data: sessionData } = await authSupabase.auth.getSession()
    if (sessionData?.session?.user) {
      user = sessionData.session.user
    }
  }

  if (!user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  // Usar el cliente autenticado (con cookies) para respetar RLS y evitar depender de service role.
  const supabase = authSupabase

  try {

    const countKeys = (raw: any): number => {
      if (!raw) return 0
      if (Array.isArray(raw)) return raw.length
      if (typeof raw === 'object') return Object.keys(raw).length
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed.length
          if (parsed && typeof parsed === 'object') return Object.keys(parsed).length
          return 0
        } catch {
          return 0
        }
      }
      return 0
    }

    const formatLastActive = (iso: string | null): string => {
      if (!iso) return 'Nunca'
      try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return 'Nunca'
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
      } catch {
        return 'Nunca'
      }
    }

    // Primero, traer solo actividades del coach autenticado
    const { data: coachActivities, error: coachActivitiesError } = await supabase
      .from('activities')
      .select('id, title, type, coach_id, price, categoria, included_meet_credits')
      .eq('coach_id', user.id)

    if (coachActivitiesError) {
      console.error('[coach-clients] Error en activities (coach filter):', coachActivitiesError)
      return NextResponse.json({
        success: true,
        clients: [],
        warning: 'Error obteniendo actividades',
        debug: {
          coachId: user.id,
          coachActivitiesCount: 0,
          enrollmentsCount: 0,
          coachActivitiesError: coachActivitiesError.message
        }
      })
    }

    if (!coachActivities || coachActivities.length === 0) {
      return NextResponse.json({
        success: true,
        clients: [],
        debug: {
          coachId: user.id,
          coachActivitiesCount: 0,
          enrollmentsCount: 0
        }
      })
    }

    const coachActivityIds = coachActivities.map((a: any) => a.id)

    // Obtener inscripciones
    let { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        client_id,
        status,
        todo_list,
        activity_id,
        meet_credits_total,
        start_date
      `)
      .in('status', ['activa', 'active', 'pendiente', 'pending', 'finalizada', 'finished', 'expirada', 'expired'])
      .in('activity_id', coachActivityIds)

    // Fallback: en algunos esquemas activity_id puede ser string (bigint/text) y el filtro numérico no matchea.
    // Reintentar con ids como string si no hubo resultados.
    if (!enrollmentsError && (!enrollments || enrollments.length === 0)) {
      const coachActivityIdsStr = coachActivityIds.map((id: any) => String(id))
      const retry = await supabase
        .from('activity_enrollments')
        .select(`
          id,
          client_id,
          status,
          todo_list,
          activity_id
        `)
        .in('status', ['activa', 'active', 'pendiente', 'pending', 'finalizada', 'finished', 'expirada', 'expired'])
        .in('activity_id', coachActivityIdsStr as any)

      if (!retry.error) {
        enrollments = retry.data
      }
    }

    if (enrollmentsError) {
      console.error('[coach-clients] Error en enrollments:', enrollmentsError)
      return NextResponse.json({ success: false, error: enrollmentsError.message }, { status: 500 })
    }


    if (!enrollments || enrollments.length === 0) {
      const coachActivityIdsSample = coachActivityIds.slice(0, 5).map((id: any) => ({ value: id, type: typeof id }))
      return NextResponse.json({
        success: true,
        clients: [],
        debug: {
          coachId: user.id,
          coachActivitiesCount: coachActivityIds.length,
          enrollmentsCount: 0,
          coachActivityIdsSample
        }
      })
    }

    const enrollmentStatuses = Array.from(new Set((enrollments || []).map((e: any) => e?.status).filter(Boolean)))

    // Actividades ya están prefiltradas por coach
    const activities = coachActivities

    // Obtener datos de usuarios
    const clientIds = [...new Set(enrollments.map((e: any) => e.client_id))]

    // Créditos de meet por cliente (fuente de verdad): client_meet_credits_ledger
    // Fallback: si no existe/no hay datos, usar sum(meet_credits_total) desde enrollments.
    const meetCreditsAvailableByClient = new Map<string, number>()
    let usedLedgerFallback = false
    try {
      const { data: ledger, error: ledgerError } = await supabase
        .from('client_meet_credits_ledger')
        .select('client_id, meet_credits_available')
        .eq('coach_id', user.id)

      if (!ledgerError && Array.isArray(ledger) && ledger.length > 0) {
        for (const row of ledger) {
          const cid = String((row as any)?.client_id || '')
          if (!cid) continue
          meetCreditsAvailableByClient.set(cid, Math.max(Number((row as any)?.meet_credits_available ?? 0), 0))
        }
      } else {
        usedLedgerFallback = true
      }
    } catch {
      usedLedgerFallback = true
    }

    if (usedLedgerFallback) {
      for (const e of enrollments || []) {
        const cid = String(e?.client_id || '')
        if (!cid) continue
        const total = Number(e?.meet_credits_total ?? 0)
        const delta = Number.isFinite(total) ? total : 0
        meetCreditsAvailableByClient.set(cid, (meetCreditsAvailableByClient.get(cid) || 0) + Math.max(delta, 0))
      }
    }

    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', clientIds)

    if (usersError) {
      console.error('[coach-clients] Error en users:', usersError)
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 })
    }

    const { data: clientsTable } = await supabase
      .from('clients')
      .select('id, birth_date')
      .in('id', clientIds)

    const birthDateMap = new Map<string, string | null>()
    if (clientsTable) {
      clientsTable.forEach((c: any) => birthDateMap.set(c.id, c.birth_date))
    }

    // NEW: Fetch last active date from progress tables
    const { data: lastProgress } = await supabase
      .from('progreso_diario_actividad')
      .select('cliente_id, fecha')
      .in('cliente_id', clientIds)
      .order('fecha', { ascending: false })

    const lastActiveMap = new Map<string, string>()
    if (lastProgress) {
      lastProgress.forEach((p: any) => {
        if (!lastActiveMap.has(p.cliente_id)) {
          lastActiveMap.set(p.cliente_id, p.fecha)
        }
      })
    }

    // Buscar pagos reales en banco (prefer seller_amount, fallback amount_paid)
    const enrollmentIdsAll = (enrollments || [])
      .map((e: any) => e?.id)
      .filter((id: any) => typeof id === 'number' || typeof id === 'string')
      .map((id: any) => (typeof id === 'number' ? id : Number(id)))
      .filter((id: number) => Number.isFinite(id) && id > 0)

    let bancoRows: any[] = []
    if (enrollmentIdsAll.length > 0 || coachActivityIds.length > 0) {
      let bancoQuery = supabase
        .from('banco')
        .select('id, enrollment_id, activity_id, client_id, seller_amount, amount_paid, payment_status')

      const conditions: string[] = []
      if (enrollmentIdsAll.length > 0) {
        conditions.push(`enrollment_id.in.(${enrollmentIdsAll.join(',')})`)
      }
      if (coachActivityIds.length > 0) {
        const ids = coachActivityIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
        if (ids.length > 0) {
          conditions.push(`activity_id.in.(${ids.join(',')})`)
        }
      }
      if (conditions.length > 0) {
        bancoQuery = bancoQuery.or(conditions.join(','))
      }

      const { data: bancoData } = await bancoQuery
      bancoRows = bancoData || []
    }

    const paidByEnrollmentId = new Map<number, number>()
    for (const row of bancoRows) {
      const paid = Number((row as any)?.seller_amount ?? (row as any)?.amount_paid ?? 0) || 0
      const enrId = Number((row as any)?.enrollment_id)
      if (Number.isFinite(enrId) && enrId > 0) {
        paidByEnrollmentId.set(enrId, (paidByEnrollmentId.get(enrId) || 0) + paid)
      }
    }

    // Progreso agregado + última ejercitación (se toma de tablas progreso_cliente / progreso_cliente_nutricion)
    const todayIso = new Date().toISOString().slice(0, 10)
    const progressCache = new Map<string, { progressPercent: number; diasAtraso: number; itemsPendientes: number; diasCompletados: number; itemsCompletados: number; diasTotales: number; alertLevel: number; alertLabel: string }>()
    const computeProgressAggForActivity = async (clientId: string, activityId: number, activityType: string, enrollmentId?: number) => {
      const cacheKey = `${clientId}:${activityId}:${activityType}:${enrollmentId || 'all'}`
      const cached = progressCache.get(cacheKey)
      if (cached) return cached

      // 1. Obtener Estadísticas Diarias (Fitness, Nutrición, Talleres)
      // Usamos la tabla optimizada 'progreso_diario_actividad'
      let query = supabase
        .from('progreso_diario_actividad')
        .select('fecha, items_objetivo, items_completados')
        .eq('cliente_id', clientId)
        .eq('actividad_id', activityId)

      if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId)
      }

      const { data: dailyStats, error: dailyError } = await query

      let diasCompletados = 0
      let diasTotales = 0
      let itemsCompletados = 0
      let itemsTotalesObjetivo = 0
      let diasAtraso = 0
      let itemsPendientes = 0

      if (!dailyError && dailyStats) {
        const uniqueDays = new Map()
        dailyStats.forEach((d: any) => uniqueDays.set(d.fecha, d))
        diasTotales = uniqueDays.size

        uniqueDays.forEach((d: any) => {
          const objetivo = d.items_objetivo || 0
          const completado = d.items_completados || 0
          const isPast = d.fecha < todayIso

          itemsCompletados += completado
          itemsTotalesObjetivo += objetivo

          // Día Completado: Completó TODO lo del día
          // (Para talleres, objetivo=1, completado=1 si asistió)
          if (objetivo > 0 && completado >= objetivo) {
            diasCompletados++
          } else if (isPast && objetivo > 0 && completado < objetivo) {
            // Día Atrasado: Pasado e incompleto
            diasAtraso++
            itemsPendientes += (objetivo - completado)
          } else if (!isPast && objetivo > 0 && completado < objetivo) {
            // Día corriente incompleto (se suma a pendientes item-level, aunque no cuente "día" atrasado aún)
            itemsPendientes += (objetivo - completado)
          }
        })
      }

      // 2. Obtener Progreso de Documentos (si aplica)
      // client_document_progress no está en la tabla diaria porque no tiene fecha
      let docQuery = supabase
        .from('client_document_progress')
        .select('completed', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('activity_id', activityId)

      if (enrollmentId) {
        docQuery = docQuery.eq('enrollment_id', enrollmentId)
      }

      const { data: docData } = await docQuery
      if (docData && docData.length > 0) {
        const docTotal = docData.length
        const docCompleted = docData.filter((d: any) => d.completed).length

        itemsTotalesObjetivo += docTotal
        itemsCompletados += docCompleted
        itemsPendientes += (docTotal - docCompleted)
        // Documentos no suman "días"
      }

      // El progreso real es % de DÍAS completados sobre total de días registrados (o esperados)
      // Si queremos ser estrictos: Días Completados / Días Totales Registrados * 100
      let progressPercent = 0

      // Lógica Híbrida:
      // Si hay DÍAS (Fitness/Nutri/Workshop), el % se basa en días.
      // Si NO hay días (Solo Docs), el % se basa en Items.
      if (diasTotales > 0) {
        progressPercent = Math.round((diasCompletados / diasTotales) * 100)
      } else if (itemsTotalesObjetivo > 0) {
        progressPercent = Math.round((itemsCompletados / itemsTotalesObjetivo) * 100)
      }

      const result = {
        progressPercent,
        diasAtraso,
        itemsPendientes,
        diasCompletados,
        itemsCompletados,
        diasTotales,
        alertLevel: 0,
        alertLabel: ''
      }

      // Calculate alert based on delay percent (past missing items/days)
      let delayPercent = 0
      if (activityType?.toLowerCase() === 'documento' || activityType?.toLowerCase() === 'document') {
        delayPercent = itemsTotalesObjetivo > 0 ? (itemsPendientes / itemsTotalesObjetivo) * 100 : 0
      } else {
        delayPercent = diasTotales > 0 ? (diasAtraso / diasTotales) * 100 : 0
      }

      if (delayPercent > 50) {
        result.alertLevel = 3
        result.alertLabel = 'Crítico'
      } else if (delayPercent > 20) {
        result.alertLevel = 2
        result.alertLabel = 'Moderado'
      } else if (delayPercent > 0) {
        result.alertLevel = 1
        result.alertLabel = 'Leve'
      }

      progressCache.set(cacheKey, result)
      return result
    }

    // Agrupar por cliente
    const clientsMap = new Map()

    for (const enrollment of enrollments || []) {
      const clientId = enrollment.client_id
      const user = users?.find((u: any) => u.id === clientId)
      const activity = activities?.find((a: any) => String(a.id) === String(enrollment.activity_id))

      if (!user || !activity) continue

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          id: clientId,
          name: user.full_name || 'Cliente',
          email: user.email || '',
          avatar_url: user.avatar_url || null,
          birth_date: birthDateMap.get(clientId) || null,
          activities: [],
          enrollments: []
        })
      }

      const clientData = clientsMap.get(clientId)
      // Agregar precio al activity
      const activityWithPrice = {
        ...activity,
        amountPaid: activity.price || 0  // Usar el precio de la actividad
      }
      clientData.activities.push(activityWithPrice)
      clientData.enrollments.push(enrollment)
    }

    // Fallback básico si por algún motivo el procesamiento avanzado falla
    const basicClients = await Promise.all(Array.from(clientsMap.values()).map(async (client: any) => {
      const statuses = new Set<string>((client.enrollments || []).map((e: any) => String(e?.status || '').toLowerCase()))
      const hasActive = statuses.has('activa') || statuses.has('active')
      const hasPending = statuses.has('pendiente') || statuses.has('pending')
      const clientStatus: 'active' | 'pending' | 'inactive' = hasActive ? 'active' : hasPending ? 'pending' : 'inactive'

      const meetCreditsAvailable = Math.max(
        Number(meetCreditsAvailableByClient.get(String(client.id)) || 0),
        0
      )

      // To Do: total de tasks por enrollment.todo_list
      const todoCount = (client.enrollments || []).reduce((sum: number, enrollment: any) => {
        const raw = enrollment?.todo_list
        if (!raw) return sum
        if (Array.isArray(raw)) return sum + raw.length
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            return sum + (Array.isArray(parsed) ? parsed.length : 0)
          } catch {
            return sum
          }
        }
        return sum
      }, 0)

      // Ingresos reales (solo compras de actividades del coach)
      const totalRevenue = (client.enrollments || []).reduce((sum: number, enrollment: any) => {
        const enrId = Number(enrollment?.id)
        const paid = Number.isFinite(enrId) ? (paidByEnrollmentId.get(enrId) || 0) : 0
        return sum + paid
      }, 0)

      // Progreso total: promedio de los porcentajes de CADA ACTIVIDAD ÚNICA
      const activeProgressByActivity = new Map<number, number>()
      let totalItemsPendientes = 0
      let maxAlertLevel = 0
      let maxAlertLabel = ''
      let lastCompletedDateAgg: string | null = null

      for (const enrollment of client.enrollments || []) {
        const activityIdNum = Number(enrollment?.activity_id)
        const activity = activities?.find((a: any) => String(a.id) === String(activityIdNum))
        if (!activity || !Number.isFinite(activityIdNum)) continue

        const agg = await computeProgressAggForActivity(String(client.id), activityIdNum, String(activity?.type || ''), enrollment.id)

        const progPerc = agg.progressPercent || 0
        const isCompleted = progPerc >= 100 ||
          ['finalizada', 'finished', 'expirada', 'expired'].includes(enrollment.status?.toLowerCase())
        const hasStarted = !!enrollment.start_date || !!agg.itemsCompletados

        if (!isCompleted && hasStarted) {
          // Si hay duplicados, tomamos el mayor progreso (probablemente el más actual/relevante)
          const currentMax = activeProgressByActivity.get(activityIdNum) || 0
          activeProgressByActivity.set(activityIdNum, Math.max(currentMax, progPerc))

          // Aggregate Alert
          if (agg.alertLevel > maxAlertLevel) {
            maxAlertLevel = agg.alertLevel
            maxAlertLabel = agg.alertLabel
          }
        }
        totalItemsPendientes += (agg.itemsPendientes || 0)
      }

      const uniqueActiveActivitiesCount = activeProgressByActivity.size
      const totalProgressPercentSum = Array.from(activeProgressByActivity.values()).reduce((a, b) => a + b, 0)
      const progress = uniqueActiveActivitiesCount > 0 ? Math.round(totalProgressPercentSum / uniqueActiveActivitiesCount) : 0
      const age = client.birth_date ? (new Date().getFullYear() - new Date(client.birth_date).getFullYear()) : 0

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        avatar_url: client.avatar_url,
        meet_credits_available: meetCreditsAvailable,
        progress,
        age,
        status: clientStatus,
        totalRevenue,
        lastActive: formatLastActive(lastActiveMap.get(client.id) || client.updated_at || ''),
        activitiesCount: (client.activities || []).length,
        todoCount,
        hasAlert: maxAlertLevel > 0,
        alertLabel: maxAlertLabel,
        alertLevel: maxAlertLevel,
        activities: (client.activities || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          amountPaid: a.amountPaid || a.price || 0
        }))
      }
    }))

    const coachActivityIdsSample = coachActivityIds.slice(0, 5).map((id: any) => ({ value: id, type: typeof id }))
    const enrollmentsSample = (enrollments || []).slice(0, 5).map((e: any) => ({
      id: e.id,
      activity_id: e.activity_id,
      activity_id_type: typeof e.activity_id,
      status: e.status
    }))

    return NextResponse.json({
      success: true,
      clients: basicClients,
      debug: {
        coachId: user.id,
        coachActivitiesCount: coachActivityIds.length,
        enrollmentsCount: enrollments?.length || 0,
        enrollmentStatuses,
        clientsMapCount: clientsMap.size,
        usedFallback: usedLedgerFallback,
        coachActivityIdsSample,
        enrollmentsSample
      }
    })

  } catch (error: any) {
    console.error('[coach-clients] Unhandled error:', error)
    return NextResponse.json({
      success: true,
      clients: [],
      warning: 'Error interno',
      debug: {
        message: error?.message,
        name: error?.name,
        totalActivitiesInTable: (await supabase.from('activities').select('*', { count: 'exact', head: true })).count,
        totalEnrollmentsInTable: (await supabase.from('activity_enrollments').select('*', { count: 'exact', head: true })).count
      }
    })
  }
}