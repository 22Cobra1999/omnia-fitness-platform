import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    console.log('🔍 [TEST CALENDAR] Probando consulta del calendario para cliente:', clientId)

    // 1. Obtener enrollments del cliente
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("activity_enrollments")
      .select(`
        id,
        activity_id,
        start_date,
        status
      `)
      .eq("client_id", clientId)
      .eq("status", "activa")

    console.log('🔍 [TEST CALENDAR] Enrollments encontrados:', enrollments?.length || 0)
    console.log('🔍 [TEST CALENDAR] Enrollments data:', enrollments)

    if (enrollmentsError) {
      console.error('❌ [TEST CALENDAR] Error enrollments:', enrollmentsError)
      return NextResponse.json({ success: false, error: enrollmentsError.message }, { status: 500 })
    }

    // 2. Obtener ejecuciones del cliente
    const { data: executions, error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select(`
        id,
        fecha_ejercicio,
        completado,
        ejercicio_id,
        periodo_id
      `)
      .eq("client_id", clientId)
      .not("fecha_ejercicio", "is", null)
      .order("fecha_ejercicio", { ascending: true })

    console.log('🔍 [TEST CALENDAR] Ejecuciones encontradas:', executions?.length || 0)
    console.log('🔍 [TEST CALENDAR] Ejecuciones data:', executions)

    if (executionsError) {
      console.error('❌ [TEST CALENDAR] Error ejecuciones:', executionsError)
      return NextResponse.json({ success: false, error: executionsError.message }, { status: 500 })
    }

    // 3. Crear eventos del calendario
    const calendarEvents = []
    
    for (const execution of executions || []) {
      if (execution.fecha_ejercicio) {
        calendarEvents.push({
          id: `execution-${execution.id}`,
          title: `Ejercicio ${execution.ejercicio_id}`,
          date: execution.fecha_ejercicio,
          type: 'exercise',
          status: execution.completado ? 'completed' : 'pending'
        })
      }
    }

    console.log('🔍 [TEST CALENDAR] Eventos del calendario creados:', calendarEvents.length)
    console.log('🔍 [TEST CALENDAR] Eventos data:', calendarEvents)

    return NextResponse.json({
      success: true,
      data: {
        enrollments,
        executions,
        calendarEvents
      }
    })

  } catch (error) {
    console.error('❌ [TEST CALENDAR] Error general:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}



























