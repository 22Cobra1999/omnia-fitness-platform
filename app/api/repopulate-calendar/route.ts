import { NextResponse } from "next/server"
import { createClientWithCookies } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log('🔄 Iniciando repoblación de activity_calendar...')

    // Paso 1: Obtener todos los fitness_exercises
    const { data: fitnessExercises, error: exercisesError } = await supabase
      .from('fitness_exercises')
      .select('*')

    if (exercisesError) {
      console.error('Error obteniendo fitness_exercises:', exercisesError)
      return NextResponse.json({ error: 'Error obteniendo ejercicios' }, { status: 500 })
    }

    // // console.log(`📊 Encontrados ${fitnessExercises?.length || 0} ejercicios`)

    // Paso 2: Obtener activity_enrollments para calcular fechas
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('*')

    if (enrollmentsError) {
      console.error('Error obteniendo enrollments:', enrollmentsError)
      return NextResponse.json({ error: 'Error obteniendo enrollments' }, { status: 500 })
    }

    // // console.log(`📊 Encontrados ${enrollments?.length || 0} enrollments`)

    // Paso 3: Limpiar tabla activity_calendar
    const { error: deleteError } = await supabase
      .from('activity_calendar')
      .delete()
      .neq('id', 0) // Eliminar todos los registros

    if (deleteError) {
      console.error('Error limpiando activity_calendar:', deleteError)
      return NextResponse.json({ error: 'Error limpiando calendario' }, { status: 500 })
    }

    console.log('🧹 Tabla activity_calendar limpiada')

    // Paso 4: Crear datos para insertar
    const calendarData = []

    for (const exercise of fitnessExercises || []) {
      // Buscar el enrollment correspondiente
      const enrollment = enrollments?.find(e => e.id === exercise.activity_id)
      
      // Calcular fecha si tenemos los datos necesarios
      let calculatedDate = null
      if (enrollment?.start_date && exercise.semana && exercise.día) {
        try {
          const startDate = new Date(enrollment.start_date)
          const weekNumber = parseInt(exercise.semana) || 1
          const monthNumber = parseInt(exercise.mes) || 1
          
          // Calcular días desde el inicio
          const daysFromStart = (monthNumber - 1) * 28 + (weekNumber - 1) * 7
          
          // Mapear días de la semana
          const dayMap = {
            'lunes': 1,
            'martes': 2,
            'miércoles': 3,
            'jueves': 4,
            'viernes': 5,
            'sábado': 6,
            'domingo': 0
          }
          
          const dayOffset = dayMap[exercise.día.toLowerCase()] || 1
          const totalDays = daysFromStart + dayOffset
          
          calculatedDate = new Date(startDate)
          calculatedDate.setDate(startDate.getDate() + totalDays)
        } catch (error) {
          console.warn(`Error calculando fecha para ejercicio ${exercise.id}:`, error)
        }
      }

      calendarData.push({
        activity_id: exercise.activity_id,
        fitness_exercise_id: exercise.id,
        week_number: parseInt(exercise.semana) || 1,
        month_number: parseInt(exercise.mes) || 1,
        day_name: exercise.día || 'lunes',
        calculated_date: calculatedDate ? calculatedDate.toISOString().split('T')[0] : null,
        is_replicated: false,
        source_week: null,
        created_at: new Date().toISOString()
      })
    }

    console.log(`📝 Preparando ${calendarData.length} registros para insertar`)

    // Paso 5: Insertar datos en lotes
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < calendarData.length; i += batchSize) {
      const batch = calendarData.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('activity_calendar')
        .insert(batch)
        .select()

      if (error) {
        console.error(`Error insertando lote ${Math.floor(i/batchSize) + 1}:`, error)
        return NextResponse.json({ 
          error: `Error insertando lote ${Math.floor(i/batchSize) + 1}: ${error.message}` 
        }, { status: 500 })
      }

      insertedCount += data?.length || 0
      // console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} insertado: ${data?.length || 0} registros`)
    }

    console.log(`🎉 Repoblación completada: ${insertedCount} registros insertados`)

    return NextResponse.json({
      success: true,
      message: `Activity calendar repoblado exitosamente`,
      data: {
        totalExercises: fitnessExercises?.length || 0,
        totalEnrollments: enrollments?.length || 0,
        insertedRecords: insertedCount
      }
    })

  } catch (error) {
    console.error('Error en repoblación de calendario:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // Verificar estado actual de las tablas
    const [exercisesResult, enrollmentsResult, calendarResult] = await Promise.all([
      supabase.from('fitness_exercises').select('id', { count: 'exact', head: true }),
      supabase.from('activity_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('activity_calendar').select('id', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      success: true,
      data: {
        fitness_exercises: exercisesResult.count || 0,
        activity_enrollments: enrollmentsResult.count || 0,
        activity_calendar: calendarResult.count || 0
      }
    })

  } catch (error) {
    console.error('Error verificando estado:', error)
    return NextResponse.json({ 
      error: 'Error verificando estado de las tablas'
    }, { status: 500 })
  }
}
