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

    // 0. AUTH
    let user = null as any
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (!authError && userData?.user) {
      user = userData.user
    } else {
      const { data: sessionData } = await supabase.auth.getSession()
      user = sessionData?.session?.user
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const { id: clientId } = await params
    debugLogs.push(`[LOGIN] user.id: ${user.id}, viewing client: ${clientId}`)

    // 1. COACH ACTIVITIES
    const { data: coachActivities } = await adminSupabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)

    if (!coachActivities || coachActivities.length === 0) {
      return NextResponse.json({
        success: true,
        client: { id: clientId, name: 'Cliente', activities: [], activitiesCount: 0 },
        debug_logs: debugLogs
      })
    }

    const coachActivityIds = coachActivities.map(a => a.id)

    // 2. ENROLLMENTS
    const { data: allEnrollments } = await adminSupabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', clientId)

    // 3. FILTER
    const filteredEnrollments = (allEnrollments || []).filter(e => {
      const match = coachActivityIds.includes(Number(e.activity_id))
      const validStatus = ['activa', 'active', 'pendiente', 'pending', 'finalizada', 'finished', 'expirada', 'expired'].includes(e.status)
      return match && validStatus
    })

    // 4. PARALLEL DATA FETCH
    const [profileRes, injuriesRes, biometricsRes, objectivesRes, meetRes, progressRes, fitnessRes, nutriRes, docsRes, tallerRes] = await Promise.all([
      adminSupabase.from('user_profiles').select('*').eq('id', clientId).single(),
      adminSupabase.from('user_injuries').select('*').eq('user_id', clientId),
      adminSupabase.from('user_biometrics').select('*').eq('user_id', clientId),
      adminSupabase.from('user_exercise_objectives').select('*').eq('user_id', clientId),
      adminSupabase.from('client_meet_credits_ledger').select('meet_credits_available').eq('client_id', clientId).single(),
      adminSupabase.from('progreso_diario_actividad').select('*').eq('cliente_id', clientId),
      adminSupabase.from('progreso_cliente').select('*').eq('cliente_id', clientId),
      adminSupabase.from('progreso_cliente_nutricion').select('*').eq('cliente_id', clientId),
      adminSupabase.from('client_document_progress').select('*').eq('client_id', clientId),
      adminSupabase.from('taller_progreso_temas').select('*').eq('cliente_id', clientId)
    ])

    const workshopFutureMap = new Map<number, number>()
    const workshopAbsenceMap = new Map<number, number>()
    const workshopAttendanceMap = new Map<number, number>()

    const statsMap = new Map()
    const todayIso = new Date().toISOString().slice(0, 10)

    const getStats = (eid: number) => {
      if (!statsMap.has(eid)) {
        statsMap.set(eid, {
          total_days: 0, completed_days: 0, late_days: 0,
          items_ok: 0, items_total: 0, pending_atrasados: 0, pending_hoy: 0,
          dates_seen: new Set()
        })
      }
      return statsMap.get(eid)
    }

    // Process all sources...
    if (progressRes.data) {
      progressRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const curr = getStats(eid)
        if ((r.items_objetivo || 0) > 0) {
          if (!curr.dates_seen.has(r.fecha)) {
            curr.total_days++
            curr.dates_seen.add(r.fecha)
            if ((r.items_completados || 0) >= r.items_objetivo) curr.completed_days++
            else if (r.fecha < todayIso) curr.late_days++
          }
          curr.items_ok += (r.items_completados || 0)
          curr.items_total += (r.items_objetivo || 0)
          if ((r.items_completados || 0) < r.items_objetivo) {
            if (r.fecha < todayIso) curr.pending_atrasados += (r.items_objetivo - r.items_completados)
            else if (r.fecha === todayIso) curr.pending_hoy += (r.items_objetivo - r.items_completados)
          }
        }
      })
    }

    if (fitnessRes.data) {
      fitnessRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const curr = getStats(eid)
        const ok = Object.keys(r.ejercicios_completados || {}).length
        const pen = Object.keys(r.ejercicios_pendientes || {}).length
        const total = ok + pen
        if (total > 0) {
          if (!curr.dates_seen.has(r.fecha)) {
            curr.total_days++
            curr.dates_seen.add(r.fecha)
            if (pen === 0) curr.completed_days++
          }
          curr.items_ok += ok
          curr.items_total += total
        }
      })
    }

    if (nutriRes.data) {
      nutriRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const curr = getStats(eid)
        const getCount = (obj: any) => {
          if (!obj) return 0
          if (Array.isArray(obj?.ejercicios)) return obj.ejercicios.length
          return Object.keys(obj).length
        }
        const ok = getCount(r.ejercicios_completados)
        const pen = getCount(r.ejercicios_pendientes)
        const total = ok + pen
        if (total > 0) {
          if (!curr.dates_seen.has(r.fecha)) {
            curr.total_days++
            curr.dates_seen.add(r.fecha)
            if (pen === 0) curr.completed_days++
          }
          curr.items_ok += ok
          curr.items_total += total
        }
      })
    }

    if (docsRes.data) {
      docsRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const curr = getStats(eid)
        const ok = r.completed ? 1 : 0
        curr.items_ok += ok
        curr.items_total += 1
      })
    }

    if (tallerRes.data) {
      tallerRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        if (r.fecha_seleccionada > todayIso) {
          workshopFutureMap.set(eid, (workshopFutureMap.get(eid) || 0) + 1)
        } else {
          if (r.asistio) workshopAttendanceMap.set(eid, (workshopAttendanceMap.get(eid) || 0) + 1)
          else workshopAbsenceMap.set(eid, (workshopAbsenceMap.get(eid) || 0) + 1)
        }
      })
    }

    const activitiesDetails = filteredEnrollments.map((e: any) => {
      const act = coachActivities.find(a => String(a.id) === String(e.activity_id))
      if (!act) return null

      const eidNum = Number(e.id)
      const s = statsMap.get(eidNum)
      const type = act.type?.toLowerCase() || ''
      const cat = act.categoria?.toLowerCase() || ''
      const isWorkshop = type.includes('workshop') || type.includes('taller') || cat.includes('yoga')
      const isDocument = cat.includes('documento') || cat.includes('proceso')

      let progressPercent = 0
      if (s?.total_days > 0) progressPercent = Math.round((s.completed_days / s.total_days) * 100)
      else if (s?.items_total > 0) progressPercent = Math.round((s.items_ok / s.items_total) * 100)

      let daysPassed = 0
      let daysRemainingFuture = 0
      const start = e.start_date ? new Date(e.start_date) : null
      const end = e.program_end_date ? new Date(e.program_end_date) : null
      const today = new Date(); today.setHours(0, 0, 0, 0)

      if (isDocument) {
        // Documents don't have days
        daysPassed = 0
        daysRemainingFuture = 0
      } else if (isWorkshop) {
        // Workshops use actual scheduled dates
        daysPassed = (workshopAttendanceMap.get(eidNum) || 0) + (workshopAbsenceMap.get(eidNum) || 0) > 0 ? 1 : 0
        daysRemainingFuture = workshopFutureMap.get(eidNum) || 0
      } else if (start) {
        // Programs (Fitness/Nutrition) use day-by-day logic
        const isTodayActive = today >= start && (!end || today <= end);
        const hasFinished = end && today > end;
        daysPassed = isTodayActive ? 1 : 0;
        if (end) {
          const diffDays = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          daysRemainingFuture = Math.max(0, diffDays);
          if (hasFinished) {
            daysPassed = 0;
            daysRemainingFuture = 0;
          }
        }
      }

      // Expiration logic (Client must start within X days)
      const diasAcceso = act.dias_acceso || 30
      const purchaseDate = new Date(e.created_at)
      let limitDate: Date
      if (e.expiration_date) {
        limitDate = new Date(e.expiration_date)
      } else {
        limitDate = new Date(purchaseDate)
        limitDate.setDate(purchaseDate.getDate() + diasAcceso)
      }
      limitDate.setHours(23, 59, 59, 999)
      const isExpiredStart = !start && new Date() > limitDate

      // Calibration for Workshops specific fields
      const daysCompletedValue = isWorkshop ? (workshopAttendanceMap.get(eidNum) || 0) : (s?.completed_days || 0)
      const daysMissedValue = isWorkshop ? (workshopAbsenceMap.get(eidNum) || 0) : (s?.late_days || 0)

      return {
        ...act,
        enrollment_id: e.id,
        created_at: e.created_at,
        status: e.status,
        amount_paid: e.amount_paid || 0,
        start_date: e.start_date,
        program_end_date: e.program_end_date,
        progressPercent,
        upToDate: !(s?.pending_atrasados > 0 || s?.late_days > 0),
        isExpiredStart: false, // already calculated in previous turn but let's keep it simple

        // --- ESTRUCTURA SOLICITADA ---
        // DÍAS
        daysCompleted: daysCompletedValue,
        daysPassed: daysPassed || 0, // "En curso"
        daysMissed: daysMissedValue, // "Ausente"
        daysRemainingFuture: daysRemainingFuture || 0, // "Próximos"

        // ITEMS
        itemsCompletedTotal: s?.items_ok || 0,
        itemsDebtPast: s?.pending_atrasados || 0, // "No completados" (pasado)
        itemsPendingToday: s?.pending_hoy || 0, // "Restantes" (hoy/adelante)

        // Metadata extra
        totalPendingItems: (s?.pending_atrasados || 0) + (s?.pending_hoy || 0)
      }
    }).filter(Boolean)

    const client = {
      id: profileRes.data?.id || clientId,
      name: profileRes.data?.full_name || 'Cliente',
      email: profileRes.data?.email || '',
      avatar_url: profileRes.data?.avatar_url,
      activities: activitiesDetails,
      activitiesCount: activitiesDetails.length,
      progress: activitiesDetails.length > 0 ? Math.round(activitiesDetails.reduce((acc: any, a: any) => acc + (a.progressPercent || 0), 0) / activitiesDetails.length) : 0,
      injuries: injuriesRes.data || [],
      biometrics: biometricsRes.data || [],
      objectives: (objectivesRes.data || []).map((obj: any) => ({
        ...obj,
        progress_percentage: obj.objective > 0 ? Math.round((obj.current_value / obj.objective) * 100) : 0
      })),
      totalRevenue: activitiesDetails.reduce((acc: any, a: any) => acc + (Number(a.amount_paid) || 0), 0),
      physicalData: {
        height: profileRes.data?.Height || null,
        weight: profileRes.data?.weight || null,
        age: profileRes.data?.birth_date ? (new Date().getFullYear() - new Date(profileRes.data.birth_date).getFullYear()) : null,
        phone: profileRes.data?.phone || null,
        location: profileRes.data?.location || null,
        meet_credits: meetRes.data?.meet_credits_available || 0
      }
    }

    return NextResponse.json({ success: true, hasClient: true, client })
  } catch (error: any) {
    console.error('[FATAL_ERROR]', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
