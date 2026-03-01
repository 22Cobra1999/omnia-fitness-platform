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

    const { data: docProgressData } = await supabase
      .from('client_document_progress')
      .select('enrollment_id, completed')
      .in('enrollment_id', enrollmentIdsAll)
    const docProgress = docProgressData || []

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
    const progressCache = new Map<string, { progressPercent: number; diasAtraso: number; itemsPendientes: number; diasCompletados: number; itemsCompletados: number; itemsTotalesObjetivo: number; diasTotales: number; alertLevel: number; alertLabel: string }>()
    const computeProgressAggForActivity = async (clientId: string, activityId: number, activityType: string, enrollmentId?: number, activityCategory: string = '') => {
      const cacheKey = `${clientId}:${activityId}:${activityType}:${enrollmentId || 'all'}:${activityCategory}`
      const cached = progressCache.get(cacheKey)
      if (cached) return cached

      // 1. Obtener Estadísticas Diarias (Fitness, Nutrición, Talleres)
      // Usamos la tabla optimizada 'progreso_diario_actividad'
      let query = supabase
        .from('progreso_diario_actividad')
        .select('fecha, items_objetivo, items_completados, area')
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

      const areaStats = {
        fitness: { completed: 0, total: 0, absent: 0 },
        nutricion: { completed: 0, total: 0, absent: 0 }
      }

      if (!dailyError && dailyStats) {
        const uniqueDays = new Map()
        dailyStats.forEach((d: any) => {
          const key = `${d.fecha}_${d.area}`
          uniqueDays.set(key, d)
        })

        // For diasTotales we use unique dates across all areas
        const uniqueDates = new Set(dailyStats.map((d: any) => d.fecha))
        diasTotales = uniqueDates.size

        dailyStats.forEach((d: any) => {
          const objetivo = d.items_objetivo || 0
          const completado = d.items_completados || 0
          const isPast = d.fecha < todayIso
          const area = String(d.area || '').toLowerCase()
          const typeLower = activityType.toLowerCase()
          const catLower = activityCategory.toLowerCase()

          itemsCompletados += completado
          itemsTotalesObjetivo += objetivo

          const isFitness = area.includes('fit') || area.includes('ejercicio') || area.includes('entren') ||
            catLower.includes('fit') || catLower.includes('ejercicio') || catLower.includes('entren') ||
            (!d.area && (typeLower.includes('fit') || typeLower.includes('rutina') || typeLower.includes('train') || typeLower.includes('workout') || typeLower.includes('ejercicio')))

          const isNutricion = area.includes('nutri') || area.includes('dieta') || area.includes('plato') || area.includes('comida') ||
            catLower.includes('nutri') || catLower.includes('comida') || catLower.includes('alimento') ||
            (!d.area && (typeLower.includes('nutri') || typeLower.includes('meal') || typeLower.includes('comida') || typeLower.includes('plan') || typeLower.includes('dieta')))

          if (isFitness) {
            areaStats.fitness.completed += completado
            areaStats.fitness.total += objetivo
            if (isPast && completado < objetivo) areaStats.fitness.absent += (objetivo - completado)
          } else if (isNutricion) {
            areaStats.nutricion.completed += completado
            areaStats.nutricion.total += objetivo
            if (isPast && completado < objetivo) areaStats.nutricion.absent += (objetivo - completado)
          }

          // Día Completado (Global per row/activity combo)
          // Note: a "day" is usually per activity. If activity has 2 areas, we might need a better day logic.
          // For now keep legacy day logic:
          if (objetivo > 0 && completado >= objetivo) {
            // We'll count completed days later per date to be more accurate
          }
        })

        // Refined Day Logic: A day is completed if ALL rows for that date (in this activity) are completed
        Array.from(uniqueDates).forEach((date: any) => {
          const rowsForDate = dailyStats.filter((d: any) => d.fecha === date)
          const isCompleted = rowsForDate.every((r: any) => r.items_objetivo === 0 || r.items_completados >= r.items_objetivo)
          const isPast = date < todayIso

          if (isCompleted) {
            diasCompletados++
          } else if (isPast) {
            diasAtraso++
          }
        })
      }

      // 2. Obtener Progreso de Documentos (si aplica)
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
        // Documents are usually considered "Fitness" or generic. Let's add to fitness if no other areas?
        // Actually keep them separate if needed, but for now add to fitness.
        areaStats.fitness.completed += docCompleted
        areaStats.fitness.total += docTotal
        areaStats.fitness.absent += (docTotal - docCompleted)
      }

      itemsPendientes = itemsTotalesObjetivo - itemsCompletados

      let progressPercent = 0
      if (itemsTotalesObjetivo > 0) {
        progressPercent = Math.round((itemsCompletados / itemsTotalesObjetivo) * 100)
      } else if (diasTotales > 0) {
        progressPercent = Math.round((diasCompletados / diasTotales) * 100)
      }

      const result = {
        progressPercent,
        diasAtraso,
        itemsPendientes,
        diasCompletados,
        itemsCompletados,
        itemsTotalesObjetivo,
        diasTotales,
        areaStats, // New detailed stats
        alertLevel: 0,
        alertLabel: ''
      }

      // Calculate alert
      let delayPercent = diasTotales > 0 ? (diasAtraso / diasTotales) * 100 : 0
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

      progressCache.set(cacheKey, result as any)
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

    // Fetch real pending tasks counts from coach_client_pendings
    const { data: allPendingTasks } = await supabase
      .from('coach_client_pendings')
      .select('client_id')
      .eq('coach_id', user.id)

    const pendingTasksCountByClient = new Map<string, number>()
    if (allPendingTasks) {
      allPendingTasks.forEach((p: any) => {
        const cid = String(p.client_id)
        pendingTasksCountByClient.set(cid, (pendingTasksCountByClient.get(cid) || 0) + 1)
      })
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

      // To Do: Usar conteo real de coach_client_pendings
      const todoCount = pendingTasksCountByClient.get(String(client.id)) || 0

      // Ingresos reales (solo compras de actividades del coach)
      const totalRevenue = (client.enrollments || []).reduce((sum: number, enrollment: any) => {
        const enrId = Number(enrollment?.id)
        const paid = Number.isFinite(enrId) ? (paidByEnrollmentId.get(enrId) || 0) : 0
        return sum + paid
      }, 0)

      // Progreso total: promedio de los porcentajes de CADA ACTIVIDAD ÚNICA
      const activeProgressByActivity = new Map<number, number>()
      let totalItemsPendientes = 0
      let totalItemsCompletados = 0
      let totalItemsObjetivo = 0
      let totalDiasCompletados = 0
      let totalDiasAtraso = 0
      let totalDiasRegistrados = 0
      let maxAlertLevel = 0
      let maxAlertLabel = ''

      const fitStats = { completed: 0, total: 0, absent: 0 }
      const nutriStats = { completed: 0, total: 0, absent: 0 }

      for (const enrollment of client.enrollments || []) {
        const activityIdNum = Number(enrollment?.activity_id)
        const activity = activities?.find((a: any) => String(a.id) === String(activityIdNum))
        if (!activity || !Number.isFinite(activityIdNum)) continue

        const typeLower = String(activity?.type || '').toLowerCase()
        const catLower = String(activity?.categoria || '').toLowerCase()
        const isDoc = typeLower.includes('doc') || catLower.includes('doc')

        const agg = await computeProgressAggForActivity(String(client.id), activityIdNum, typeLower, enrollment.id, catLower)

        let progPerc = agg.progressPercent || 0

        // Si es documento, el progreso viene de docProgress
        if (isDoc) {
          const docRows = docProgress.filter((d: any) => Number(d.enrollment_id) === Number(enrollment.id))
          const completedCount = docRows.filter((d: any) => d.completed).length
          const totalCount = docRows.length
          if (totalCount > 0) {
            progPerc = Math.round((completedCount / totalCount) * 100)

            const isFit = typeLower.includes('fit') || catLower.includes('fit') || catLower.includes('entren') || catLower.includes('ejercicio')
            const isNutri = typeLower.includes('nutri') || catLower.includes('nutri') || catLower.includes('comida') || catLower.includes('alimento') || catLower.includes('dieta') || catLower.includes('plato')

            if (isFit) {
              fitStats.completed += completedCount
              fitStats.total += totalCount
            } else if (isNutri) {
              nutriStats.completed += completedCount
              nutriStats.total += totalCount
            }
          }
        }

        const isCompleted = progPerc >= 100 ||
          ['finalizada', 'finished', 'expirada', 'expired', 'completed'].includes(enrollment.status?.toLowerCase())
        const hasStarted = !!enrollment.start_date || !!agg.itemsCompletados || (isDoc && progPerc > 0)

        if (hasStarted) {
          const currentMax = activeProgressByActivity.get(activityIdNum) || 0
          activeProgressByActivity.set(activityIdNum, Math.max(currentMax, progPerc))

          totalItemsPendientes += (agg.itemsPendientes || 0)
          totalItemsCompletados += (agg.itemsCompletados || 0)
          totalItemsObjetivo += (agg.itemsTotalesObjetivo || 0)

          totalDiasCompletados += (agg.diasCompletados || 0)
          totalDiasAtraso += (agg.diasAtraso || 0)
          totalDiasRegistrados += (agg.diasTotales || 0)

          // Area Stats (solo si no es documento, ya que los documentos los sumamos arriba)
          if ((agg as any).areaStats && !isDoc) {
            fitStats.completed += (agg as any).areaStats.fitness.completed
            fitStats.total += (agg as any).areaStats.fitness.total
            fitStats.absent += (agg as any).areaStats.fitness.absent

            nutriStats.completed += (agg as any).areaStats.nutricion.completed
            nutriStats.total += (agg as any).areaStats.nutricion.total
            nutriStats.absent += (agg as any).areaStats.nutricion.absent
          }

          if (agg.alertLevel > maxAlertLevel) {
            maxAlertLevel = agg.alertLevel
            maxAlertLabel = agg.alertLabel
          }
        }
      }

      // Calculate streak: Look at the most recent days in progreso_diario_actividad
      let currentStreak = 0;
      try {
        const { data: recentDays } = await supabase
          .from('progreso_diario_actividad')
          .select('fecha, items_objetivo, items_completados')
          .eq('cliente_id', client.id)
          .lte('fecha', todayIso)
          .order('fecha', { ascending: false })
          .limit(60);

        if (recentDays && recentDays.length > 0) {
          const uniqueDatesArr = Array.from(new Set(recentDays.map((d: any) => d.fecha))).sort((a: any, b: any) => b.localeCompare(a));

          for (let i = 0; i < uniqueDatesArr.length; i++) {
            const dateStr = String(uniqueDatesArr[i]);
            const dayRows = recentDays.filter((d: any) => d.fecha === dateStr);
            const dayCompleted = dayRows.every((d: any) => d.items_objetivo === 0 || d.items_completados >= d.items_objetivo);

            if (dayCompleted) {
              currentStreak++;
            } else {
              if (dateStr === todayIso) continue;
              break;
            }
          }
        }
      } catch (e) {
        console.warn('Error calculating streak for client', client.id, e);
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
        progress: progress,
        itemsPending: totalItemsPendientes,
        age: age,
        status: clientStatus,
        totalRevenue,
        lastActive: formatLastActive(lastActiveMap.get(client.id) || client.updated_at || ''),
        activitiesCount: (client.activities || []).length,
        todoCount,
        hasAlert: maxAlertLevel > 0,
        alertLabel: maxAlertLabel,
        alertLevel: maxAlertLevel,
        // Detailed Activity metrics for Rings
        daysCompleted: totalDiasCompletados,
        absentDays: totalDiasAtraso,
        daysTotal: totalDiasRegistrados || 30,
        completedExercises: totalItemsCompletados,
        failedExercises: totalItemsPendientes,
        totalExercises: totalItemsObjetivo,
        streak: currentStreak,
        // New Area Stats
        fitStats,
        nutriStats,
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