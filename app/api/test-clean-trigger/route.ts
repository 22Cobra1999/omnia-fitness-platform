import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    console.log("🧪 Probando trigger limpio...")

    const activityId = 59
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    // 1. Verificar estado actual
    const { data: currentExecutions, error: currentError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id, periodo_id, client_id")
      .eq("client_id", testUserId)

    console.log(`Ejecuciones actuales: ${currentExecutions?.length || 0}`)

    // 2. Verificar períodos y ejercicios
    const { data: periods, error: periodsError } = await supabase
      .from("periodos_asignados")
      .select("id, numero_periodo")
      .eq("activity_id", activityId)
      .order("numero_periodo")

    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id")
      .eq("activity_id", activityId)

    if (periodsError || exercisesError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo períodos o ejercicios" 
      }, { status: 500 })
    }

    const expectedExecutions = (exercises?.length || 0) * (periods?.length || 0)
    console.log(`Esperadas: ${expectedExecutions} ejecuciones (${exercises?.length} ejercicios × ${periods?.length} períodos)`)

    // 3. Limpiar datos anteriores si existen
    if (currentExecutions && currentExecutions.length > 0) {
      console.log("Limpiando ejecuciones anteriores...")
      await supabase
        .from("ejecuciones_ejercicio")
        .delete()
        .eq("client_id", testUserId)

      await supabase
        .from("activity_enrollments")
        .delete()
        .eq("client_id", testUserId)
        .eq("activity_id", activityId)
    }

    // 4. Crear enrollment (disparará el trigger)
    const enrollmentData = {
      activity_id: activityId,
      client_id: testUserId,
      status: "activa",
      payment_status: "paid",
      amount_paid: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Creando enrollment...")

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("activity_enrollments")
      .insert(enrollmentData)
      .select()
      .single()

    if (enrollmentError) {
      console.error("Error creando enrollment:", enrollmentError)
      return NextResponse.json({ 
        success: false, 
        error: "Error creando enrollment: " + enrollmentError.message 
      }, { status: 500 })
    }

    // console.log("✅ Enrollment creado:", enrollment.id)

    // 5. Esperar que el trigger se ejecute
    console.log("Esperando trigger...")
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 6. Verificar ejecuciones generadas
    const { data: executions, error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id, periodo_id, ejercicio_id, client_id, intensidad_aplicada")
      .eq("client_id", testUserId)

    if (executionsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejecuciones: " + executionsError.message 
      }, { status: 500 })
    }

    const executionsGenerated = executions?.length || 0
    console.log(`Ejecuciones generadas: ${executionsGenerated}`)

    // 7. Verificar ejecuciones sin client_id
    const { data: executionsWithoutClient, error: withoutClientError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id")
      .is("client_id", null)

    const executionsWithoutClientCount = executionsWithoutClient?.length || 0

    // 8. Verificar distribución por período
    const executionsByPeriod = executions?.reduce((acc, ex) => {
      acc[ex.periodo_id] = (acc[ex.periodo_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 9. Verificar que cada período tiene el número correcto de ejecuciones
    const expectedPerPeriod = exercises?.length || 0
    const periodsWithCorrectCount = Object.values(executionsByPeriod).filter(count => count === expectedPerPeriod).length

    return NextResponse.json({
      success: true,
      message: "Trigger probado",
      data: {
        enrollmentId: enrollment.id,
        expectedExecutions,
        executionsGenerated,
        executionsWithoutClientCount,
        executionsMatch: executionsGenerated === expectedExecutions,
        noNullClientIds: executionsWithoutClientCount === 0,
        executionsByPeriod,
        expectedPerPeriod,
        periodsWithCorrectCount,
        totalPeriods: periods?.length || 0,
        allPeriodsCorrect: periodsWithCorrectCount === (periods?.length || 0),
        systemWorking: executionsGenerated === expectedExecutions && executionsWithoutClientCount === 0,
        sampleExecutions: executions?.slice(0, 5) || []
      }
    })
  } catch (error: any) {
    console.error("Error probando trigger limpio:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































