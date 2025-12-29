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

    // Primero, traer solo actividades del coach autenticado
    const { data: coachActivities, error: coachActivitiesError } = await supabase
      .from('activities')
      .select('id, title, type, coach_id, price, categoria')
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

    // Obtener inscripciones activas
    let { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        client_id,
        status,
        todo_list,
        activity_id
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
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', clientIds)

    if (usersError) {
      console.error('[coach-clients] Error en users:', usersError)
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 })
    }

    // No necesitamos consultar banco, calcularemos ingresos desde activities

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
    const basicClients = Array.from(clientsMap.values()).map((client: any) => {
      const statuses = new Set<string>((client.enrollments || []).map((e: any) => String(e?.status || '').toLowerCase()))
      const hasActive = statuses.has('activa') || statuses.has('active')
      const hasPending = statuses.has('pendiente') || statuses.has('pending')
      const clientStatus: 'active' | 'pending' | 'inactive' = hasActive ? 'active' : hasPending ? 'pending' : 'inactive'

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        avatar_url: client.avatar_url,
        progress: 0,
        status: clientStatus,
        lastActive: 'Nunca',
        totalExercises: 0,
        completedExercises: 0,
        totalRevenue: 0,
        activitiesCount: (client.activities || []).length,
        todoCount: 0,
        activities: (client.activities || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          amountPaid: a.amountPaid || a.price || 0
        }))
      }
    })

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
        usedFallback: true,
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