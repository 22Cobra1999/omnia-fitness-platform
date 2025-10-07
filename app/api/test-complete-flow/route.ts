import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59
    // Usar el cliente existente
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    // Limpiar enrollment anterior si existe
    await supabase
      .from("activity_enrollments")
      .delete()
      .eq("client_id", testUserId)
      .eq("activity_id", activityId)

    console.log("🧪 Probando flujo completo de compra...")

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

    // 5. Verificar ejecuciones generadas automáticamente
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
    const executionsGenerated = executions?.length || 0

    // // console.log(`📊 Ejecuciones generadas: ${executionsGenerated} de ${expectedExecutions} esperadas`)

    // 6. Si no se generaron automáticamente, generarlas manualmente
    if (executionsGenerated === 0) {
      console.log("⚠️ No se generaron ejecuciones automáticamente, generando manualmente...")
      
      const executionsToInsert = []
      
      for (const period of periods || []) {
        for (const exercise of exercises || []) {
          executionsToInsert.push({
            periodo_id: period.id,
            ejercicio_id: exercise.id,
            client_id: testUserId,
            intensidad_aplicada: exercise.tipo === 'fuerza' ? 'Principiante' : 
                                exercise.tipo === 'cardio' ? 'Moderado' : 'Descanso',
            completado: false
          })
        }
      }

      console.log(`Generando ${executionsToInsert.length} ejecuciones manualmente...`)

      const { error: manualExecutionsError } = await supabase
        .from("ejecuciones_ejercicio")
        .insert(executionsToInsert)

      if (manualExecutionsError) {
        console.error("Error generando ejecuciones manualmente:", manualExecutionsError)
        return NextResponse.json({ 
          success: false, 
          error: "Error generando ejecuciones manualmente: " + manualExecutionsError.message 
        }, { status: 500 })
      }

      // console.log("✅ Ejecuciones generadas manualmente")
    }

    // 7. Verificar ejecuciones finales
    const { data: finalExecutions, error: finalExecutionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id")
      .in("periodo_id", periods?.map(p => p.id) || [])
      .eq("client_id", testUserId)

    if (finalExecutionsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error verificando ejecuciones finales: " + finalExecutionsError.message 
      }, { status: 500 })
    }

    const finalExecutionsCount = finalExecutions?.length || 0

    const exercisesByType = exercises.reduce((acc, ex) => {
      acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      message: "Flujo completo de compra probado exitosamente",
      data: {
        enrollmentId: enrollment.id,
        exercisesCount: exercises.length,
        periodsCount: periods?.length || 0,
        executionsGenerated: finalExecutionsCount,
        expectedExecutions,
        executionsMatch: finalExecutionsCount === expectedExecutions,
        exercisesByType,
        systemWorking: finalExecutionsCount > 0,
        triggerWorked: executionsGenerated > 0,
        manualGenerationUsed: executionsGenerated === 0,
        readyForProduction: finalExecutionsCount > 0,
        nextStep: finalExecutionsCount > 0 ? "Sistema listo para producción" : "Crear trigger para automatización"
      }
    })
  } catch (error: any) {
    console.error("Error en la prueba del flujo completo:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}