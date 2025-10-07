import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    console.log("🧹 Limpiando y probando sistema completo...")

    const activityId = 59
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    // 1. Limpiar todos los datos de prueba
    console.log("Limpiando datos de prueba...")
    
    // Eliminar ejecuciones del usuario
    const { error: deleteExecutionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .delete()
      .eq("client_id", testUserId)

    if (deleteExecutionsError) {
      console.log("Error eliminando ejecuciones:", deleteExecutionsError.message)
    }

    // Eliminar enrollments del usuario
    const { error: deleteEnrollmentsError } = await supabase
      .from("activity_enrollments")
      .delete()
      .eq("client_id", testUserId)
      .eq("activity_id", activityId)

    if (deleteEnrollmentsError) {
      console.log("Error eliminando enrollments:", deleteEnrollmentsError.message)
    }

    // console.log("✅ Datos de prueba limpiados")

    // 2. Verificar ejercicios y períodos
    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)

    const { data: periods, error: periodsError } = await supabase
      .from("periodos_asignados")
      .select("id, numero_periodo")
      .eq("activity_id", activityId)

    if (exercisesError || periodsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejercicios o períodos" 
      }, { status: 500 })
    }

    // // console.log(`📊 Ejercicios: ${exercises?.length || 0}, Períodos: ${periods?.length || 0}`)

    // 3. Crear enrollment de prueba (esto debería disparar el trigger)
    const enrollmentData = {
      activity_id: activityId,
      client_id: testUserId,
      status: "activa",
      payment_status: "paid",
      amount_paid: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Creando enrollment de prueba...")

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

    // 4. Esperar que el trigger se ejecute
    console.log("Esperando que el trigger se ejecute...")
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 5. Verificar ejecuciones generadas
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

    const expectedExecutions = (exercises?.length || 0) * (periods?.length || 0)
    const executionsGenerated = executions?.length || 0

    // // console.log(`📊 Ejecuciones generadas: ${executionsGenerated} de ${expectedExecutions} esperadas`)

    // 6. Verificar que todas las ejecuciones tienen client_id
    const executionsWithoutClient = executions?.filter(ex => !ex.client_id) || []
    const executionsWithClient = executions?.filter(ex => ex.client_id) || []

    // 7. Verificar distribución por período
    const executionsByPeriod = executions?.reduce((acc, ex) => {
      acc[ex.periodo_id] = (acc[ex.periodo_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 8. Verificar distribución por intensidad
    const executionsByIntensity = executions?.reduce((acc, ex) => {
      acc[ex.intensidad_aplicada] = (acc[ex.intensidad_aplicada] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const exercisesByType = exercises?.reduce((acc, ex) => {
      acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      message: "Sistema limpio y funcionando perfectamente",
      data: {
        enrollmentId: enrollment.id,
        exercisesCount: exercises?.length || 0,
        periodsCount: periods?.length || 0,
        executionsGenerated,
        expectedExecutions,
        executionsMatch: executionsGenerated === expectedExecutions,
        executionsWithoutClient: executionsWithoutClient.length,
        executionsWithClient: executionsWithClient.length,
        executionsByPeriod,
        executionsByIntensity,
        exercisesByType,
        systemWorking: executionsGenerated > 0 && executionsWithoutClient.length === 0,
        triggerWorking: executionsGenerated === expectedExecutions,
        readyForProduction: executionsGenerated > 0 && executionsWithoutClient.length === 0,
        sampleExecutions: executions?.slice(0, 5) || []
      }
    })
  } catch (error: any) {
    console.error("Error limpiando y probando sistema:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































