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

  const supabase = authSupabase

  try {
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

    const { data: coachActivities, error: coachActivitiesError } = await supabase
      .from('activities')
      .select('id, title, type, coach_id, price, categoria, included_meet_credits')
      .eq('coach_id', user.id)

    if (coachActivitiesError) return NextResponse.json({ success: true, clients: [], warning: 'Error obteniendo actividades' })
    if (!coachActivities || coachActivities.length === 0) return NextResponse.json({ success: true, clients: [] })

    const coachActivityIds = coachActivities.map((a: any) => a.id)

    let { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('id, client_id, status, todo_list, activity_id, meet_credits_total, start_date')
      .in('status', ['activa', 'active', 'pendiente', 'pending', 'finalizada', 'finished', 'expirada', 'expired'])
      .in('activity_id', coachActivityIds)

    if (enrollmentsError) return NextResponse.json({ success: false, error: enrollmentsError.message }, { status: 500 })
    if (!enrollments || enrollments.length === 0) return NextResponse.json({ success: true, clients: [] })

    const clientIds = [...new Set(enrollments.map((e: any) => e.client_id))]

    const meetCreditsAvailableByClient = new Map<string, number>()
    const { data: ledger } = await supabase.from('client_meet_credits_ledger').select('client_id, meet_credits_available').eq('coach_id', user.id)
    if (ledger) {
      for (const row of ledger) {
        meetCreditsAvailableByClient.set(String(row.client_id), Math.max(Number(row.meet_credits_available || 0), 0))
      }
    }

    const { data: users } = await supabase.from('user_profiles').select('id, full_name, email, avatar_url').in('id', clientIds)
    const { data: clientsTable } = await supabase.from('clients').select('id, birth_date').in('id', clientIds)
    const birthDateMap = new Map<string, string | null>()
    if (clientsTable) clientsTable.forEach((c: any) => birthDateMap.set(c.id, c.birth_date))

    const { data: lastProgress } = await supabase.from('progreso_diario_actividad').select('cliente_id, fecha').in('cliente_id', clientIds).order('fecha', { ascending: false })
    const lastActiveMap = new Map<string, string>()
    if (lastProgress) {
      lastProgress.forEach((p: any) => { if (!lastActiveMap.has(p.cliente_id)) lastActiveMap.set(p.cliente_id, p.fecha) })
    }

    const enrollmentIdsAll = enrollments.map((e: any) => Number(e.id)).filter((id: number) => id > 0)
    const { data: bancoData } = await supabase.from('banco').select('enrollment_id, seller_amount, amount_paid').in('enrollment_id', enrollmentIdsAll)
    const paidByEnrollmentId = new Map<number, number>()
    if (bancoData) {
      for (const row of bancoData) {
        const paid = Number(row.seller_amount ?? row.amount_paid ?? 0)
        paidByEnrollmentId.set(Number(row.enrollment_id), (paidByEnrollmentId.get(Number(row.enrollment_id)) || 0) + paid)
      }
    }

    const now = new Date()
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const { data: allDailyStats } = await supabase.from('progreso_diario_actividad').select('*').in('cliente_id', clientIds)
    const { data: docProgress } = await supabase.from('client_document_progress').select('completed, client_id, activity_id, enrollment_id').in('client_id', clientIds)

    const computeProgressAggForActivity = async (clientId: string, activityId: number, enrollmentId?: number) => {
      let ds = (allDailyStats || []).filter((d: any) => String(d.cliente_id) === String(clientId) && String(d.actividad_id) === String(activityId))
      if (enrollmentId) ds = ds.filter((d: any) => String(d.enrollment_id) === String(enrollmentId))

      let d_ok = 0, d_tot = 0, i_ok = 0, i_tot = 0, d_late = 0
      const areaStats = { fitness: { completed: 0, total: 0, absent: 0, kcal_c: 0, kcal_o: 0 }, nutricion: { completed: 0, total: 0, absent: 0 } }

      ds.forEach((d: any) => {
        const isPast = d.fecha < todayIso
        const ok = (d.fit_items_c || 0) + (d.nut_items_c || 0)
        const tot = (d.fit_items_o || 0) + (d.nut_items_o || 0)
        i_ok += ok; i_tot += tot
        
        areaStats.fitness.completed += (d.fit_items_c || 0); areaStats.fitness.total += (d.fit_items_o || 0)
        areaStats.fitness.kcal_c = (areaStats.fitness.kcal_c || 0) + (d.fit_kcal_c || 0)
        areaStats.fitness.kcal_o = (areaStats.fitness.kcal_o || 0) + (d.fit_kcal_o || 0)
        if (isPast && (d.fit_items_o || 0) > 0 && (d.fit_items_c || 0) < (d.fit_items_o || 0)) areaStats.fitness.absent += (d.fit_items_o - d.fit_items_c)
        
        areaStats.nutricion.completed += (d.nut_items_c || 0); areaStats.nutricion.total += (d.nut_items_o || 0)
        if (isPast && (d.nut_items_o || 0) > 0 && (d.nut_items_c || 0) < (d.nut_items_o || 0)) areaStats.nutricion.absent += (d.nut_items_o - d.nut_items_c)

        d_tot++
        if (tot > 0 && ok >= tot) d_ok++
        else if (isPast) d_late++
      })

      let docData = (docProgress || []).filter((d: any) => String(d.client_id) === String(clientId) && String(d.activity_id) === String(activityId))
      if (enrollmentId) docData = docData.filter((d: any) => String(d.enrollment_id) === String(enrollmentId))
      const docOk = docData.filter((d: any) => d.completed).length, docTot = docData.length
      i_ok += docOk; i_tot += docTot
      areaStats.fitness.completed += docOk; areaStats.fitness.total += docTot

      let progressPercent = i_tot > 0 ? Math.round((i_ok / i_tot) * 100) : 0
      let delayPercent = d_tot > 0 ? (d_late / d_tot) * 100 : 0
      let alertLevel = delayPercent > 50 ? 3 : (delayPercent > 20 ? 2 : (delayPercent > 0 ? 1 : 0))
      return { progressPercent, diasAtraso: d_late, itemsPendientes: i_tot - i_ok, diasCompletados: d_ok, itemsCompletados: i_ok, itemsTotalesObjetivo: i_tot, diasTotales: d_tot, areaStats, alertLevel }
    }

    const { data: allPendingTasks } = await supabase.from('coach_client_pendings').select('client_id').eq('coach_id', user.id)
    const pendingCountMap = new Map<string, number>()
    if (allPendingTasks) allPendingTasks.forEach((p: any) => pendingCountMap.set(String(p.client_id), (pendingCountMap.get(String(p.client_id)) || 0) + 1))

    const clientsMap = new Map()
    for (const enrollment of enrollments || []) {
      const clientId = String(enrollment.client_id)
      const u = users?.find((usr: any) => usr.id === clientId)
      const activity = coachActivities.find((a: any) => String(a.id) === String(enrollment.activity_id))
      if (!u || !activity) continue
      if (!clientsMap.has(clientId)) clientsMap.set(clientId, { id: clientId, name: u.full_name, email: u.email, avatar_url: u.avatar_url, birth_date: birthDateMap.get(clientId), enrollments: [], activities: [] })
      const cData = clientsMap.get(clientId)
      cData.enrollments.push(enrollment); cData.activities.push({ ...activity, amountPaid: 0 })
    }

    const basicClients = await Promise.all(Array.from(clientsMap.values()).map(async (client: any) => {
      const statuses = new Set<string>((client.enrollments || []).map((e: any) => String(e?.status || '').toLowerCase()))
      const clientStatus = (statuses.has('activa') || statuses.has('active')) ? 'active' : ((statuses.has('pendiente') || statuses.has('pending')) ? 'pending' : 'inactive')
      const totalRevenue = (client.enrollments || []).reduce((sum: number, e: any) => sum + (paidByEnrollmentId.get(Number(e.id)) || 0), 0)
      
      const activeProgressByActivity = new Map<number, number>()
      let t_ok = 0, t_pen = 0, t_obj = 0, d_ok = 0, d_late = 0, d_reg = 0, maxAlert = 0
      const fitStats = { completed: 0, total: 0, absent: 0 }, nutriStats = { completed: 0, total: 0, absent: 0 }

      // Filter for ACTIVE ONLY in progress aggregation
      const activeEnrollments = (client.enrollments || []).filter((e: any) => ['activa', 'active'].includes(String(e.status).toLowerCase()))

      for (const e of activeEnrollments) {
        const agg = await computeProgressAggForActivity(client.id, Number(e.activity_id), Number(e.id))
        activeProgressByActivity.set(Number(e.activity_id), agg.progressPercent)
        t_ok += agg.itemsCompletados; t_pen += agg.itemsPendientes; t_obj += agg.itemsTotalesObjetivo
        d_ok += agg.diasCompletados; d_late += agg.diasAtraso; d_reg += agg.diasTotales
        fitStats.completed += agg.areaStats.fitness.completed; fitStats.total += agg.areaStats.fitness.total; fitStats.absent += agg.areaStats.fitness.absent
        nutriStats.completed += agg.areaStats.nutricion.completed; nutriStats.total += agg.areaStats.nutricion.total; nutriStats.absent += agg.areaStats.nutricion.absent
        if (agg.alertLevel > maxAlert) maxAlert = agg.alertLevel
      }

        // Basic Activity Data Aggregation
        const clientDailyRows = (allDailyStats || []).filter((d: any) => String(d.cliente_id) === String(client.id))
        const todayRow = clientDailyRows.find((d: any) => d.fecha === todayIso)
        const itemsToday = (todayRow?.fit_items_o || 0) + (todayRow?.nut_items_o || 0)
        
        const nextRows = clientDailyRows
          .filter((d: any) => d.fecha > todayIso && ((d.fit_items_o || 0) + (d.nut_items_o || 0) > 0))
          .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha))
        const nextActivityDate = nextRows[0]?.fecha || null

        // Consecutive Streak (Matching Interior Detail Logic)
        const statsByDate = new Map<string, { tot: number; comp: number }>()
        clientDailyRows.forEach((r: any) => {
          const d = r.fecha; if (d > todayIso) return
          if (!statsByDate.has(d)) statsByDate.set(d, { tot: 0, comp: 0 })
          const curr = statsByDate.get(d)!
          curr.tot += (r.fit_items_o || 0) + (r.nut_items_o || 0)
          curr.comp += (r.fit_items_c || 0) + (r.nut_items_c || 0)
        })
        const streakDates = Array.from(statsByDate.keys()).sort((a,b) => b.localeCompare(a))
        let consecutiveStreak = 0
        for (const date of streakDates) {
          const s = statsByDate.get(date)!
          if (s.tot === 0) continue // Rest day - skip it
          if (s.comp >= s.tot) consecutiveStreak++
          else {
            if (date === todayIso) continue // Don't break yet if it's today
            break
          }
        }

        // History for Segmented Rings (Last 30 ACTIVE days only)
        const history: any[] = []
        const activeRowsSorted = [...clientDailyRows]
          .filter(r => (Number(r.fit_items_o || 0) + Number(r.nut_items_o || 0)) > 0)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
        
        const activeDatesSet = new Set(activeRowsSorted.map(r => r.fecha))
        const activeDatesSorted = Array.from(activeDatesSet).sort((a,b) => b.localeCompare(a)).slice(0, 30).reverse()

        for (const date of activeDatesSorted) {
          const rowsForDate = clientDailyRows.filter((d: any) => d.fecha === date)
          const fit_o = rowsForDate.reduce((sum: number, r: any) => sum + Number(r.fit_items_o || 0), 0)
          const fit_c = rowsForDate.reduce((sum: number, r: any) => sum + Number(r.fit_items_c || 0), 0)
          const nut_o = rowsForDate.reduce((sum: number, r: any) => sum + Number(r.nut_items_o || 0), 0)
          const nut_c = rowsForDate.reduce((sum: number, r: any) => sum + Number(r.nut_items_c || 0), 0)

          const has_fit = fit_o > 0;
          const has_nut = nut_o > 0;
          const is_fit_ok = has_fit && fit_c >= fit_o;
          const is_nut_ok = has_nut && nut_c >= nut_o;
          
          history.push({ 
            date, 
            status: date > todayIso ? 'future' : (is_fit_ok && is_nut_ok ? 'completed' : 'absent'), 
            fit_ok: is_fit_ok, 
            nut_ok: is_nut_ok, 
            has_fit, 
            has_nut 
          })
        }

        return {
          id: client.id, name: client.name, email: client.email, avatar_url: client.avatar_url, age: client.birth_date ? (new Date().getFullYear() - new Date(client.birth_date).getFullYear()) : 0,
          meet_credits_available: meetCreditsAvailableByClient.get(String(client.id)) || 0,
          progress: activeProgressByActivity.size > 0 ? Math.round(Array.from(activeProgressByActivity.values()).reduce((a,b)=>a+b,0) / activeProgressByActivity.size) : 0,
          status: clientStatus, totalRevenue, lastActive: formatLastActive(lastActiveMap.get(client.id) || ''),
          activitiesCount: client.activities.length, todoCount: pendingCountMap.get(String(client.id)) || 0,
          alertLevel: maxAlert, hasAlert: maxAlert > 0, daysCompleted: d_ok, absentDays: d_late, daysTotal: d_reg || 30,
          completedExercises: t_ok, failedExercises: t_pen, totalExercises: t_obj, streak: consecutiveStreak, fitStats, nutriStats,
          itemsToday, nextActivityDate, history,
          activities: client.activities.map((a: any) => ({ id: a.id, title: a.title, type: a.type, amountPaid: paidByEnrollmentId.get(client.enrollments.find((e:any)=>Number(e.activity_id)===Number(a.id))?.id) || 0 }))
        }
      }
))

    return NextResponse.json({ success: true, clients: basicClients })
  } catch (error: any) {
    console.error('[coach-clients] Error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}