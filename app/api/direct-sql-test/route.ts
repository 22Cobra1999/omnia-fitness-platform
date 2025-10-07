import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

    // console.log("🔍 Probando con SQL directo...")

    // 1. Usar SQL directo para verificar ejercicios
    const { data: exercises, error: exercisesError } = await supabase
      .rpc('get_exercises_for_activity', { activity_id: activityId })

    if (exercisesError) {
      console.log("RPC no disponible, intentando query directo...")
      
      // Query directo alternativo
      const { data: exercisesDirect, error: exercisesDirectError } = await supabase
        .from("ejercicios_detalles")
        .select("id, nombre_ejercicio, tipo")
        .eq("activity_id", activityId)

      if (exercisesDirectError) {
        return NextResponse.json({ 
          success: false, 
          error: "Error obteniendo ejercicios: " + exercisesDirectError.message 
        }, { status: 500 })
      }

      // // console.log(`📊 Ejercicios encontrados (directo): ${exercisesDirect?.length || 0}`)
      
      if (!exercisesDirect || exercisesDirect.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: "No hay ejercicios disponibles en la base de datos",
          debug: {
            activityId,
            queryUsed: "direct_select",
            error: exercisesDirectError
          }
        }, { status: 400 })
      }

      // Usar los ejercicios encontrados
      const exercisesToUse = exercisesDirect
      const exercisesCount = exercisesDirect.length

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

      // 4. Generar ejecuciones manualmente
      const executionsToInsert = []
      
      for (const period of periods || []) {
        for (const exercise of exercisesToUse || []) {
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

      const expectedExecutions = exercisesCount * (periods?.length || 0)

      return NextResponse.json({
        success: true,
        message: "Prueba con SQL directo exitosa",
        data: {
          enrollmentId: enrollment.id,
          exercisesCount: exercisesCount,
          periodsCount: periods?.length || 0,
          executionsGenerated: executionsToInsert.length,
          expectedExecutions,
          executionsMatch: executionsToInsert.length === expectedExecutions,
          exercisesByType: exercisesToUse.reduce((acc, ex) => {
            acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          systemWorking: executionsToInsert.length > 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "RPC funcionando",
      data: { exercises }
    })
  } catch (error: any) {
    console.error("Error en la prueba con SQL directo:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































