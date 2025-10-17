import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { activityId, weeklySchedule, periods } = body

    if (!activityId || !weeklySchedule) {
      return NextResponse.json({ error: 'ID de actividad y planificación semanal son requeridos' }, { status: 400 })
    }

    console.log('💾 SAVE WEEKLY PLANNING: Guardando planificación para actividad:', activityId)
    console.log('📅 SAVE WEEKLY PLANNING: Semanas:', Object.keys(weeklySchedule).length)
    console.log('🔄 SAVE WEEKLY PLANNING: Períodos:', periods)

    // Eliminar planificación existente
    const { error: deleteError } = await supabase
      .from('planificacion_ejercicios')
      .delete()
      .eq('actividad_id', activityId)

    if (deleteError) {
      console.error('❌ SAVE WEEKLY PLANNING: Error eliminando planificación existente:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Preparar datos para inserción
    const planningData = []
    
    for (const [weekNumber, weekData] of Object.entries(weeklySchedule)) {
      const weekNum = parseInt(weekNumber)
      
      // Crear objeto con los días de la semana
      const weekPlanning = {
        actividad_id: activityId,
        numero_semana: weekNum,
        lunes: {},
        martes: {},
        miercoles: {},
        jueves: {},
        viernes: {},
        sabado: {},
        domingo: {}
      }

      // Procesar cada día de la semana
      for (const [dayNumber, dayExercises] of Object.entries(weekData)) {
        const dayNum = parseInt(dayNumber)
        
        if (dayExercises && Array.isArray(dayExercises) && dayExercises.length > 0) {
          // Convertir ejercicios a formato esperado por la base de datos
          const exercisesData = dayExercises.map((exercise: any) => ({
            id: exercise.id,
            name: exercise.name,
            type: exercise.type,
            description: exercise.description,
            calories: exercise.calories,
            intensity: exercise.intensity,
            video_url: exercise.video_url,
            equipment: exercise.equipment,
            body_parts: exercise.body_parts
          }))

          // Asignar a la columna correspondiente del día
          switch (dayNum) {
            case 1: weekPlanning.lunes = { ejercicios: exercisesData }; break
            case 2: weekPlanning.martes = { ejercicios: exercisesData }; break
            case 3: weekPlanning.miercoles = { ejercicios: exercisesData }; break
            case 4: weekPlanning.jueves = { ejercicios: exercisesData }; break
            case 5: weekPlanning.viernes = { ejercicios: exercisesData }; break
            case 6: weekPlanning.sabado = { ejercicios: exercisesData }; break
            case 7: weekPlanning.domingo = { ejercicios: exercisesData }; break
          }
        }
      }

      planningData.push(weekPlanning)
    }

    // Insertar planificación en la base de datos
    if (planningData.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('planificacion_ejercicios')
        .insert(planningData)
        .select()

      if (insertError) {
        console.error('❌ SAVE WEEKLY PLANNING: Error insertando planificación:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      console.log('✅ SAVE WEEKLY PLANNING: Planificación guardada exitosamente:', insertedData?.length, 'semanas')
    }

    return NextResponse.json({
      success: true,
      message: 'Planificación semanal guardada correctamente',
      weeksSaved: planningData.length,
      periods: periods || 1
    })

  } catch (error: any) {
    console.error('❌ SAVE WEEKLY PLANNING: Error general:', error)
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 })
  }
}
