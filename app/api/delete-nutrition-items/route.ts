import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/supabase-server'
import {
  hasActivity,
  normalizeActivityMap,
  setActiveFlagForActivity
} from '@/lib/utils/exercise-activity-map'

export async function DELETE(request: NextRequest) {
  try {
    const { ids, activityId } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 })
    }

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID requerido' }, { status: 400 })
    }

    console.log('🗑️ DELETE-NUTRITION-ITEMS - Solicitud recibida:', { ids, activityId })

    const supabase = await createClient()

    // Asegurar sesión para cumplir RLS
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Traer los platos a "desactivar" (no borrar)
    const { data: existingPlates, error: fetchError } = await supabase
      .from('nutrition_program_details')
      .select('id, activity_id, coach_id')
      .in('id', ids)
      .eq('coach_id', user.id)

    if (fetchError) {
      console.error('❌ DELETE-NUTRITION-ITEMS - Error obteniendo platos:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      })
      return NextResponse.json({ error: fetchError.message || 'Error buscando platos' }, { status: 500 })
    }

    const validPlates =
      existingPlates?.filter((plate) => {
        const belongsToCoach = plate.coach_id === user.id
        const assignedToActivity = hasActivity(plate.activity_id, activityId)

        if (!belongsToCoach || !assignedToActivity) {
          console.warn('⚠️ DELETE-NUTRITION-ITEMS - Plato ignorado', {
            plateId: plate.id,
            belongsToCoach,
            assignedToActivity
          })
        }

        return belongsToCoach && assignedToActivity
      }) ?? []

    console.log('🔍 DELETE-NUTRITION-ITEMS - Platos válidos a procesar:', validPlates.length)

    // Para cada plato:
    // - marcar en el JSONB activity_id la actividad como { activo: false }
    // NO borrar el registro; la limpieza dura (y banderas globales) se deja para un proceso separado.
    for (const plate of validPlates) {
      const currentMap = normalizeActivityMap(plate.activity_id)
      const beforeKeys = Object.keys(currentMap)

      if (beforeKeys.length === 0) {
        console.warn(
          '⚠️ DELETE-NUTRITION-ITEMS - Plato sin mapa de actividades, se omite actualización',
          { plateId: plate.id }
        )
        continue
      }

      const updatedMap = setActiveFlagForActivity(
        currentMap,
        activityId,
        false // marcar como inactivo para esta actividad
      )

      const { error: updateError } = await supabase
        .from('nutrition_program_details')
        .update({
          activity_id: updatedMap
        })
        .eq('id', plate.id)

      if (updateError) {
        console.error(
          `❌ DELETE-NUTRITION-ITEMS - Error actualizando plato ${plate.id}:`,
          updateError
        )
        return NextResponse.json(
          { error: 'Error actualizando platos de nutrición' },
          { status: 500 }
        )
      }

      console.log(
        `↩️ DELETE-NUTRITION-ITEMS - Plato ${plate.id} marcado inactivo para actividad ${activityId}`
      )
    }

    // Opcionalmente, podríamos aquí limpiar planificacion_ejercicios como en delete-exercise-items,
    // pero por ahora dejamos esa limpieza al flujo de guardado de planificación semanal.

    console.log('✅ DELETE-NUTRITION-ITEMS - Platos actualizados exitosamente')

    return NextResponse.json({
      message: 'Elementos de nutrición desactivados exitosamente',
      processedCount: validPlates.length
    })
  } catch (error) {
    console.error('❌ Error en delete-nutrition-items:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}