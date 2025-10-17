import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json({ error: 'ID de actividad es requerido' }, { status: 400 })
    }

    console.log('🗑️ DELETE ACTIVITY: Iniciando eliminación de actividad:', activityId)

    // 1. Primero eliminar datos relacionados (ejercicios/platos)
    console.log('🗑️ DELETE ACTIVITY: Eliminando ejercicios/platos relacionados...')
    
    // Eliminar ejercicios de la actividad
    const { error: deleteExercisesError } = await supabase
      .from('ejercicios_detalles')
      .delete()
      .eq('activity_id', parseInt(activityId))
      .eq('coach_id', user.id)

    if (deleteExercisesError) {
      console.error('❌ DELETE ACTIVITY: Error eliminando ejercicios:', deleteExercisesError)
    } else {
      console.log('✅ DELETE ACTIVITY: Ejercicios eliminados')
    }

    // Eliminar platos de la actividad
    const { error: deletePlatesError } = await supabase
      .from('nutrition_program_details')
      .delete()
      .eq('activity_id', parseInt(activityId))
      .eq('coach_id', user.id)
      .is('client_id', null)

    if (deletePlatesError) {
      console.error('❌ DELETE ACTIVITY: Error eliminando platos:', deletePlatesError)
    } else {
      console.log('✅ DELETE ACTIVITY: Platos eliminados')
    }

    // 2. Eliminar media asociada
    console.log('🗑️ DELETE ACTIVITY: Eliminando media asociada...')
    
    const { error: deleteMediaError } = await supabase
      .from('activity_media')
      .delete()
      .eq('activity_id', parseInt(activityId))
      .eq('coach_id', user.id)

    if (deleteMediaError) {
      console.error('❌ DELETE ACTIVITY: Error eliminando media:', deleteMediaError)
    } else {
      console.log('✅ DELETE ACTIVITY: Media eliminada')
    }

    // 3. Eliminar planificación semanal si existe
    console.log('🗑️ DELETE ACTIVITY: Eliminando planificación semanal...')
    
    const { error: deletePlanningError } = await supabase
      .from('planificacion_ejercicios')
      .delete()
      .eq('actividad_id', parseInt(activityId))

    if (deletePlanningError) {
      console.error('❌ DELETE ACTIVITY: Error eliminando planificación:', deletePlanningError)
    } else {
      console.log('✅ DELETE ACTIVITY: Planificación eliminada')
    }

    // 4. Finalmente eliminar la actividad principal
    console.log('🗑️ DELETE ACTIVITY: Eliminando actividad principal...')
    
    const { error: deleteActivityError } = await supabase
      .from('activities')
      .delete()
      .eq('id', parseInt(activityId))
      .eq('coach_id', user.id)

    if (deleteActivityError) {
      console.error('❌ DELETE ACTIVITY: Error eliminando actividad:', deleteActivityError)
      return NextResponse.json({ error: deleteActivityError.message }, { status: 500 })
    }

    console.log('✅ DELETE ACTIVITY: Actividad eliminada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Actividad y todos sus datos relacionados eliminados correctamente'
    })

  } catch (error: any) {
    console.error('❌ DELETE ACTIVITY: Error general:', error)
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 })
  }
}
