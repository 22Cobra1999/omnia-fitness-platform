import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    console.log("🎭 Simulando compra completa...")

    // 1. Verificar ejercicios (usando query directo)
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

    if (!exercises || exercises.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No hay ejercicios disponibles" 
      }, { status: 400 })
    }

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

    // 3. Crear enrollment de prueba
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

    // 4. Esperar un momento para que el trigger se ejecute (si existe)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 5. Verificar ejecuciones generadas
    const { data: executions, error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id")
      .in("periodo_id", periods?.map(p => p.id) || [])
      .eq("client_id", testUserId)

    if (executionsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejecuciones: " + executionsError.message 
      }, { status: 500 })
    }

    const expectedExecutions = exercises.length * (periods?.length || 0)

    // // console.log(`📊 Ejecuciones generadas: ${executions?.length || 0} de ${expectedExecutions} esperadas`)

    return NextResponse.json({
      success: true,
      message: "Simulación de compra completada",
      data: {
        enrollmentId: enrollment.id,
        exercisesCount: exercises.length,
        periodsCount: periods?.length || 0,
        executionsGenerated: executions?.length || 0,
        expectedExecutions,
        triggerWorked: (executions?.length || 0) === expectedExecutions,
        systemReady: (executions?.length || 0) > 0,
        exercisesByType: exercises.reduce((acc, ex) => {
          acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })
  } catch (error: any) {
    console.error("Error en la simulación de compra:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































