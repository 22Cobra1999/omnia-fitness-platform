import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    console.log('🔍 [VERIFY] Verificando datos para cliente:', clientId)

    // 1. Verificar perfil del cliente
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, created_at')
      .eq('id', clientId)
      .single()

    console.log('🔍 [VERIFY] Perfil del cliente:', profile)
    if (profileError) console.error('❌ [VERIFY] Error perfil:', profileError)

    // 2. Verificar enrollments del cliente
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('id, client_id, activity_id, status, start_date, created_at')
      .eq('client_id', clientId)

    console.log('🔍 [VERIFY] Enrollments del cliente:', enrollments)
    if (enrollmentsError) console.error('❌ [VERIFY] Error enrollments:', enrollmentsError)

    // 3. Verificar actividades del cliente
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        activity_id,
        status,
        activities!inner(
          id,
          title,
          coach_id,
          type
        )
      `)
      .eq('client_id', clientId)

    console.log('🔍 [VERIFY] Actividades del cliente:', activities)
    if (activitiesError) console.error('❌ [VERIFY] Error actividades:', activitiesError)

    // 4. Verificar ejecuciones de ejercicios del cliente
    const { data: executions, error: executionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        client_id,
        ejercicio_id,
        fecha_ejercicio,
        completado,
        ejercicios_detalles!inner(
          id,
          titulo,
          activity_id
        )
      `)
      .eq('client_id', clientId)
      .order('fecha_ejercicio', { ascending: false })

    console.log('🔍 [VERIFY] Ejecuciones del cliente:', executions)
    if (executionsError) console.error('❌ [VERIFY] Error ejecuciones:', executionsError)

    // 5. Verificar ejercicios programados
    const activityIds = enrollments?.map(e => e.activity_id) || []
    let plannedExercises = []
    
    if (activityIds.length > 0) {
      const { data: exercises, error: exercisesError } = await supabase
        .from('ejercicios_detalles')
        .select(`
          id,
          activity_id,
          titulo,
          fecha_ejercicio,
          activities!inner(
            id,
            title
          )
        `)
        .in('activity_id', activityIds)
        .not('fecha_ejercicio', 'is', null)
        .order('fecha_ejercicio', { ascending: false })

      plannedExercises = exercises || []
      console.log('🔍 [VERIFY] Ejercicios programados:', plannedExercises)
      if (exercisesError) console.error('❌ [VERIFY] Error ejercicios programados:', exercisesError)
    }

    // 6. Verificar pagos
    const { data: payments, error: paymentsError } = await supabase
      .from('banco')
      .select(`
        id,
        enrollment_id,
        amount_paid,
        payment_date,
        payment_status,
        activity_enrollments!inner(
          id,
          client_id,
          activity_id
        )
      `)
      .eq('activity_enrollments.client_id', clientId)

    console.log('🔍 [VERIFY] Pagos del cliente:', payments)
    if (paymentsError) console.error('❌ [VERIFY] Error pagos:', paymentsError)

    // 7. Verificar todo_list
    const { data: todos, error: todosError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        activity_id,
        todo_list,
        activities!inner(
          id,
          title
        )
      `)
      .eq('client_id', clientId)
      .not('todo_list', 'is', null)
      .neq('todo_list', '[]')

    console.log('🔍 [VERIFY] Todo list del cliente:', todos)
    if (todosError) console.error('❌ [VERIFY] Error todo list:', todosError)

    return NextResponse.json({
      success: true,
      data: {
        profile,
        enrollments,
        activities,
        executions,
        plannedExercises,
        payments,
        todos
      }
    })

  } catch (error) {
    console.error('❌ [VERIFY] Error general:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
