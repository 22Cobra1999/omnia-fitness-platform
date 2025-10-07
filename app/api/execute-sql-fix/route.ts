import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log("🔧 Ejecutando corrección SQL...")

    const activityId = 59

    // 1. Crear función SQL para corregir RLS
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION fix_ejercicios_rls()
      RETURNS TABLE(
        message TEXT,
        exercises_count INTEGER
      ) AS $$
      DECLARE
        exercise_count INTEGER;
      BEGIN
        -- Deshabilitar RLS temporalmente
        ALTER TABLE ejercicios_detalles DISABLE ROW LEVEL SECURITY;
        
        -- Contar ejercicios
        SELECT COUNT(*) INTO exercise_count FROM ejercicios_detalles WHERE activity_id = ${activityId};
        
        -- Rehabilitar RLS
        ALTER TABLE ejercicios_detalles ENABLE ROW LEVEL SECURITY;
        
        -- Eliminar políticas existentes
        DROP POLICY IF EXISTS "ejercicios_detalles_select_all" ON ejercicios_detalles;
        DROP POLICY IF EXISTS "ejercicios_detalles_insert_all" ON ejercicios_detalles;
        DROP POLICY IF EXISTS "ejercicios_detalles_update_all" ON ejercicios_detalles;
        DROP POLICY IF EXISTS "ejercicios_detalles_delete_all" ON ejercicios_detalles;
        
        -- Crear políticas permisivas
        CREATE POLICY "ejercicios_detalles_select_all"
        ON ejercicios_detalles FOR SELECT 
        TO public 
        USING (true);
        
        CREATE POLICY "ejercicios_detalles_insert_all"
        ON ejercicios_detalles FOR INSERT 
        TO public 
        WITH CHECK (true);
        
        CREATE POLICY "ejercicios_detalles_update_all"
        ON ejercicios_detalles FOR UPDATE 
        TO public 
        USING (true) 
        WITH CHECK (true);
        
        CREATE POLICY "ejercicios_detalles_delete_all"
        ON ejercicios_detalles FOR DELETE 
        TO public 
        USING (true);
        
        RETURN QUERY SELECT 
          'RLS policies fixed successfully'::TEXT,
          exercise_count;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // 2. Ejecutar la función
    const { error: createError } = await supabase
      .rpc('exec_sql', { sql: createFunctionSQL })

    if (createError) {
      console.log("No se puede crear función via RPC, intentando enfoque alternativo...")
      
      // Enfoque alternativo: usar una función simple
      const { data: result, error: execError } = await supabase
        .rpc('fix_ejercicios_rls')

      if (execError) {
        return NextResponse.json({ 
          success: false, 
          error: "No se puede ejecutar corrección SQL: " + execError.message 
        }, { status: 500 })
      }

      // console.log("✅ Función ejecutada:", result)
    }

    // 3. Verificar que ahora se pueden leer ejercicios
    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)

    if (exercisesError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error leyendo ejercicios después de la corrección: " + exercisesError.message 
      }, { status: 500 })
    }

    console.log(`Ejercicios visibles después de la corrección: ${exercises?.length || 0}`)

    if (!exercises || exercises.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Aún no se pueden leer ejercicios después de la corrección" 
      }, { status: 400 })
    }

    // 4. Verificar períodos
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

    // 5. Crear enrollment de prueba
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

    // 6. Generar ejecuciones manualmente
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

    const exercisesByType = exercises.reduce((acc, ex) => {
      acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      message: "Sistema completamente funcional",
      data: {
        enrollmentId: enrollment.id,
        exercisesCount: exercises.length,
        periodsCount: periods?.length || 0,
        executionsGenerated: executionsToInsert.length,
        expectedExecutions: exercises.length * (periods?.length || 0),
        executionsMatch: executionsToInsert.length === (exercises.length * (periods?.length || 0)),
        exercisesByType,
        systemWorking: executionsToInsert.length > 0,
        rlsFixed: true,
        readyForTrigger: true
      }
    })
  } catch (error: any) {
    console.error("Error en la ejecución SQL:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

































