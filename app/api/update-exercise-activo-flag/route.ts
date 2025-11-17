import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import {
  hasActivity,
  setActiveFlagForActivity
} from '@/lib/utils/exercise-activity-map'

export async function POST(request: NextRequest) {
  try {
    const { activityId, exerciseId, activo } = await request.json()

    if (!activityId || !exerciseId || typeof activo !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'activityId, exerciseId y activo (boolean) son requeridos'
        },
        { status: 400 }
      )
    }

    console.log('🔄 Actualizando flag activo:', { activityId, exerciseId, activo })

    const supabase = await createRouteHandlerClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado'
        },
        { status: 401 }
      )
    }

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, coach_id')
      .eq('id', activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Actividad no encontrada'
        },
        { status: 404 }
      )
    }

    if (activity.coach_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permiso para modificar esta actividad'
        },
        { status: 403 }
      )
    }

    const { data: exercise, error: exerciseError } = await supabase
      .from('ejercicios_detalles')
      .select('id, activity_id')
      .eq('id', exerciseId)
      .single()

    if (exerciseError || !exercise) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ejercicio no encontrado'
        },
        { status: 404 }
      )
    }

    const exerciseHasActivity = hasActivity(exercise.activity_id, activityId)

    if (!exerciseHasActivity && !activo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ejercicio no pertenece a esta actividad'
        },
        { status: 404 }
      )
    }

    const updatedActivityMap = setActiveFlagForActivity(
      exercise.activity_id,
      activityId,
      activo
    )

    if (!exerciseHasActivity) {
      console.log('➕ Añadiendo actividad al ejercicio durante reactivación:', {
        exerciseId,
        activityId,
        activo
      })
    }

    const { error: updateError } = await supabase
      .from('ejercicios_detalles')
      .update({
        activity_id: updatedActivityMap
      })
      .eq('id', exerciseId)

    if (updateError) {
      console.error('❌ Error actualizando flag activo:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al actualizar el flag activo',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    console.log(`✅ Flag activo actualizado para ejercicio ${exerciseId}: ${activo}`)

    return NextResponse.json({
      success: true,
      message: 'Flag activo actualizado exitosamente',
      exerciseId,
      activo
    })
  } catch (error: any) {
    console.error('❌ Error en update-exercise-activo-flag:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    )
  }
}
