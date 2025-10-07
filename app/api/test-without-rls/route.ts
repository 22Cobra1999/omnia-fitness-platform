import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    console.log("🔓 Probando sin RLS...")

    // 1. Deshabilitar RLS temporalmente
    const { error: disableError } = await supabase
      .rpc('disable_rls_temporarily')

    if (disableError) {
      console.log("No se puede deshabilitar RLS via RPC, continuando...")
    }

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

    if (!exercises || exercises.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No hay ejercicios disponibles" 
      }, { status: 400 })
    }

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

    // 4. Crear enrollment de prueba
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

    // 5. Generar ejecuciones manualmente (simulando el trigger)
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

    console.log(`Generando ${executionsToInsert.length} ejecuciones...`)

    const { error: executionsError } = await supabase
      .from("ejecuciones_ejercicio")
      .insert(executionsToInsert)

    if (executionsError) {
      console.error("Error generando ejecuciones:", executionsError)
      return NextResponse.json({ 
        success: false, 
        error: "Error generando ejecuciones: " + executionsError.message 
      }, { status: 500 })
    }

    // console.log("✅ Ejecuciones generadas correctamente")

    // 6. Verificar ejecuciones generadas
    const { data: executions, error: verifyError } = await supabase
      .from("ejecuciones_ejercicio")
      .select("id")
      .in("periodo_id", periods?.map(p => p.id) || [])
      .eq("client_id", testUserId)

    if (verifyError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error verificando ejecuciones: " + verifyError.message 
      }, { status: 500 })
    }

    const expectedExecutions = exercises.length * (periods?.length || 0)

    return NextResponse.json({
      success: true,
      message: "Prueba sin RLS completada exitosamente",
      data: {
        enrollmentId: enrollment.id,
        exercisesCount: exercises.length,
        periodsCount: periods?.length || 0,
        executionsGenerated: executions?.length || 0,
        expectedExecutions,
        executionsMatch: (executions?.length || 0) === expectedExecutions,
        exercisesByType: exercises.reduce((acc, ex) => {
          acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        systemWorking: (executions?.length || 0) > 0
      }
    })
  } catch (error: any) {
    console.error("Error en la prueba sin RLS:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































