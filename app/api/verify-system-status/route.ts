import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59

    // console.log("🔍 Verificando estado del sistema...")

    // 1. Verificar actividad
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, title, coach_id")
      .eq("id", activityId)
      .single()

    if (activityError) {
      return NextResponse.json({ success: false, error: "Error obteniendo actividad" }, { status: 500 })
    }

    // 2. Verificar ejercicios
    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)

    if (exercisesError) {
      return NextResponse.json({ success: false, error: "Error obteniendo ejercicios" }, { status: 500 })
    }

    // 3. Verificar períodos
    const { data: periods, error: periodsError } = await supabase
      .from("periodos_asignados")
      .select("id, numero_periodo, created_by")
      .eq("activity_id", activityId)
      .order("numero_periodo")

    if (periodsError) {
      return NextResponse.json({ success: false, error: "Error obteniendo períodos" }, { status: 500 })
    }

    // 4. Verificar ejecuciones existentes
    const { data: executions, error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id, client_id")
      .in("periodo_id", periods?.map(p => p.id) || [])

    if (executionsError) {
      return NextResponse.json({ success: false, error: "Error obteniendo ejecuciones" }, { status: 500 })
    }

    // 5. Verificar enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("activity_enrollments")
      .select("id, client_id, status")
      .eq("activity_id", activityId)

    if (enrollmentsError) {
      return NextResponse.json({ success: false, error: "Error obteniendo enrollments" }, { status: 500 })
    }

    // 6. Calcular métricas
    const expectedExecutions = (exercises?.length || 0) * (periods?.length || 0)
    const uniqueClients = new Set(executions?.map(e => e.client_id)).size
    const activeEnrollments = enrollments?.filter(e => e.status === 'activa').length || 0

    return NextResponse.json({
      success: true,
      message: "Estado del sistema verificado",
      data: {
        activity: activity,
        exercises: {
          count: exercises?.length || 0,
          types: exercises?.reduce((acc, ex) => {
            acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        },
        periods: {
          count: periods?.length || 0,
          withCoachId: periods?.filter(p => p.created_by === activity.coach_id).length || 0,
          coachId: activity.coach_id
        },
        executions: {
          count: executions?.length || 0,
          expected: expectedExecutions,
          uniqueClients: uniqueClients
        },
        enrollments: {
          total: enrollments?.length || 0,
          active: activeEnrollments
        },
        systemStatus: {
          exercisesPopulated: (exercises?.length || 0) > 0,
          periodsConfigured: (periods?.length || 0) > 0,
          periodsHaveCoachId: periods?.every(p => p.created_by === activity.coach_id) || false,
          executionsGenerated: (executions?.length || 0) > 0,
          readyForTesting: (exercises?.length || 0) > 0 && (periods?.length || 0) > 0
        }
      }
    })
  } catch (error: any) {
    console.error("Error verificando estado del sistema:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}






































