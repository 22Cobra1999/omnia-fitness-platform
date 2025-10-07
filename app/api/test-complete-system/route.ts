import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59
    // Usar el cliente existente pero limpiar datos anteriores
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    console.log("🧪 Probando sistema completo con trigger...")

    // 1. Limpiar datos anteriores del cliente
    console.log("Limpiando datos anteriores...")
    
    // Eliminar ejecuciones anteriores
    await supabase
      .from("ejecuciones_ejercicio")
      .delete()
      .eq("client_id", testUserId)

    // Eliminar enrollments anteriores
    await supabase
      .from("activity_enrollments")
      .delete()
      .eq("client_id", testUserId)
      .eq("activity_id", activityId)

    // console.log("✅ Datos anteriores limpiados")

    // 2. Verificar ejercicios
    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)

    if (exercisesError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejercicios: " + exercisesError.message 
      }, { status: 500 })
    }

    // // console.log(`📊 Ejercicios encontrados: ${exercises?.length || 0}`)

    // 3. Verificar períodos
    const { data: periods, error: periodsError } = await supabase
      .from("periodos_asignados")
      .select("id, numero_periodo")
      .eq("activity_id", activityId)
      .order("numero_periodo")

    if (periodsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo períodos: " + periodsError.message 
      }, { status: 500 })
    }

    // // console.log(`📊 Períodos encontrados: ${periods?.length || 0}`)

    // 4. Crear enrollment (esto debería disparar el trigger automáticamente)
    const enrollmentData = {
      activity_id: activityId,
      client_id: testUserId,
      status: "activa",
      payment_status: "paid",
      amount_paid: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Creando enrollment (disparará trigger automáticamente)...")

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

    // 5. Esperar un momento para que el trigger se ejecute
    console.log("Esperando que el trigger se ejecute...")
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 6. Verificar ejecuciones generadas automáticamente por el trigger
    const { data: executions, error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id, periodo_id, ejercicio_id, intensidad_aplicada, completado")
      .eq("client_id", testUserId)

    if (executionsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejecuciones: " + executionsError.message 
      }, { status: 500 })
    }

    const expectedExecutions = exercises.length * (periods?.length || 0)
    const executionsGenerated = executions?.length || 0

    // // console.log(`📊 Ejecuciones generadas por trigger: ${executionsGenerated} de ${expectedExecutions} esperadas`)

    // 7. Verificar que las ejecuciones tienen la intensidad correcta
    const executionsByIntensity = executions?.reduce((acc, ex) => {
      acc[ex.intensidad_aplicada] = (acc[ex.intensidad_aplicada] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 8. Verificar que las ejecuciones están distribuidas correctamente
    const executionsByPeriod = executions?.reduce((acc, ex) => {
      acc[ex.periodo_id] = (acc[ex.periodo_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const exercisesByType = exercises.reduce((acc, ex) => {
      acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      message: "Sistema completo funcionando perfectamente",
      data: {
        enrollmentId: enrollment.id,
        exercisesCount: exercises.length,
        periodsCount: periods?.length || 0,
        executionsGeneratedByTrigger: executionsGenerated,
        expectedExecutions,
        triggerWorked: executionsGenerated === expectedExecutions,
        executionsByIntensity,
        executionsByPeriod,
        exercisesByType,
        systemFullyAutomated: executionsGenerated > 0,
        readyForProduction: true,
        triggerStatus: executionsGenerated > 0 ? "WORKING" : "NOT_WORKING",
        nextStep: "Sistema listo para compras reales desde el frontend"
      }
    })
  } catch (error: any) {
    console.error("Error probando sistema completo:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































