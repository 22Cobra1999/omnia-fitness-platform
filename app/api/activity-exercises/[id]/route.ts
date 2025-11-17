import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import {
  getActiveFlagForActivity,
  normalizeActivityMap
} from '@/lib/utils/exercise-activity-map'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await context.params

    const activityId = parseInt(id)

    if (!activityId || isNaN(activityId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de actividad inválido' 
      }, { status: 400 })
    }

    // Verificar que el usuario tenga acceso a esta actividad (sea el coach o esté inscrito)
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, coach_id, categoria')
      .eq('id', activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json({ 
        success: false, 
        error: 'Actividad no encontrada' 
      }, { status: 404 })
    }

    // Verificar acceso: el usuario debe ser el coach o estar inscrito
    const isCoach = activity.coach_id === user.id
    
    let hasAccess = isCoach
    
    if (!hasAccess) {
      // Verificar si el usuario está inscrito como cliente
      const { data: enrollment } = await supabase
        .from('activity_enrollments')
        .select('id')
        .eq('activity_id', activityId)
        .eq('client_id', user.id)
        .maybeSingle()
      
      hasAccess = !!enrollment
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        error: 'No tienes acceso a esta actividad' 
      }, { status: 403 })
    }

    // Obtener ejercicios de la actividad desde ejercicios_detalles
    const activityKey = id
    const activityKeyObj = { [activityKey]: {} }

    const { data: exercises, error: exercisesError } = await supabase
      .from('ejercicios_detalles')
      .select('*')
      .contains('activity_id', activityKeyObj)
      .order('id', { ascending: true })

    if (exercisesError) {
      console.error('Error obteniendo ejercicios:', exercisesError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener ejercicios',
        details: exercisesError.message 
      }, { status: 500 })
    }

    // Transformar los ejercicios al formato esperado por el frontend
    const transformedExercises = (exercises || []).map((exercise: any) => {
      const activityMap = normalizeActivityMap(exercise.activity_id)
      const primaryActivityIdKey = Object.keys(activityMap)[0]
      const primaryActivityId = primaryActivityIdKey ? parseInt(primaryActivityIdKey, 10) : null
      const isActive = getActiveFlagForActivity(activityMap, activityId, true)

      return {
        id: exercise.id,
        nombre_ejercicio: exercise.nombre_ejercicio,
        tipo: exercise.tipo,
        descripcion: exercise.descripcion,
        calorias: exercise.calorias,
        intensidad: exercise.intensidad,
        video_url: exercise.video_url,
        video_file_name: exercise.video_file_name || null,
        bunny_video_id: exercise.bunny_video_id || null,
        bunny_library_id: exercise.bunny_library_id || null,
        video_thumbnail_url: exercise.video_thumbnail_url || null,
        equipo: exercise.equipo,
        body_parts: exercise.body_parts,
        detalle_series: exercise.detalle_series,
        duracion_min: exercise.duracion_min,
        is_active: isActive,
        activo: isActive,
        activity_map: activityMap,
        activity_id: primaryActivityId,
        activity_assignments: activityMap
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedExercises
    })
  } catch (error: any) {
    console.error('Error en /api/activity-exercises/[id]:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

