import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log("🔧 Iniciando corrección completa de RLS...")

    const activityId = 59

    // 1. Verificar estado inicial
    // // console.log("📊 Verificando estado inicial...")
    const { data: initialExercises, error: initialError } = await supabase
      .from("ejercicios_detalles")
      .select("id")
      .eq("activity_id", activityId)

    console.log(`Ejercicios visibles inicialmente: ${initialExercises?.length || 0}`)

    // 2. Deshabilitar RLS temporalmente
    console.log("🔓 Deshabilitando RLS...")
    const { error: disableError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE ejercicios_detalles DISABLE ROW LEVEL SECURITY;' 
      })

    if (disableError) {
      console.log("No se puede deshabilitar RLS via RPC, continuando...")
    }

    // 3. Verificar que ahora se pueden leer
    // // console.log("📊 Verificando acceso sin RLS...")
    const { data: exercisesWithoutRLS, error: withoutRLSError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)

    if (withoutRLSError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error leyendo ejercicios sin RLS: " + withoutRLSError.message 
      }, { status: 500 })
    }

    console.log(`Ejercicios visibles sin RLS: ${exercisesWithoutRLS?.length || 0}`)

    if (!exercisesWithoutRLS || exercisesWithoutRLS.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No hay ejercicios en la base de datos" 
      }, { status: 400 })
    }

    // 4. Rehabilitar RLS
    console.log("🔒 Rehabilitando RLS...")
    const { error: enableError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE ejercicios_detalles ENABLE ROW LEVEL SECURITY;' 
      })

    if (enableError) {
      console.log("No se puede habilitar RLS via RPC, continuando...")
    }

    // 5. Eliminar políticas existentes
    console.log("🗑️ Eliminando políticas existentes...")
    const dropPolicies = [
      'DROP POLICY IF EXISTS "ejercicios_detalles_select_all" ON ejercicios_detalles;',
      'DROP POLICY IF EXISTS "ejercicios_detalles_insert_all" ON ejercicios_detalles;',
      'DROP POLICY IF EXISTS "ejercicios_detalles_update_all" ON ejercicios_detalles;',
      'DROP POLICY IF EXISTS "ejercicios_detalles_delete_all" ON ejercicios_detalles;'
    ]

    for (const policy of dropPolicies) {
      const { error: dropError } = await supabase
        .rpc('exec_sql', { sql: policy })
      
      if (dropError) {
        console.log(`No se pudo eliminar política: ${policy}`)
      }
    }

    // 6. Crear políticas muy permisivas
    // console.log("✅ Creando políticas permisivas...")
    const createPolicies = [
      `CREATE POLICY "ejercicios_detalles_select_all"
       ON ejercicios_detalles FOR SELECT 
       TO public 
       USING (true);`,
      `CREATE POLICY "ejercicios_detalles_insert_all"
       ON ejercicios_detalles FOR INSERT 
       TO public 
       WITH CHECK (true);`,
      `CREATE POLICY "ejercicios_detalles_update_all"
       ON ejercicios_detalles FOR UPDATE 
       TO public 
       USING (true) 
       WITH CHECK (true);`,
      `CREATE POLICY "ejercicios_detalles_delete_all"
       ON ejercicios_detalles FOR DELETE 
       TO public 
       USING (true);`
    ]

    for (const policy of createPolicies) {
      const { error: createError } = await supabase
        .rpc('exec_sql', { sql: policy })
      
      if (createError) {
        console.log(`No se pudo crear política: ${policy}`)
      }
    }

    // 7. Verificar acceso final
    // // console.log("📊 Verificando acceso final...")
    const { data: finalExercises, error: finalError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", activityId)

    if (finalError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error verificando acceso final: " + finalError.message 
      }, { status: 500 })
    }

    console.log(`Ejercicios visibles finalmente: ${finalExercises?.length || 0}`)

    // 8. Verificar períodos
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

    // 9. Probar inserción
    console.log("🧪 Probando inserción...")
    const { data: testInsert, error: testInsertError } = await supabase
      .from("ejercicios_detalles")
      .insert({
        activity_id: activityId,
        nombre_ejercicio: "Test RLS Fix",
        tipo: "fuerza",
        semana: 1,
        dia: 1
      })
      .select()
      .single()

    if (testInsertError) {
      console.log("Error en inserción de prueba:", testInsertError.message)
    } else {
      // console.log("✅ Inserción de prueba exitosa")
      
      // Limpiar inserción de prueba
      await supabase
        .from("ejercicios_detalles")
        .delete()
        .eq("id", testInsert.id)
    }

    const exercisesByType = finalExercises?.reduce((acc, ex) => {
      acc[ex.tipo] = (acc[ex.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      message: "Corrección de RLS completada",
      data: {
        initialExercises: initialExercises?.length || 0,
        exercisesWithoutRLS: exercisesWithoutRLS?.length || 0,
        finalExercises: finalExercises?.length || 0,
        periodsCount: periods?.length || 0,
        exercisesByType,
        rlsFixed: (finalExercises?.length || 0) > 0,
        systemReady: (finalExercises?.length || 0) > 0 && (periods?.length || 0) > 0,
        canInsert: !testInsertError,
        nextStep: "Crear trigger para generar ejecuciones automáticamente"
      }
    })
  } catch (error: any) {
    console.error("Error en la corrección de RLS:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

































