import { NextRequest, NextResponse } from 'next/server'
import { createClientWithCookies } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // console.log('🔍 POST /api/populate-calendar - Iniciando...')
    
    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Error de autenticación:', authError?.message)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // console.log('🔍 Usuario autenticado:', user.email)
    
    // 1. Cambiar el tipo de la columna month_number a TEXT
    // console.log('🔍 Actualizando tipo de columna month_number...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE activity_calendar ALTER COLUMN month_number TYPE TEXT;'
    })
    
    if (alterError) {
      console.log('⚠️ Error actualizando columna (puede que ya sea TEXT):', alterError.message)
      // Continuar, puede que ya sea TEXT
    } else {
      // console.log('✅ Columna month_number actualizada a TEXT')
    }
    
    // 2. Eliminar datos existentes
    // console.log('🔍 Eliminando datos existentes...')
    const { error: deleteError } = await supabase
      .from('activity_calendar')
      .delete()
      .neq('id', 0) // Eliminar todo
    
    if (deleteError) {
      console.error('❌ Error eliminando datos existentes:', deleteError)
      return NextResponse.json({ error: 'Error eliminando datos existentes' }, { status: 500 })
    }
    
    // console.log('✅ Datos existentes eliminados')
    
    // 3. Obtener todos los fitness_exercises
    // console.log('🔍 Obteniendo fitness_exercises...')
    const { data: fitnessExercises, error: feError } = await supabase
      .from('fitness_exercises')
      .select('id, activity_id')
    
    if (feError) {
      console.error('❌ Error obteniendo fitness_exercises:', feError)
      return NextResponse.json({ error: 'Error obteniendo fitness_exercises' }, { status: 500 })
    }
    
    // console.log('🔍 Fitness exercises encontrados:', fitnessExercises?.length || 0)
    
    if (!fitnessExercises || fitnessExercises.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron fitness_exercises para poblar el calendario' 
      }, { status: 404 })
    }
    
    // 4. Preparar datos para insertar
    // Como las columnas semana, mes, día ya no existen, asignamos valores por defecto
    const calendarEntries = []
    
    // Agrupar ejercicios por actividad
    const exercisesByActivity = fitnessExercises.reduce((acc, fe) => {
      if (!acc[fe.activity_id]) {
        acc[fe.activity_id] = []
      }
      acc[fe.activity_id].push(fe)
      return acc
    }, {} as Record<number, any[]>)
    
    // Para cada actividad, asignar semanas y días
    Object.entries(exercisesByActivity).forEach(([activityId, exercises]) => {
      exercises.forEach((fe, index) => {
        // Asignar semanas de forma secuencial (1, 2, 3, 4) por actividad
        const weekNumber = (index % 4) + 1
        
        // Asignar días de la semana de forma rotativa
        const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
        const dayName = days[index % 7]
        
        calendarEntries.push({
          activity_id: parseInt(activityId),
          fitness_exercise_id: fe.id,
          week_number: weekNumber,
          month_number: '1', // Mes 1 por defecto
          day_name: dayName,
          calculated_date: null,
          is_replicated: false,
          source_week: null,
        })
      })
    })
    
    // console.log('🔍 Entradas a insertar:', calendarEntries.length)
    
    // 5. Insertar en lotes
    const batchSize = 1000
    let totalInserted = 0
    
    for (let i = 0; i < calendarEntries.length; i += batchSize) {
      const batch = calendarEntries.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('activity_calendar')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error insertando lote ${i / batchSize + 1}:`, insertError)
        return NextResponse.json({ 
          error: `Error insertando lote ${i / batchSize + 1}: ${insertError.message}` 
        }, { status: 500 })
      }
      
      totalInserted += batch.length
      // console.log(`✅ Lote ${i / batchSize + 1} insertado: ${batch.length} entradas`)
    }
    
    // console.log('✅ Población completada exitosamente')
    
    return NextResponse.json({ 
      success: true, 
      message: `Activity calendar poblado exitosamente con ${totalInserted} entradas`,
      total_entries: totalInserted,
      unique_activities: new Set(calendarEntries.map(e => e.activity_id)).size,
      unique_exercises: new Set(calendarEntries.map(e => e.fitness_exercise_id)).size
    })
    
  } catch (error) {
    console.error('❌ Error en populate-calendar:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
