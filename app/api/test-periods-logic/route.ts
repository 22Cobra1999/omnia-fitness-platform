import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    console.log("🧪 Probando lógica de períodos corregida...")

    const activityId = 59
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    // 1. Limpiar datos anteriores
    console.log("Limpiando datos anteriores...")
    
    await supabase
      .from("ejecuciones_ejercicio")
      .delete()
      .eq("client_id", testUserId)

    await supabase
      .from("activity_enrollments")
      .delete()
      .eq("client_id", testUserId)
      .eq("activity_id", activityId)

    // console.log("✅ Datos anteriores limpiados")

    // 2. Verificar períodos disponibles
    const { data: periods, error: periodsError } = await supabase
      .from("periodos_asignados")
      .select("id, numero_periodo, fecha_inicio, fecha_fin")
      .eq("activity_id", activityId)
      .order("numero_periodo")

    if (periodsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo períodos: " + periodsError.message 
      }, { status: 500 })
    }

    // // console.log(`📊 Períodos encontrados: ${periods?.length || 0}`)
    console.log("Períodos:", periods?.map(p => `ID: ${p.id}, Número: ${p.numero_periodo}`))

    // 3. Verificar ejercicios
    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)
      .order("id")

    if (exercisesError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejercicios: " + exercisesError.message 
      }, { status: 500 })
    }

    // // console.log(`📊 Ejercicios encontrados: ${exercises?.length || 0}`)

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
    console.log("Esperando que el trigger se ejecute...")
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 6. Verificar ejecuciones generadas por período
    const { data: executionsByPeriod, error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .select(`
        periodo_id,
        periodos_asignados!inner(numero_periodo),
        ejercicio_id,
        ejercicios_detalles!inner(nombre_ejercicio, tipo),
        client_id,
        intensidad_aplicada,
        completado
      `)
      .eq("client_id", testUserId)
      .order("periodo_id")
      .order("ejercicio_id")

    if (executionsError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejecuciones: " + executionsError.message 
      }, { status: 500 })
    }

    // 7. Analizar distribución por período
    const periodAnalysis = periods?.map(period => {
      const periodExecutions = executionsByPeriod?.filter(ex => ex.periodo_id === period.id) || []
      return {
        periodoId: period.id,
        numeroPeriodo: period.numero_periodo,
        ejecucionesCount: periodExecutions.length,
        ejerciciosUnicos: [...new Set(periodExecutions.map(ex => ex.ejercicio_id))].length,
        intensidades: periodExecutions.reduce((acc, ex) => {
          acc[ex.intensidad_aplicada] = (acc[ex.intensidad_aplicada] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        fechaInicio: period.fecha_inicio,
        fechaFin: period.fecha_fin
      }
    }) || []

    const expectedExecutionsPerPeriod = exercises?.length || 0
    const totalExpectedExecutions = expectedExecutionsPerPeriod * (periods?.length || 0)
    const totalExecutionsGenerated = executionsByPeriod?.length || 0

    // 8. Verificar que cada período tiene las ejecuciones correctas
    const periodsWithCorrectExecutions = periodAnalysis.filter(p => p.ejecucionesCount === expectedExecutionsPerPeriod)

    const exercisesByType = exercises?.reduce((acc, ex) => {
      acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      message: "Lógica de períodos probada exitosamente",
      data: {
        enrollmentId: enrollment.id,
        periodsCount: periods?.length || 0,
        exercisesCount: exercises?.length || 0,
        expectedExecutionsPerPeriod,
        totalExpectedExecutions,
        totalExecutionsGenerated,
        executionsMatch: totalExecutionsGenerated === totalExpectedExecutions,
        periodAnalysis,
        periodsWithCorrectExecutions: periodsWithCorrectExecutions.length,
        allPeriodsCorrect: periodsWithCorrectExecutions.length === (periods?.length || 0),
        exercisesByType,
        systemWorking: totalExecutionsGenerated > 0 && periodsWithCorrectExecutions.length === (periods?.length || 0),
        sampleExecutions: executionsByPeriod?.slice(0, 10) || []
      }
    })
  } catch (error: any) {
    console.error("Error probando lógica de períodos:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































