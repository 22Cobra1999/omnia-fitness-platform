import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('[coach-clients] Iniciando consulta de clientes')

    // Obtener inscripciones activas
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        client_id,
        status,
        todo_list,
        activity_id
      `)
      .eq('status', 'activa')

    if (enrollmentsError) {
      console.error('[coach-clients] Error en enrollments:', enrollmentsError)
      return NextResponse.json({ success: false, error: enrollmentsError.message }, { status: 500 })
    }

    console.log('[coach-clients] Inscripciones encontradas:', enrollments?.length || 0)

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        clients: []
      })
    }

    // Obtener datos de actividades
    const activityIds = enrollments.map(e => e.activity_id)
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title, type, coach_id')
      .in('id', activityIds)

    if (activitiesError) {
      console.error('[coach-clients] Error en activities:', activitiesError)
      return NextResponse.json({ success: false, error: activitiesError.message }, { status: 500 })
    }

    // Obtener datos de usuarios
    const clientIds = [...new Set(enrollments.map(e => e.client_id))]
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', clientIds)

    if (usersError) {
      console.error('[coach-clients] Error en users:', usersError)
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 })
    }

    // Obtener datos de pagos desde banco
    const enrollmentIds = enrollments.map(e => e.id)
    const { data: payments, error: paymentsError } = await supabase
      .from('banco')
      .select('enrollment_id, amount_paid')
      .in('enrollment_id', enrollmentIds)

    if (paymentsError) {
      console.error('[coach-clients] Error en payments:', paymentsError)
      return NextResponse.json({ success: false, error: paymentsError.message }, { status: 500 })
    }

    // Agrupar por cliente
    const clientsMap = new Map()
    
    for (const enrollment of enrollments || []) {
      const clientId = enrollment.client_id
      const user = users?.find(u => u.id === clientId)
      const activity = activities?.find(a => a.id === enrollment.activity_id)
      const payment = payments?.find(p => p.enrollment_id === enrollment.id)
      
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
      // Agregar amount_paid al activity
      const activityWithPayment = {
        ...activity,
        amount_paid: payment?.amount_paid || 0
      }
      clientData.activities.push(activityWithPayment)
      clientData.enrollments.push(enrollment)
    }

    // Procesar datos de clientes
    const processedClients = await Promise.all(
      Array.from(clientsMap.values()).map(async (client) => {
        const activities = client.activities

        // Calcular métricas
        let totalExercises = 0
        let completedExercises = 0
        let totalRevenue = 0
        let todoCount = 0


        for (const activity of activities) {
          // Contar ejercicios planificados
          const { data: ejercicios } = await supabase
            .from('ejercicios_detalles')
            .select('id')
            .eq('activity_id', activity.id)
          
          totalExercises += ejercicios?.length || 0

          // Contar ejercicios completados
          const { data: ejecuciones } = await supabase
            .from('ejecuciones_ejercicio')
            .select('id')
            .eq('client_id', client.id)
            .eq('completado', true)
            .in('ejercicio_id', (ejercicios || []).map((e: any) => e.id))

          completedExercises += ejecuciones?.length || 0

          // Sumar ingresos
          totalRevenue += activity.amount_paid || 0

          // Contar todos de las inscripciones
          const enrollment = client.enrollments.find((e: any) => e.activity_id === activity.id)
          if (enrollment?.todo_list) {
            try {
              // Si ya es un array, usarlo directamente
              if (Array.isArray(enrollment.todo_list)) {
                todoCount += enrollment.todo_list.length
              } else {
                // Si es string, parsearlo
                const todos = JSON.parse(enrollment.todo_list)
                todoCount += Array.isArray(todos) ? todos.length : 0
              }
            } catch (e) {
              // Si no es JSON válido, contar como 0
            }
          }
        }

        const progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

        // Última actividad
        const { data: lastActivity } = await supabase
          .from('ejecuciones_ejercicio')
          .select('fecha_ejercicio')
          .eq('client_id', client.id)
          .order('fecha_ejercicio', { ascending: false })
          .limit(1)
          .single()

        return {
          id: client.id,
          name: client.full_name || client.name || 'Cliente',
          email: client.email || '',
          avatar_url: client.avatar_url || null,
          progress,
          status: 'active' as const,
          lastActive: lastActivity?.fecha_ejercicio ? 
            new Date(lastActivity.fecha_ejercicio).toLocaleDateString() : 'Nunca',
          totalExercises,
          completedExercises,
          totalRevenue,
          activitiesCount: activities.length,
          todoCount,
          activities: activities.map((activity: any) => ({
            id: activity.id,
            title: activity.title,
            type: activity.type,
            amountPaid: activity.amount_paid || 0
          }))
        }
      })
    )

    console.log('[coach-clients] Clientes procesados:', processedClients.length)

    return NextResponse.json({
      success: true,
      clients: processedClients
    })

  } catch (error) {
    console.error('[coach-clients] Error general:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}