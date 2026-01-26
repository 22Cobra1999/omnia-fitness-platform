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

    // 0. AUTH (Exact same as list view)
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

    // 1. COACH ACTIVITIES (Core guard)
    const { data: coachActivities } = await adminSupabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)

    debugLogs.push(`[ACTIVITIES] Coach has ${coachActivities?.length || 0} activities`)

    if (!coachActivities || coachActivities.length === 0) {
      return NextResponse.json({
        success: true,
        client: { id: clientId, name: 'Cliente', activities: [], activitiesCount: 0 },
        debug_logs: debugLogs
      })
    }

    const coachActivityIds = coachActivities.map(a => a.id)
    const coachActivityIdsStr = coachActivityIds.map(id => String(id))

    // 2. ENROLLMENTS FOR THIS CLIENT
    const { data: allEnrollments, error: enrErr } = await adminSupabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', clientId)

    debugLogs.push(`[ENROLLMENTS] Client has ${allEnrollments?.length || 0} raw enrollments`)
    if (enrErr) debugLogs.push(`[ENR_ERR] ${enrErr.message}`)

    // 3. FILTER ENROLLMENTS THAT BELONG TO COACH
    const filteredEnrollments = (allEnrollments || []).filter(e => {
      const match = coachActivityIds.includes(Number(e.activity_id)) ||
        coachActivityIdsStr.includes(String(e.activity_id))
      const validStatus = ['activa', 'active', 'pendiente', 'pending', 'finalizada', 'finished', 'expirada', 'expired'].includes(e.status)
      return match && validStatus
    })
    debugLogs.push(`[FILTER] Found ${filteredEnrollments.length} matching enrollments for this coach`)

    // 4. PARALLEL DATA FETCH
    const [profileRes, injuriesRes, biometricsRes, objectivesRes, meetRes, progressRes] = await Promise.all([
      adminSupabase.from('user_profiles').select('*').eq('id', clientId).single(),
      adminSupabase.from('user_injuries').select('*').eq('user_id', clientId),
      adminSupabase.from('user_biometrics').select('*').eq('user_id', clientId),
      adminSupabase.from('user_exercise_objectives').select('*').eq('user_id', clientId),
      adminSupabase.from('client_meet_credits_ledger').select('meet_credits_available').eq('client_id', clientId).single(),
      adminSupabase.from('progreso_diario_actividad').select('*').eq('cliente_id', clientId)
    ])

    const statsMap = new Map()
    const todayIso = new Date().toISOString().slice(0, 10)
    if (progressRes.data) {
      progressRes.data.forEach((r: any) => {
        const eid = Number(r.enrollment_id)
        if (!eid) return
        const curr = statsMap.get(eid) || { ok: 0, total: 0, late: 0, items_ok: 0, items_total: 0 }
        curr.total++
        curr.items_ok += (r.items_completados || 0)
        curr.items_total += (r.items_objetivo || 0)
        if ((r.items_objetivo || 0) > 0 && (r.items_completados || 0) >= r.items_objetivo) curr.ok++
        else if (r.fecha < todayIso && (r.items_objetivo || 0) > 0) curr.late++
        statsMap.set(eid, curr)
      })
    }

    const activitiesDetails = filteredEnrollments.map((e: any) => {
      const act = coachActivities.find(a => String(a.id) === String(e.activity_id))
      if (!act) return null

      const s = statsMap.get(Number(e.id))
      const progressPercent = s?.total > 0 ? Math.round((s.ok / s.total) * 100) : 0

      return {
        ...act,
        enrollment_id: e.id,
        status: e.status,
        start_date: e.start_date,
        enrollmentStartDate: e.start_date,
        enrollmentExpirationDate: e.expiration_date,
        progressPercent,
        upToDate: !(s?.late > 0),
        daysBehind: s?.late || 0,
        pendingItems: Math.max(0, (s?.items_total || 0) - (s?.items_ok || 0))
      }
    }).filter(Boolean)

    const client = {
      id: profileRes.data?.id || clientId,
      name: profileRes.data?.full_name || 'Cliente',
      email: profileRes.data?.email || '',
      avatar_url: profileRes.data?.avatar_url,
      activities: activitiesDetails,
      activitiesCount: activitiesDetails.length,
      progress: activitiesDetails.length > 0 ? Math.round(activitiesDetails.reduce((acc, a) => acc + (a.progressPercent || 0), 0) / activitiesDetails.length) : 0,
      injuries: injuriesRes.data || [],
      biometrics: biometricsRes.data || [],
      objectives: (objectivesRes.data || []).map((obj: any) => ({
        ...obj,
        progress_percentage: obj.objective > 0 ? Math.round((obj.current_value / obj.objective) * 100) : 0
      })),
      totalRevenue: activitiesDetails.reduce((acc, a) => acc + (Number(a.price) || 0), 0),
      physicalData: {
        height: profileRes.data?.Height || null,
        weight: profileRes.data?.weight || null,
        age: profileRes.data?.birth_date ? (new Date().getFullYear() - new Date(profileRes.data.birth_date).getFullYear()) : null,
        phone: profileRes.data?.phone || null,
        location: profileRes.data?.location || null,
        meet_credits: meetRes.data?.meet_credits_available || 0
      }
    }

    return NextResponse.json({
      success: true,
      hasClient: true,
      client,
      debug_logs: debugLogs,
      stats: {
        activities_count: activitiesDetails.length,
        enrollments_count: filteredEnrollments.length
      }
    })

  } catch (error: any) {
    console.error('[FATAL_ERROR]', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno',
      debug_logs: debugLogs,
      details: error.message
    }, { status: 500 })
  }
}
