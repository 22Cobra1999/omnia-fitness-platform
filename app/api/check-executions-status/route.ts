import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log("🔍 Verificando estado de ejecuciones...")

    const activityId = 59
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    // 1. Verificar ejecuciones del usuario
    const { data: executions, error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id, periodo_id, ejercicio_id, client_id, intensidad_aplicada, completado")
      .eq("client_id", testUserId)

    if (executionsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejecuciones: " + executionsError.message 
      }, { status: 500 })
    }

    // 2. Verificar enrollments del usuario
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("activity_enrollments")
      .select("id, activity_id, client_id, status, created_at")
      .eq("client_id", testUserId)
      .eq("activity_id", activityId)

    if (enrollmentsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo enrollments: " + enrollmentsError.message 
      }, { status: 500 })
    }

    // 3. Verificar ejercicios y períodos
    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id")
      .eq("activity_id", activityId)

    const { data: periods, error: periodsError } = await supabase
      .from("periodos_asignados")
      .select("id")
      .eq("activity_id", activityId)

    const expectedExecutions = (exercises?.length || 0) * (periods?.length || 0)

    // 4. Verificar ejecuciones sin client_id
    const { data: executionsWithoutClient, error: withoutClientError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id")
      .is("client_id", null)

    // 5. Verificar ejecuciones con client_id
    const { data: executionsWithClient, error: withClientError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id, client_id")
      .not("client_id", "is", null)

    const executionsByClient = executionsWithClient?.reduce((acc, ex) => {
      acc[ex.client_id] = (acc[ex.client_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      message: "Estado de ejecuciones verificado",
      data: {
        userExecutions: {
          count: executions?.length || 0,
          expected: expectedExecutions,
          hasCorrectCount: (executions?.length || 0) === expectedExecutions,
          executions: executions?.slice(0, 5) || [] // Mostrar solo las primeras 5
        },
        enrollments: {
          count: enrollments?.length || 0,
          enrollments: enrollments || []
        },
        systemStatus: {
          exercisesCount: exercises?.length || 0,
          periodsCount: periods?.length || 0,
          expectedExecutions,
          executionsWithoutClient: executionsWithoutClient?.length || 0,
          executionsWithClient: executionsWithClient?.length || 0,
          executionsByClient,
          triggerIssue: (executionsWithoutClient?.length || 0) > 0
        },
        issues: {
          clientIdNotInserted: (executionsWithoutClient?.length || 0) > 0,
          incorrectExecutionCount: (executions?.length || 0) !== expectedExecutions,
          needsTriggerFix: true
        },
        nextSteps: [
          "Ejecutar script db/fix-trigger-client-id.sql",
          "Verificar que el trigger inserte client_id correctamente",
          "Limpiar ejecuciones sin client_id"
        ]
      }
    })
  } catch (error: any) {
    console.error("Error verificando estado de ejecuciones:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































