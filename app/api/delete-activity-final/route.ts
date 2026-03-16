import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para eliminación de actividades con lógica de "Soft Delete"
 * 1. Si hay clientes activos, solo se marca como 'borrada: true' e 'is_active: false'.
 * 2. Si no hay clientes activos, se realiza una limpieza de tablas relacionadas.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'ID de actividad requerido' }, { status: 400 })
    }

    const supabaseRouteClient = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabaseRouteClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Verificar propiedad y estado actual
    const { data: activity, error: fetchError } = await supabaseService
      .from('activities')
      .select('id, coach_id, type')
      .eq('id', activityId)
      .single()

    if (fetchError || !activity) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 })
    }

    if (activity.coach_id !== user.id) {
      return NextResponse.json({ success: false, error: 'No tienes permiso para eliminar esta actividad' }, { status: 403 })
    }

    // 2. Verificar inscripciones activas
    const { count: activeCount, error: enrollError } = await supabaseService
      .from('activity_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .in('status', ['active', 'enrolled'])

    if (enrollError) {
      console.error('Error checking enrollments:', enrollError)
      return NextResponse.json({ success: false, error: 'Error al verificar inscripciones' }, { status: 500 })
    }

    if ((activeCount || 0) > 0) {
      // LOGICA SOFT DELETE: Hay clientes usándola
      console.log(`[SOFT DELETE] Actividad ${activityId} marcada como borrada. Clientes activos: ${activeCount}`)
      
      const { error: updateError } = await supabaseService
        .from('activities')
        .update({ 
          is_active: false, 
          borrada: true 
        })
        .eq('id', activityId)

      if (updateError) throw updateError

      return NextResponse.json({ 
        success: true, 
        message: 'Actividad ocultada. Se eliminará permanentemente cuando los clientes actuales finalicen.',
        softDeleted: true
      })
    } else {
      // LOGICA HARD DELETE / CLEANUP: No hay nadie usándola
      console.log(`[HARD DELETE] Limpiando actividad ${activityId}`)

      // 8.1 PRESERVAR ESTADÍSTICAS FINALIZADAS:
      // Antes de borrar la planificación, nos aseguramos de que 'activities' 
      // tenga los valores finales de items_totales, items_unicos y sesiones_dias_totales
      // para que el coach conserve el historial visual.
      
      const { data: currentActivity } = await supabaseService
        .from('activities')
        .select('items_totales, items_unicos, sesiones_dias_totales, semanas_totales, type, categoria')
        .eq('id', activityId)
        .single()

      // 8.2 Limpiar tablas de planificación
      await supabaseService.from('planificacion_ejercicios').delete().eq('actividad_id', activityId)
      await supabaseService.from('planificacion_platos').delete().eq('actividad_id', activityId)
      await supabaseService.from('periodos').delete().eq('actividad_id', activityId)
      await supabaseService.from('activity_media').delete().eq('activity_id', activityId)

      // Nota: No borramos de 'activities' ni de tablas de progreso para mantener historial.
      // Pero marcamos la limpieza como completada.
      // IMPORTANTE: Aseguramos que los valores capturados en currentActivity se mantengan (ya están denormalizados).
      const { error: finalUpdateError } = await supabaseService
        .from('activities')
        .update({ 
          is_active: false, 
          borrada: true,
          limpieza_completada: true,
          // Refuerzo de valores para el Archivo Muerto
          items_totales: currentActivity?.items_totales || 0,
          items_unicos: currentActivity?.items_unicos || 0,
          sesiones_dias_totales: currentActivity?.sesiones_dias_totales || 0,
          semanas_totales: currentActivity?.semanas_totales || 0
        })
        .eq('id', activityId)

      if (finalUpdateError) throw finalUpdateError

      return NextResponse.json({ 
        success: true, 
        message: 'Actividad eliminada y datos de planificación limpiados.',
        softDeleted: false
      })
    }

  } catch (error: any) {
    console.error('Error in delete-activity-final:', error)
    return NextResponse.json({ success: false, error: error.message || 'Error interno' }, { status: 500 })
  }
}
