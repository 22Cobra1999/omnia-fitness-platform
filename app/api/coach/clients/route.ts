import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {

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
      .select('id, title, type, coach_id, price, categoria')
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

    // No necesitamos consultar banco, calcularemos ingresos desde activities

    // Agrupar por cliente
    const clientsMap = new Map()
    
    for (const enrollment of enrollments || []) {
      const clientId = enrollment.client_id
      const user = users?.find(u => u.id === clientId)
      const activity = activities?.find(a => a.id === enrollment.activity_id)
      
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
          // Determinar si es nutrición o fitness
          // Verificar tanto en type como en categoria
          const isNutrition = 
            activity.type === 'nutrition' || 
            activity.type === 'nutricion' ||
            activity.categoria === 'nutrition' ||
            activity.categoria === 'nutricion'
          
          if (isNutrition) {
            // Para productos de nutrición: contar platos
            const { data: platos } = await supabase
              .from('nutrition_program_details')
              .select('id')
              .eq('activity_id', activity.id)
            
            totalExercises += platos?.length || 0

            // Contar platos completados desde progreso_cliente_nutricion
            const { data: progresoRecords } = await supabase
              .from('progreso_cliente_nutricion')
              .select('ejercicios_completados')
              .eq('cliente_id', client.id)
              .eq('actividad_id', activity.id)

            progresoRecords?.forEach(record => {
              let completados: any[] = []
              try {
                // Manejar tanto arrays nativos de PostgreSQL como strings JSON
                if (Array.isArray(record.ejercicios_completados)) {
                  completados = record.ejercicios_completados
                } else if (typeof record.ejercicios_completados === 'string') {
                  completados = JSON.parse(record.ejercicios_completados || '[]')
                }
              } catch (err) {
                completados = []
              }
              completedExercises += completados.length
            })
          } else {
            // Para productos de fitness: contar ejercicios
            const { data: ejercicios } = await supabase
              .from('ejercicios_detalles')
              .select('id')
            .contains('activity_id', { [activity.id]: {} })
            
            totalExercises += ejercicios?.length || 0

            // Contar ejercicios completados desde progreso_cliente
            const { data: progresoRecords } = await supabase
              .from('progreso_cliente')
              .select('ejercicios_completados')
              .eq('cliente_id', client.id)
              .eq('actividad_id', activity.id)

            progresoRecords?.forEach(record => {
              let completados: any[] = []
              try {
                // Manejar tanto arrays nativos de PostgreSQL como strings JSON
                if (Array.isArray(record.ejercicios_completados)) {
                  completados = record.ejercicios_completados
                } else if (typeof record.ejercicios_completados === 'string') {
                  completados = JSON.parse(record.ejercicios_completados || '[]')
                }
              } catch (err) {
                completados = []
              }
              completedExercises += completados.length
            })
          }

          // Sumar ingresos (precio de la actividad)
          totalRevenue += activity.price || 0

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

        // Última actividad desde progreso_cliente o progreso_cliente_nutricion
        // Primero verificar en progreso_cliente (fitness)
        const { data: lastActivityFitness } = await supabase
          .from('progreso_cliente')
          .select('fecha')
          .eq('cliente_id', client.id)
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        // Luego verificar en progreso_cliente_nutricion (nutrición)
        const { data: lastActivityNutrition } = await supabase
          .from('progreso_cliente_nutricion')
          .select('fecha')
          .eq('cliente_id', client.id)
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        // Obtener la fecha más reciente entre ambas
        let lastActivityDate: string | null = null
        if (lastActivityFitness?.fecha && lastActivityNutrition?.fecha) {
          const fitnessDate = new Date(lastActivityFitness.fecha)
          const nutritionDate = new Date(lastActivityNutrition.fecha)
          lastActivityDate = fitnessDate > nutritionDate ? lastActivityFitness.fecha : lastActivityNutrition.fecha
        } else if (lastActivityFitness?.fecha) {
          lastActivityDate = lastActivityFitness.fecha
        } else if (lastActivityNutrition?.fecha) {
          lastActivityDate = lastActivityNutrition.fecha
        }

        return {
          id: client.id,
          name: client.full_name || client.name || 'Cliente',
          email: client.email || '',
          avatar_url: client.avatar_url || null,
          progress,
          status: 'active' as const,
          lastActive: lastActivityDate ? 
            new Date(lastActivityDate).toLocaleDateString() : 'Nunca',
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