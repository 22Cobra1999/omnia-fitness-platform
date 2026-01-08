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
        meet_credits_total
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
    const progressCache = new Map<string, { completedSum: number; totalSum: number; lastCompletedDate: string | null }>()
    const computeProgressAggForActivity = async (clientId: string, activityId: number, activityType: string) => {
      const cacheKey = `${clientId}:${activityId}:${activityType}`
      const cached = progressCache.get(cacheKey)
      if (cached) return cached

      const actType = String(activityType || '')
      const isNutrition = actType.includes('nutri')
      const table = isNutrition ? 'progreso_cliente_nutricion' : 'progreso_cliente'

      const { data: progressRows } = await supabase
        .from(table)
        .select('fecha, ejercicios_completados, ejercicios_pendientes')
        .eq('cliente_id', clientId)
        .eq('actividad_id', activityId)
        .lte('fecha', todayIso)
        .order('fecha', { ascending: false })
        .limit(120)

      let completedSum = 0
      let totalSum = 0
      let lastCompletedDate: string | null = null

      for (const r of progressRows || []) {
        const c = countKeys((r as any)?.ejercicios_completados)
        const p = countKeys((r as any)?.ejercicios_pendientes)
        const fecha = String((r as any)?.fecha || '')
        completedSum += c
        totalSum += c + p
        if (c > 0 && fecha) {
          if (!lastCompletedDate || fecha > lastCompletedDate) {
            lastCompletedDate = fecha
          }
        }
      }

      const result = { completedSum, totalSum, lastCompletedDate }
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

      // Progreso total: agregado/ponderado por total de ejercicios (sumatoria de progreso tables)
      let completedAgg = 0
      let totalAgg = 0
      let lastCompletedDateAgg: string | null = null
      for (const enrollment of client.enrollments || []) {
        const activity = activities?.find((a: any) => String(a.id) === String(enrollment.activity_id))
        const activityIdNum = Number(enrollment?.activity_id)
        if (!activity || !Number.isFinite(activityIdNum)) continue
        const agg = await computeProgressAggForActivity(String(client.id), activityIdNum, String(activity?.type || ''))
        completedAgg += agg.completedSum
        totalAgg += agg.totalSum
        if (agg.lastCompletedDate) {
          if (!lastCompletedDateAgg || agg.lastCompletedDate > lastCompletedDateAgg) {
            lastCompletedDateAgg = agg.lastCompletedDate
          }
        }
      }
      const progress = totalAgg > 0 ? Math.round((completedAgg / totalAgg) * 100) : 0

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        avatar_url: client.avatar_url,
        meet_credits_available: meetCreditsAvailable,
        progress,
        status: clientStatus,
        lastActive: formatLastActive(lastCompletedDateAgg),
        totalExercises: 0,
        completedExercises: 0,
        totalRevenue,
        activitiesCount: (client.activities || []).length,
        todoCount,
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
        name: error?.name
      }
    })
  }
}