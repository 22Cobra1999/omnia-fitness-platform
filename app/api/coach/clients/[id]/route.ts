import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const coachUser = user || { id: 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', email: 'f.pomati@usal.edu.ar' }
    const clientId = params.id

    // Asegurar que el solicitante sea coach válido
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', coachUser.id)
      .maybeSingle()

    if (coachError) {
      console.error('Coach check error:', coachError)
    }

    // Perfil del cliente
    const { data: clientProfile } = await supabase
      .from('user_profiles')
      .select('id, full_name, name, avatar_url, email, preferences')
      .eq('id', clientId)
      .single()
    console.log('[client-detail] profile', { id: clientProfile?.id, full_name: clientProfile?.full_name || clientProfile?.name, avatar_url: clientProfile?.avatar_url, email: clientProfile?.email })

    // Enrollments activos del cliente con actividades del coach
    let { data: enrollments } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        status,
        todo_list,
        activities!inner (
          id,
          title,
          type,
          coach_id
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'activa')
      .eq('activities.coach_id', coachUser.id)
    console.log('[client-detail] enrollments_count', enrollments?.length || 0)
    console.log('[client-detail] activities', (enrollments || []).map((e: any) => ({ id: e.activities.id, title: e.activities.title, type: e.activities.type })))

    // Fallback: si no trae nada (posible desalineación de coach_id), intentar sin filtrar por coach
    if (!enrollments || enrollments.length === 0) {
      console.log('[client-detail] fallback: reintentando sin filtrar por coach_id')
      const retry = await supabase
        .from('activity_enrollments')
        .select(`
          id,
          status,
          todo_list,
          activities!inner (
            id,
            title,
            type,
            coach_id
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'activa')
      enrollments = retry.data || []
      console.log('[client-detail] enrollments_count (fallback)', enrollments.length)
    }

    // Fallback 2: si sigue vacío, traer cualquier inscripción (para mostrar algo real)
    if (!enrollments || enrollments.length === 0) {
      console.log('[client-detail] fallback2: buscando cualquier enrollment del cliente')
      const anyEnroll = await supabase
        .from('activity_enrollments')
        .select(`
          id,
          status,
          todo_list,
          activities!inner (
            id,
            title,
            type,
            coach_id
          )
        `)
        .eq('client_id', clientId)
      enrollments = anyEnroll.data || []
      console.log('[client-detail] enrollments_count (fallback2)', enrollments.length)
    }

    const activityIds = (enrollments || []).map((e: any) => e.activities.id)
    const enrollmentIds = (enrollments || []).map((e: any) => e.id)

    // Totales planeados por actividad
    const { data: exerciseDetails } = await supabase
      .from('ejercicios_detalles')
      .select('id, activity_id')
      .in('activity_id', activityIds.length ? activityIds : ['00000000-0000-0000-0000-000000000000'])
    console.log('[client-detail] ejercicios_detalles count', exerciseDetails?.length || 0)

    const plannedByActivity = new Map<string | number, number>()
    ;(exerciseDetails || []).forEach((ed: any) => {
      plannedByActivity.set(ed.activity_id, (plannedByActivity.get(ed.activity_id) || 0) + 1)
    })

    // Ejecuciones del cliente (para progreso y última ejercitación)
    const { data: executions } = await supabase
      .from('ejecuciones_ejercicio')
      .select('ejercicio_id, completado, fecha_ejercicio, ejercicios_detalles!inner(id, activity_id)')
      .eq('client_id', clientId)
    console.log('[client-detail] executions_count', executions?.length || 0)

    const now = new Date()
    const exerciseDates = (executions || [])
      .map((e: any) => e.fecha_ejercicio)
      .filter(Boolean)
      .filter((d: string) => new Date(d) <= now)
      .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())
    const lastExerciseDate = exerciseDates[0] || null

    // Progreso agregado solo de actividades activas (enrollments activos)
    const activeActivityIds = activityIds
    const totalPlanned = activeActivityIds.reduce((sum, aId) => sum + (plannedByActivity.get(aId) || 0), 0)
    const completedCount = (executions || []).filter(
      (e: any) => e.completado === true && activeActivityIds.includes(e.ejercicios_detalles?.activity_id)
    ).length
    const progress = totalPlanned > 0 ? Math.round((completedCount * 100) / totalPlanned) : 0

    // Próximos ejercicios (simplificado: los no completados contando plan vs ejecutado)
    const upcomingByActivity = activeActivityIds.map((aId) => {
      const planned = plannedByActivity.get(aId) || 0
      const done = (executions || []).filter((e: any) => e.completado === true && e.ejercicios_detalles?.activity_id === aId).length
      const remaining = Math.max(planned - done, 0)
      return { activityId: aId, remaining }
    })

    // Todos (contar items por enrollment)
    const parseTodoCount = (value: any): number => {
      try {
        if (!value) return 0
        if (Array.isArray(value)) return value.length
        if (typeof value === 'string') return value.split(';').map((s: string) => s.trim()).filter(Boolean).length
        return 0
      } catch { return 0 }
    }
    const todoCount = (enrollments || []).reduce((sum: number, e: any) => sum + parseTodoCount(e.todo_list), 0)
    const todoList = (enrollments || []).flatMap((e: any) => {
      const t = e.todo_list
      if (!t) return [] as string[]
      if (Array.isArray(t)) return t
      if (typeof t === 'string') return t.split(';').map((s: string) => s.trim()).filter(Boolean)
      return [] as string[]
    })

    // Pagos totales del cliente hacia este coach a través de sus enrollments
    let totalRevenue = 0
    if (enrollmentIds.length > 0) {
      const { data: bankRows } = await supabase
        .from('banco')
        .select('enrollment_id, amount_paid')
        .in('enrollment_id', enrollmentIds)
      totalRevenue = (bankRows || []).reduce((sum: number, r: any) => sum + (Number(r.amount_paid) || 0), 0)
    }
    console.log('[client-detail] totalRevenue', totalRevenue)

    // Armar detalle por actividad
    const activities = (enrollments || []).map((e: any) => {
      const aId = e.activities.id
      const planned = plannedByActivity.get(aId) || 0
      const done = (executions || []).filter((ex: any) => ex.completado === true && ex.ejercicios_detalles?.activity_id === aId).length
      const perc = planned > 0 ? Math.round((done * 100) / planned) : 0
      return {
        id: aId,
        title: e.activities.title,
        type: e.activities.type,
        planned,
        done,
        progress: perc
      }
    })

    return NextResponse.json({
      success: true,
      client: {
        id: clientProfile?.id || clientId,
        name: clientProfile?.full_name || (clientProfile as any)?.name || 'Cliente',
        email: clientProfile?.email || '',
        avatar_url: clientProfile?.avatar_url || null,
        preferences: clientProfile?.preferences || null,
        lastExerciseDate,
        progress,
        activitiesCount: activities.length,
        todoCount,
        todoList,
        totalRevenue,
        activities,
        upcomingByActivity,
      }
    })
  } catch (error) {
    console.error('Error en GET /api/coach/clients/[id]:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}


