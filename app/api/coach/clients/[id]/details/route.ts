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

    const coachActivityIds = coachActivities.map((a: any) => a.id)

    // 2. ENROLLMENTS
    const { data: allEnrollments } = await adminSupabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', clientId)

    // 3. FILTER
    const filteredEnrollments = (allEnrollments || []).filter((e: any) => {
      const match = coachActivityIds.includes(Number(e.activity_id))
      const validStatus = ['activa', 'active', 'pendiente', 'pending', 'finalizada', 'finished', 'expirada', 'expired'].includes(e.status)
      return match && validStatus
    })

    // 4. PARALLEL DATA FETCH
    const [profileRes, injuriesRes, biometricsRes, objectivesRes, meetRes, progressRes, fitnessRes, nutriRes, docsRes, tallerRes, clientTableRes, bancoRes, onboardingRes, expiredRes] = await Promise.all([
      adminSupabase.from('user_profiles').select('*').eq('id', clientId).single(),
      adminSupabase.from('user_injuries').select('*').eq('user_id', clientId),
      adminSupabase.from('user_biometrics').select('*').eq('user_id', clientId),
      adminSupabase.from('user_exercise_objectives').select('*').eq('user_id', clientId),
      adminSupabase.from('client_meet_credits_ledger').select('meet_credits_available').eq('client_id', clientId).single(),
      adminSupabase.from('progreso_diario_actividad').select('*').eq('cliente_id', clientId),
      adminSupabase.from('progreso_cliente').select('*').eq('cliente_id', clientId),
      adminSupabase.from('progreso_cliente_nutricion').select('*').eq('cliente_id', clientId),
      adminSupabase.from('client_document_progress').select('*').eq('client_id', clientId),
      adminSupabase.from('taller_progreso_temas').select('*').eq('cliente_id', clientId),
      adminSupabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      adminSupabase.from('banco').select('*').eq('client_id', clientId),
      adminSupabase.from('client_onboarding_responses').select('*').eq('client_id', clientId).maybeSingle(),
      adminSupabase.from('actividades_vencidas').select('*').eq('client_id', clientId)
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
          items_ok: 0, items_total: 0,
          doc_items_ok: 0, doc_items_total: 0,
          pending_atrasados: 0, pending_hoy: 0,
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

    // Map banco data for pricing
    const bancoRecords = bancoRes.data || []
    const bancoByEnrollment = new Map<number, any>()
    const bancoByActivity = new Map<number, any>()
    bancoRecords.forEach((b: any) => {
      if (b.enrollment_id) bancoByEnrollment.set(Number(b.enrollment_id), b)
      if (b.activity_id) bancoByActivity.set(Number(b.activity_id), b)
    })

    // Map expired activities for quick lookup
    const expiredByEnrollment = new Map<number, any>()
    if (expiredRes.data) {
      expiredRes.data.forEach((e: any) => {
        if (e.enrollment_id) expiredByEnrollment.set(Number(e.enrollment_id), e)
      })
    }

    // To avoid double counting, we will use a Map to keep track of items per enrollment and date
    // We will prioritize progreso_diario_actividad as it's the unified source
    const enrollmentDailyStats = new Map<number, Map<string, { ok: number, total: number }>>()

    const addStat = (eid: number, date: string, ok: number, total: number) => {
      if (!enrollmentDailyStats.has(eid)) enrollmentDailyStats.set(eid, new Map())
      const dayMap = enrollmentDailyStats.get(eid)!
      if (!dayMap.has(date)) {
        dayMap.set(date, { ok, total })
      } else {
        // If we already have data for this date, only update if the new data is "better" or from a better source
        // But for simplicity, let's just use the max values to avoid double counting if sources overlap
        const existing = dayMap.get(date)!
        dayMap.set(date, {
          ok: Math.max(existing.ok, ok),
          total: Math.max(existing.total, total)
        })
      }
    }

    if (progressRes.data) {
      progressRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const date = String(r.fecha).slice(0, 10)
        addStat(eid, date, Number(r.items_completados) || 0, Number(r.items_objetivo) || 0)

        // Update general stats for other fields (late_days, etc)
        const curr = getStats(eid)
        if ((r.items_objetivo || 0) > 0) {
          if (!curr.dates_seen.has(r.fecha)) {
            curr.total_days++
            curr.dates_seen.add(r.fecha)
            if ((r.items_completados || 0) >= r.items_objetivo) curr.completed_days++
            else if (r.fecha < todayIso) curr.late_days++
          }
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
        const date = String(r.fecha).slice(0, 10)
        const ok = Object.keys(r.ejercicios_completados || {}).length
        const pen = Object.keys(r.ejercicios_pendientes || {}).length
        addStat(eid, date, ok, ok + pen)
      })
    }

    if (nutriRes.data) {
      nutriRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const date = String(r.fecha).slice(0, 10)
        const getCount = (obj: any) => {
          if (!obj) return 0
          if (Array.isArray(obj?.ejercicios)) return obj.ejercicios.length
          return Object.keys(obj).length
        }
        const ok = getCount(r.ejercicios_completados)
        const pen = getCount(r.ejercicios_pendientes)
        addStat(eid, date, ok, ok + pen)
      })
    }

    if (docsRes.data) {
      docsRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id); if (!eid) return
        const curr = getStats(eid)
        const ok = r.completed ? 1 : 0
        curr.doc_items_ok += ok
        curr.doc_items_total += 1
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
      const bidNum = Number(e.activity_id)
      const eidNum = Number(e.id)
      const act = coachActivities.find((a: any) => String(a.id) === String(e.activity_id))
      if (!act) return null

      // Recalculate stats from the deduplicated enrollmentDailyStats
      const dayMap = enrollmentDailyStats.get(eidNum)
      let items_ok = 0
      let items_total = 0
      if (dayMap) {
        dayMap.forEach(d => {
          items_ok += d.ok
          items_total += d.total
        })
      }

      const s = statsMap.get(eidNum)
      const type = act.type?.toLowerCase() || ''
      const cat = act.categoria?.toLowerCase() || ''
      const isWorkshop = type.includes('workshop') || type.includes('taller') || cat.includes('yoga')
      const isDocument = type.includes('document') || type.includes('documento') || cat.includes('documento')

      const todayStr = new Date().toISOString().slice(0, 10)
      const enrollmentRows = progressRes.data?.filter((r: any) => Number(r.enrollment_id) === eidNum) || []

      let diasCompletados = 0
      let diasEnCurso = 0
      let diasAusentes = 0
      let diasProximos = 0

      let itemsPasadosCompletados = 0
      let itemsPasadosNoLogrados = 0
      let itemsRestantesTotal = 0

      if (!isDocument) {
        // Programs and Workshops logic (date-based)
        enrollmentRows.forEach((r: any) => {
          const itemsObj = r.items_objetivo || 0
          const itemsComp = r.items_completados || 0
          const fecha = r.fecha

          if (fecha < todayStr) {
            if (itemsObj > 0) {
              if (itemsComp >= itemsObj) diasCompletados++
              else if (itemsComp > 0) diasEnCurso++
              else diasAusentes++
            }
            itemsPasadosCompletados += itemsComp
            itemsPasadosNoLogrados += Math.max(0, itemsObj - itemsComp)
          } else if (fecha === todayStr) {
            itemsRestantesTotal += Math.max(0, itemsObj - itemsComp)
          } else {
            if (itemsObj > 0) diasProximos++
            itemsRestantesTotal += itemsObj
          }
        })
      } else {
        // DOCUMENT Logic
        const end = e.program_end_date ? new Date(e.program_end_date) : null
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const hasFinished = end && today > end

        itemsPasadosCompletados = s?.doc_items_ok || 0
        const itemsTotal = s?.doc_items_total || 0
        const pending = Math.max(0, itemsTotal - itemsPasadosCompletados)

        if (hasFinished) {
          itemsPasadosNoLogrados = pending
          itemsRestantesTotal = 0
        } else {
          itemsPasadosNoLogrados = 0
          itemsRestantesTotal = pending
        }

        diasCompletados = 0
        diasAusentes = 0
        diasProximos = 0
      }

      // Workshop specific overrides
      if (isWorkshop) {
        diasCompletados = workshopAttendanceMap.get(eidNum) || 0
        diasAusentes = workshopAbsenceMap.get(eidNum) || 0
        diasProximos = workshopFutureMap.get(eidNum) || 0
      }

      let progressPercent = 0
      if (isDocument) {
        if (s?.doc_items_total > 0) progressPercent = Math.round((s.doc_items_ok / s.doc_items_total) * 100)
      } else {
        if (items_total > 0) progressPercent = Math.round((items_ok / items_total) * 100)
        else if (s?.total_days > 0) progressPercent = Math.round((s.completed_days / s.total_days) * 100)
      }

      // Use price from banco if available
      const bancoRecord = bancoByEnrollment.get(eidNum) || bancoByActivity.get(bidNum)
      let amountPaid = 0
      if (bancoRecord) {
        amountPaid = parseFloat(bancoRecord.amount_paid)
      } else if (e.amount_paid) {
        amountPaid = parseFloat(e.amount_paid)
      }

      // --- ARCHIVED SNAPSHOT OVERRIDE ---
      const expiredSnapshot = expiredByEnrollment.get(eidNum)
      if (expiredSnapshot) {
        return {
          ...act,
          enrollment_id: e.id,
          created_at: e.created_at,
          status: e.status,
          amount_paid: amountPaid,
          start_date: e.start_date,
          program_end_date: e.program_end_date,
          progressPercent: expiredSnapshot.progreso_porcentaje || progressPercent,
          upToDate: (expiredSnapshot.items_no_logrados || 0) === 0,
          daysCompleted: expiredSnapshot.dias_completados,
          daysPassed: expiredSnapshot.dias_en_curso,
          daysMissed: expiredSnapshot.dias_ausente,
          daysRemainingFuture: expiredSnapshot.dias_proximos,
          itemsCompletedTotal: expiredSnapshot.items_completados,
          itemsDebtPast: expiredSnapshot.items_no_logrados,
          itemsPendingToday: expiredSnapshot.items_restantes
        }
      }

      return {
        ...act,
        enrollment_id: e.id,
        created_at: e.created_at,
        status: e.status,
        amount_paid: amountPaid,
        start_date: e.start_date,
        program_end_date: e.program_end_date,
        progressPercent,
        upToDate: !((itemsPasadosNoLogrados > 0) || (s?.pending_atrasados > 0)),

        // --- ESTRUCTURA SOLICITADA ---
        daysCompleted: diasCompletados,
        daysPassed: diasEnCurso, // "En curso"
        daysMissed: diasAusentes, // "Ausente"
        daysRemainingFuture: diasProximos, // "Próximos"

        itemsCompletedTotal: itemsPasadosCompletados, // "Terminados" (pasado)
        itemsDebtPast: itemsPasadosNoLogrados, // "No logrados" (pasado)
        itemsPendingToday: itemsRestantesTotal // "Restantes" (hoy + futuro)
      }
    }).filter(Boolean)

    // Solo promediamos actividades "en curso", deduplicando por activity_id
    // Coincidimos con la lógica del frontend para "En curso": empezadas y no completadas (< 100%)
    const inProgressActivities = activitiesDetails.filter((a: any) => {
      const progressPercent = a.progressPercent || 0
      const isCompleted = progressPercent >= 100 ||
        ['finalizada', 'finished', 'expirada', 'expired'].includes(a.status?.toLowerCase())
      const hasStarted = !!a.start_date
      return !isCompleted && hasStarted
    })

    const activeProgressByActivity = new Map<number, number>()
    inProgressActivities.forEach((a: any) => {
      const aid = Number(a.id)
      const currentMax = activeProgressByActivity.get(aid) || 0
      activeProgressByActivity.set(aid, Math.max(currentMax, a.progressPercent || 0))
    })

    const uniqueActiveCount = activeProgressByActivity.size
    const totalProgSum = Array.from(activeProgressByActivity.values()).reduce((a, b) => a + b, 0)

    const client = {
      id: profileRes.data?.id || clientId,
      name: profileRes.data?.full_name || 'Cliente',
      email: profileRes.data?.email || '',
      avatar_url: profileRes.data?.avatar_url,
      activities: activitiesDetails,
      activitiesCount: activitiesDetails.length,
      progress: uniqueActiveCount > 0 ? Math.round(totalProgSum / uniqueActiveCount) : 0,
      injuries: injuriesRes.data || [],
      biometrics: biometricsRes.data || [],
      objectives: (objectivesRes.data || []).map((obj: any) => ({
        ...obj,
        progress_percentage: obj.objective > 0 ? Math.round((obj.current_value / obj.objective) * 100) : 0
      })),
      totalRevenue: activitiesDetails.reduce((acc: any, a: any) => acc + (Number(a.amount_paid) || 0), 0),
      physicalData: {
        height: clientTableRes.data?.Height || profileRes.data?.Height || null,
        weight: clientTableRes.data?.weight || profileRes.data?.weight || null,
        age: (() => {
          const bd = clientTableRes.data?.birth_date || profileRes.data?.birth_date
          if (bd) return (new Date().getFullYear() - new Date(bd).getFullYear())
          return clientTableRes.data?.age || profileRes.data?.age || null
        })(),
        phone: clientTableRes.data?.phone || profileRes.data?.phone || null,
        emergency_contact: clientTableRes.data?.emergency_contact || null,
        location: clientTableRes.data?.location || profileRes.data?.location || null,
        meet_credits: meetRes.data?.meet_credits_available || 0
      },
      onboarding: onboardingRes.data || null
    }

    return NextResponse.json({ success: true, hasClient: true, client })
  } catch (error: any) {
    console.error('[FATAL_ERROR]', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
