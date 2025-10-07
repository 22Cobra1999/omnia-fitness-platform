import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  console.log("🔧 AGREGANDO COLUMNA ACTIVITY_ENROLLMENT_ID A EJECUCIONES_EJERCICIO...")

  try {
    // 1. Intentar hacer una consulta simple para ver si la columna existe
    console.log("\n1️⃣ VERIFICANDO SI LA COLUMNA ACTIVITY_ENROLLMENT_ID EXISTE...")
    
    // Intentar hacer una consulta que incluya activity_enrollment_id
    const { data: testData, error: testError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id, activity_enrollment_id')
      .limit(1)

    const columnExists = !testError || !testError.message.includes('column "activity_enrollment_id" does not exist')
    console.log(`📋 Columna activity_enrollment_id existe: ${columnExists}`)

    if (!columnExists) {
      console.log("\n2️⃣ LA COLUMNA NO EXISTE - INSTRUCCIONES PARA AGREGARLA...")
      console.log("⚠️ Esto requiere permisos de administrador en Supabase")
      
      return NextResponse.json({
        success: false,
        message: "La columna activity_enrollment_id no existe y no se puede agregar automáticamente",
        instructions: [
          "1. Ir al panel de Supabase (supabase.com)",
          "2. Navegar a Table Editor > ejecuciones_ejercicio",
          "3. Click en 'Add Column'",
          "4. Nombre: activity_enrollment_id",
          "5. Tipo: INTEGER",
          "6. Permitir NULL: Sí (temporalmente)",
          "7. Foreign Key: activity_enrollments(id)",
          "8. Guardar cambios",
          "9. Ejecutar este endpoint nuevamente"
        ],
        error: testError?.message
      }, { status: 400 })
    }

    // 3. Obtener el enrollment activo
    console.log("\n3️⃣ OBTENIENDO ENROLLMENT ACTIVO...")
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .select('*')
      .eq('activity_id', 78)
      .eq('status', 'activa')
      .not('start_date', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (enrollmentError || !enrollment || enrollment.length === 0) {
      console.error('❌ Error obteniendo enrollment activo:', enrollmentError)
      return NextResponse.json({ 
        success: false, 
        error: "No se encontró enrollment activo", 
        details: enrollmentError 
      }, { status: 404 })
    }

    const activeEnrollment = enrollment[0]
    console.log(`✅ Enrollment activo encontrado: ID ${activeEnrollment.id}, Start Date: ${activeEnrollment.start_date}`)

    // 4. Actualizar todas las ejecuciones existentes con el activity_enrollment_id
    console.log("\n4️⃣ ACTUALIZANDO EJECUCIONES EXISTENTES...")
    
    // Primero obtener los IDs de ejercicios para esta actividad
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id')
      .eq('activity_id', 78)

    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError)
      return NextResponse.json({ 
        success: false, 
        error: "Error obteniendo ejercicios", 
        details: ejerciciosError 
      }, { status: 500 })
    }

    const ejercicioIds = ejercicios?.map(e => e.id) || []
    console.log(`📋 Ejercicios de la actividad 78:`, ejercicioIds)

    // Actualizar ejecuciones existentes
    const { error: updateError } = await supabase
      .from('ejecuciones_ejercicio')
      .update({ activity_enrollment_id: activeEnrollment.id })
      .eq('client_id', activeEnrollment.client_id)
      .in('ejercicio_id', ejercicioIds)
      .is('activity_enrollment_id', null)

    if (updateError) {
      console.error('❌ Error actualizando ejecuciones:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: "Error actualizando ejecuciones", 
        details: updateError 
      }, { status: 500 })
    }

    console.log('✅ Ejecuciones existentes actualizadas con activity_enrollment_id')

    // 5. Verificar resultado
    console.log("\n5️⃣ VERIFICANDO RESULTADO...")
    const { data: ejecucionesActualizadas, error: verifyError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        activity_enrollment_id,
        fecha_ejercicio,
        dia_semana,
        completado,
        ejercicios_detalles!inner(
          nombre_ejercicio,
          activity_id
        )
      `)
      .eq('client_id', activeEnrollment.client_id)
      .eq('ejercicios_detalles.activity_id', 78)

    if (verifyError) {
      console.error('❌ Error verificando resultado:', verifyError)
      return NextResponse.json({ 
        success: false, 
        error: "Error verificando resultado", 
        details: verifyError 
      }, { status: 500 })
    }

    console.log(`✅ Ejecuciones verificadas: ${ejecucionesActualizadas.length}`)
    
    // Agrupar por activity_enrollment_id
    const ejecucionesPorEnrollment = ejecucionesActualizadas.reduce((acc: any, ejecucion: any) => {
      const enrollmentId = ejecucion.activity_enrollment_id || 'NULL'
      if (!acc[enrollmentId]) {
        acc[enrollmentId] = []
      }
      acc[enrollmentId].push(ejecucion)
      return acc
    }, {})

    console.log('📊 Ejecuciones por enrollment:')
    Object.entries(ejecucionesPorEnrollment).forEach(([enrollmentId, ejecuciones]: [string, any]) => {
      console.log(`  Enrollment ID ${enrollmentId}: ${ejecuciones.length} ejecuciones`)
      const fechas = [...new Set(ejecuciones.map((e: any) => e.fecha_ejercicio))]
      console.log(`    Fechas: ${fechas.join(', ')}`)
    })

    // Verificar que todas tengan activity_enrollment_id
    const ejecucionesSinEnrollment = ejecucionesActualizadas.filter((e: any) => !e.activity_enrollment_id)
    if (ejecucionesSinEnrollment.length > 0) {
      console.log(`⚠️ ${ejecucionesSinEnrollment.length} ejecuciones sin activity_enrollment_id`)
    } else {
      console.log('✅ Todas las ejecuciones tienen activity_enrollment_id')
    }

    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE')

    return NextResponse.json({
      success: true,
      message: "Activity enrollment ID agregado exitosamente",
      results: {
        enrollmentId: activeEnrollment.id,
        totalEjecuciones: ejecucionesActualizadas.length,
        ejecucionesPorEnrollment,
        ejecucionesSinEnrollment: ejecucionesSinEnrollment.length
      }
    })

  } catch (error: any) {
    console.error("❌ Error inesperado:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Error inesperado", 
      details: error.message 
    }, { status: 500 })
  }
}
