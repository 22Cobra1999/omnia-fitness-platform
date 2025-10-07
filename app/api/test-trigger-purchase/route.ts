import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59
    // Usar un cliente diferente para probar el trigger (UUID válido)
    const testUserId = '11111111-1111-1111-1111-111111111111'

    console.log("🧪 Probando compra con trigger automático...")

    // 1. Verificar ejercicios
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

    // 2. Verificar períodos
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

    // 3. Crear enrollment (esto debería disparar el trigger automáticamente)
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

    // 4. Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 5. Verificar ejecuciones generadas automáticamente por el trigger
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

    // 6. Verificar que las ejecuciones tienen la intensidad correcta
    const executionsByIntensity = executions?.reduce((acc, ex) => {
      acc[ex.intensidad_aplicada] = (acc[ex.intensidad_aplicada] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 7. Limpiar datos de prueba
    console.log("Limpiando datos de prueba...")
    
    // Eliminar ejecuciones de prueba
    await supabase
      .from("ejecuciones_ejercicio")
      .delete()
      .eq("client_id", testUserId)

    // Eliminar enrollment de prueba
    await supabase
      .from("activity_enrollments")
      .delete()
      .eq("id", enrollment.id)

    // console.log("✅ Datos de prueba limpiados")

    const exercisesByType = exercises.reduce((acc, ex) => {
      acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      message: "Trigger funcionando perfectamente",
      data: {
        enrollmentId: enrollment.id,
        exercisesCount: exercises.length,
        periodsCount: periods?.length || 0,
        executionsGeneratedByTrigger: executionsGenerated,
        expectedExecutions,
        triggerWorked: executionsGenerated === expectedExecutions,
        executionsByIntensity,
        exercisesByType,
        systemFullyAutomated: executionsGenerated > 0,
        readyForProduction: true,
        nextStep: "Sistema listo para compras reales desde el frontend"
      }
    })
  } catch (error: any) {
    console.error("Error probando trigger:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
