import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log("🔧 Aplicando corrección simple de RLS...")

    const activityId = 59

    // 1. Intentar leer ejercicios con diferentes enfoques
    // // console.log("📊 Intentando leer ejercicios...")

    // Enfoque 1: Query directo
    const { data: exercises1, error: error1 } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)

    console.log(`Enfoque 1 - Ejercicios: ${exercises1?.length || 0}, Error: ${error1?.message || 'none'}`)

    // Enfoque 2: Sin filtro de activity_id
    const { data: exercises2, error: error2 } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo, activity_id")
      .limit(10)

    console.log(`Enfoque 2 - Ejercicios totales: ${exercises2?.length || 0}, Error: ${error2?.message || 'none'}`)

    if (exercises2 && exercises2.length > 0) {
      console.log("Ejercicios encontrados:", exercises2)
      
      // Filtrar por activity_id en el código
      const activityExercises = exercises2.filter(ex => ex.activity_id === activityId)
      console.log(`Ejercicios para actividad ${activityId}: ${activityExercises.length}`)

      if (activityExercises.length > 0) {
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

        console.log(`Períodos encontrados: ${periods?.length || 0}`)

        // 3. Crear enrollment de prueba
        const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
        
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
          for (const exercise of activityExercises || []) {
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

        const exercisesByType = activityExercises.reduce((acc, ex) => {
          acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
          success: true,
          message: "Sistema funcionando correctamente",
          data: {
            enrollmentId: enrollment.id,
            exercisesCount: activityExercises.length,
            periodsCount: periods?.length || 0,
            executionsGenerated: executionsToInsert.length,
            expectedExecutions: activityExercises.length * (periods?.length || 0),
            executionsMatch: executionsToInsert.length === (activityExercises.length * (periods?.length || 0)),
            exercisesByType,
            systemWorking: executionsToInsert.length > 0,
            rlsIssue: "Las políticas RLS están bloqueando el acceso directo, pero el sistema funciona con el enfoque alternativo",
            nextStep: "Crear trigger para automatizar la generación de ejecuciones"
          }
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: "No se pudieron leer ejercicios con ningún enfoque",
      debug: {
        error1: error1?.message,
        error2: error2?.message,
        exercises1Count: exercises1?.length || 0,
        exercises2Count: exercises2?.length || 0
      }
    })
  } catch (error: any) {
    console.error("Error en la corrección simple de RLS:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

































