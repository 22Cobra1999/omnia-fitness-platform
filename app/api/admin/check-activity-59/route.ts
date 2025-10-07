import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const activityId = 59

    console.log('🔍 [ACTIVITY 59] Verificando actividad:', activityId)

    // 1. Verificar la actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, type, coach_id')
      .eq('id', activityId)
      .single()

    console.log('🔍 [ACTIVITY 59] Actividad encontrada:', activity)
    if (activityError) console.error('❌ [ACTIVITY 59] Error actividad:', activityError)

    // 2. Verificar ejercicios programados para esta actividad
    const { data: exercises, error: exercisesError } = await supabase
      .from('ejercicios_detalles')
      .select('id, titulo, fecha_ejercicio, activity_id')
      .eq('activity_id', activityId)
      .order('fecha_ejercicio', { ascending: true })

    console.log('🔍 [ACTIVITY 59] Ejercicios programados:', exercises?.length || 0)
    console.log('🔍 [ACTIVITY 59] Ejercicios data:', exercises)
    if (exercisesError) console.error('❌ [ACTIVITY 59] Error ejercicios:', exercisesError)

    // 3. Verificar ejecuciones del cliente para esta actividad
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
      .eq('client_id', '00dedc23-0b17-4e50-b84e-b2e8100dc93c')
      .eq('ejercicios_detalles.activity_id', activityId)
      .order('fecha_ejercicio', { ascending: false })

    console.log('🔍 [ACTIVITY 59] Ejecuciones del cliente:', executions?.length || 0)
    console.log('🔍 [ACTIVITY 59] Ejecuciones data:', executions)
    if (executionsError) console.error('❌ [ACTIVITY 59] Error ejecuciones:', executionsError)

    return NextResponse.json({
      success: true,
      data: {
        activity,
        exercises,
        executions
      }
    })

  } catch (error) {
    console.error('❌ [ACTIVITY 59] Error general:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}



























