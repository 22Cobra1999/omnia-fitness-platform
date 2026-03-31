import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const debugLogs: string[] = []
  try {
    const supabase = await createRouteHandlerClient()
    const adminSupabase = createServiceRoleClient() || supabase

    let user = null as any
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (!authError && userData?.user) {
      user = userData.user
    } else {
      const { data: sessionData } = await supabase.auth.getSession()
      user = sessionData?.session?.user
    }

    if (!user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const { id: clientId } = await params
    const { data: coachActivities } = await adminSupabase.from('activities').select('*').eq('coach_id', user.id)
    if (!coachActivities || coachActivities.length === 0) return NextResponse.json({ success: true, client: { id: clientId, name: 'Cliente', activities: [], activitiesCount: 0 } })

    const { data: allEnrollments } = await adminSupabase.from('activity_enrollments').select('*').eq('client_id', clientId)
    const coachActivityIds = coachActivities.map((a: any) => a.id)
    const filteredEnrollments = (allEnrollments || []).filter((e: any) => coachActivityIds.includes(Number(e.activity_id)) && ['activa', 'active', 'pendiente', 'pending', 'finalizada', 'finished', 'expirada', 'expired'].includes(e.status))

    const [profileRes, injuriesRes, biometricsRes, objectivesRes, meetRes, progressRes, docsRes, tallerRes, clientTableRes, bancoRes, onboardingRes, expiredRes] = await Promise.all([
      adminSupabase.from('user_profiles').select('*').eq('id', clientId).single(),
      adminSupabase.from('user_injuries').select('*').eq('user_id', clientId),
      adminSupabase.from('user_biometrics').select('*').eq('user_id', clientId),
      adminSupabase.from('user_exercise_objectives').select('*').eq('user_id', clientId),
      adminSupabase.from('client_meet_credits_ledger').select('meet_credits_available').eq('client_id', clientId).single(),
      adminSupabase.from('progreso_diario_actividad').select('*').eq('cliente_id', clientId),
      adminSupabase.from('client_document_progress').select('*').eq('client_id', clientId),
      adminSupabase.from('taller_progreso_temas').select('*').eq('cliente_id', clientId),
      adminSupabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      adminSupabase.from('banco').select('*').eq('client_id', clientId),
      adminSupabase.from('client_onboarding_responses').select('*').eq('client_id', clientId).maybeSingle(),
      adminSupabase.from('actividades_vencidas').select('*').eq('client_id', clientId)
    ])

    const statsMap = new Map()
    const todayIso = new Date().toISOString().slice(0, 10)
    const getStats = (eid: number) => {
      if (!statsMap.has(eid)) statsMap.set(eid, { total_days: 0, completed_days: 0, late_days: 0, items_ok: 0, items_total: 0, doc_items_ok: 0, doc_items_total: 0, pending_atrasados: 0, pending_hoy: 0, dates_seen: new Set() })
      return statsMap.get(eid)
    }

    if (progressRes.data) {
      progressRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const curr = getStats(eid)
        const ok = (r.fit_items_c || 0) + (r.nut_items_c || 0)
        const tot = (r.fit_items_o || 0) + (r.nut_items_o || 0)
        const f_kcal_c = (r.fit_kcal_c || 0)
        const f_kcal_o = (r.fit_kcal_o || 0)
        
        if (tot > 0 || f_kcal_o > 0) {
          if (!curr.dates_seen.has(r.fecha)) {
            curr.total_days++; curr.dates_seen.add(r.fecha)
            if (ok >= tot) curr.completed_days++
            else if (r.fecha < todayIso) curr.late_days++
          }
          curr.items_ok += ok; curr.items_total += tot
          curr.fit_kcal_c = (curr.fit_kcal_c || 0) + f_kcal_c
          curr.fit_kcal_o = (curr.fit_kcal_o || 0) + f_kcal_o
          if (ok < tot) {
            if (r.fecha < todayIso) curr.pending_atrasados += (tot - ok)
            else if (r.fecha === todayIso) curr.pending_hoy += (tot - ok)
          }
        }
      })
    }

    if (docsRes.data) {
      docsRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const curr = getStats(eid)
        if (r.visto) curr.doc_items_ok++
        curr.doc_items_total++
      })
    }

    const bancoRecords = bancoRes.data || [], expiredByEnrollment = new Map<number, any>()
    const bancoByEnrollment = new Map<number, any>(), bancoByActivity = new Map<number, any>()
    bancoRecords.forEach((b: any) => { if (b.enrollment_id) bancoByEnrollment.set(Number(b.enrollment_id), b); if (b.activity_id) bancoByActivity.set(Number(b.activity_id), b) })
    if (expiredRes.data) expiredRes.data.forEach((e: any) => { if (e.enrollment_id) expiredByEnrollment.set(Number(e.enrollment_id), e) })

    const activitiesDetails = filteredEnrollments.map((e: any) => {
      const eidNum = Number(e.id), act = coachActivities.find((a: any) => String(a.id) === String(e.activity_id))
      if (!act) return null
      const s = statsMap.get(eidNum), type = act.type?.toLowerCase() || '', cat = act.categoria?.toLowerCase() || ''
      const isDocument = type.includes('document') || cat.includes('documento'), isWorkshop = type.includes('workshop') || cat.includes('yoga')

      const enrollmentRows = progressRes.data?.filter((r: any) => Number(r.enrollment_id) === eidNum) || []
      let d_ok = 0, d_late = 0, d_pro = 0, i_past_ok = 0, i_past_fail = 0, i_rest = 0

      if (!isDocument) {
        enrollmentRows.forEach((r: any) => {
          const ok = (r.fit_items_c || 0) + (r.nut_items_c || 0), tot = (r.fit_items_o || 0) + (r.nut_items_o || 0)
          if (r.fecha < todayIso) {
            if (tot > 0) { if (ok >= tot) d_ok++; else d_late++ }
            i_past_ok += ok; i_past_fail += Math.max(0, tot - ok)
          } else if (r.fecha === todayIso) { i_rest += Math.max(0, tot - ok) }
          else { if (tot > 0) d_pro++; i_rest += tot }
        })
      } else {
        const end = e.program_end_date ? new Date(e.program_end_date) : null
        i_past_ok = s?.doc_items_ok || 0; const docTot = s?.doc_items_total || 0, pending = Math.max(0, docTot - i_past_ok)
        if (end && new Date() > end) i_past_fail = pending; else i_rest = pending
      }

      if (isWorkshop) {
        const workshopDocs = tallerRes.data?.filter((t: any) => Number(t.enrollment_id) === eidNum) || []
        d_ok = workshopDocs.filter((w: any) => w.asistio && w.fecha_seleccionada <= todayIso).length
        d_late = workshopDocs.filter((w: any) => !w.asistio && w.fecha_seleccionada < todayIso).length
        d_pro = workshopDocs.filter((w: any) => w.fecha_seleccionada > todayIso).length
      }

      let progressPercent = 0
      if (isDocument) { if (s?.doc_items_total > 0) progressPercent = Math.round((s.doc_items_ok / s.doc_items_total) * 100) }
      else { if (s?.items_total > 0) progressPercent = Math.round((s.items_ok / s.items_total) * 100) }

      const expiredSnapshot = expiredByEnrollment.get(eidNum)
      if (expiredSnapshot) return { ...act, enrollment_id: e.id, status: e.status, amount_paid: e.amount_paid, program_end_date: e.program_end_date, expiration_date: e.expiration_date, progressPercent: expiredSnapshot.progreso_porcentaje || progressPercent, upToDate: (expiredSnapshot.items_no_logrados || 0) === 0, daysCompleted: expiredSnapshot.dias_completados, daysMissed: expiredSnapshot.dias_ausente, daysRemainingFuture: expiredSnapshot.dias_proximos, itemsCompletedTotal: expiredSnapshot.items_completados, itemsDebtPast: expiredSnapshot.items_no_logrados, itemsPendingToday: expiredSnapshot.items_restantes }

      return { ...act, enrollment_id: e.id, status: e.status, amount_paid: e.amount_paid, program_end_date: e.program_end_date, expiration_date: e.expiration_date, progressPercent, upToDate: !(i_past_fail > 0 || s?.pending_atrasados > 0), daysCompleted: d_ok, daysMissed: d_late, daysRemainingFuture: d_pro, itemsCompletedTotal: i_past_ok, itemsDebtPast: i_past_fail, itemsPendingToday: i_rest }
    }).filter(Boolean)

    const cumulativeStreak = (() => {
      const dailyStats = (progressRes.data || []).sort((a: any, b: any) => b.fecha.localeCompare(a.fecha))
      if (dailyStats.length === 0) return 0

      const statsByDate = new Map<string, { tot: number; comp: number }>()
      dailyStats.forEach((r: any) => {
        const d = r.fecha
        if (!statsByDate.has(d)) statsByDate.set(d, { tot: 0, comp: 0 })
        const curr = statsByDate.get(d)!
        curr.tot += (r.fit_items_o || 0) + (r.nut_items_o || 0)
        curr.comp += (r.fit_items_c || 0) + (r.nut_items_c || 0)
      })

      const dates = Array.from(statsByDate.keys()).sort((a, b) => b.localeCompare(a))
      let streak = 0
      
      // Start from yesterday or today if today is completed
      for (const date of dates) {
        if (date > todayIso) continue 
        const s = statsByDate.get(date)!
        if (s.tot === 0) continue // Rest day - skip it, streak continues

        const isCompleted = s.comp >= s.tot
        if (isCompleted) {
          streak++
        } else {
          // If it's today and not completed, we don't break the streak yet
          if (date === todayIso) continue
          break // Broken
        }
      }
      // If today is completed and yesterday was rest/completed, the streak is calculated correctly.
      // If we haven't done today yet, the streak shows up to yesterday.
      return streak
    })()

    const activeProgressByActivity = new Map<number, number>()
    activitiesDetails.forEach((a: any) => { 
      if (['activa', 'active'].includes(String(a.status).toLowerCase())) {
        if (a.progressPercent < 100) {
          activeProgressByActivity.set(Number(a.id), Math.max(activeProgressByActivity.get(Number(a.id)) || 0, a.progressPercent)) 
        }
      }
    })

    const client = {
      id: clientId, name: profileRes.data?.full_name || 'Cliente', email: profileRes.data?.email || '', avatar_url: profileRes.data?.avatar_url,
      activities: activitiesDetails, 
      activitiesCount: activitiesDetails.length, 
      progress: activeProgressByActivity.size > 0 ? Math.round(Array.from(activeProgressByActivity.values()).reduce((a: number, b: number) => a + b, 0) / activeProgressByActivity.size) : 0,
      streak: cumulativeStreak,
      injuries: injuriesRes.data || [], biometrics: biometricsRes.data || [], objectives: (objectivesRes.data || []).map((o: any) => ({ ...o, progress_percentage: o.objective > 0 ? Math.round((o.current_value / o.objective) * 100) : 0 })),
      totalRevenue: activitiesDetails.reduce((acc: number, a: any) => acc + (Number(a.amount_paid) || 0), 0),
      physicalData: { 
        height: profileRes.data?.Height || null, 
        weight: profileRes.data?.weight || null, 
        birth_date: profileRes.data?.birth_date || null,
        age: profileRes.data?.birth_date ? (new Date().getFullYear() - new Date(profileRes.data.birth_date).getFullYear()) : (profileRes.data?.age || null), 
        phone: profileRes.data?.phone || null, 
        emergency_contact: clientTableRes.data?.emergency_contact || null, 
        location: profileRes.data?.location || null, 
        meet_credits: meetRes.data?.meet_credits_available || 0 
      },
      onboarding: onboardingRes.data || null
    }

    return NextResponse.json({ success: true, client })
  } catch (error: any) {
    console.error('[FATAL_ERROR]', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
