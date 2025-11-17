import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/supabase-server'
import {
  hasActivity,
  removeActivity
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
    
    console.log('🗑️ Eliminando elementos de ejercicios:', { ids, activityId })
    
    const supabase = await createClient()
    // Asegurar sesión para cumplir RLS
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Desactivar elementos: NO eliminar; marcar is_active=false
    const { data: existingExercises, error: fetchError } = await supabase
      .from('ejercicios_detalles')
      .select('id, activity_id, coach_id')
      .in('id', ids)
    
    if (fetchError) {
      console.error('❌ Error obteniendo ejercicios a desactivar:', fetchError)
      return NextResponse.json({ error: 'Error buscando ejercicios' }, { status: 500 })
    }

    const validExercises = (existingExercises || []).filter(exercise => {
      const belongsToCoach = exercise.coach_id === user.id
      const assignedToActivity = hasActivity(exercise.activity_id, activityId)
      if (!belongsToCoach || !assignedToActivity) {
        console.warn('⚠️ Ejercicio ignorado por no pertenecer al coach o actividad objetivo', {
          exerciseId: exercise.id,
          belongsToCoach,
          assignedToActivity
        })
      }
      return belongsToCoach && assignedToActivity
    })

    const exercisesRemovedCompletely: string[] = []

    for (const exercise of validExercises) {
      const updatedMap = removeActivity(exercise.activity_id, activityId)
      const remainingKeys = Object.keys(updatedMap)

      if (remainingKeys.length === 0) {
        const { error: deleteExerciseError } = await supabase
          .from('ejercicios_detalles')
          .delete()
          .eq('id', exercise.id)

        if (deleteExerciseError) {
          console.error(`❌ Error eliminando ejercicio ${exercise.id}:`, deleteExerciseError)
          return NextResponse.json({ error: 'Error eliminando ejercicio' }, { status: 500 })
        }

        exercisesRemovedCompletely.push(String(exercise.id))
        console.log(`🗑️ Ejercicio ${exercise.id} eliminado completamente (sin más actividades asociadas)`)
      } else {
        const { error: updateError } = await supabase
          .from('ejercicios_detalles')
          .update({ activity_id: updatedMap })
          .eq('id', exercise.id)

        if (updateError) {
          console.error(`❌ Error actualizando mapa de actividades para ejercicio ${exercise.id}:`, updateError)
          return NextResponse.json({ error: 'Error actualizando ejercicio' }, { status: 500 })
        }

        console.log(`↩️ Ejercicio ${exercise.id} actualizado; aún asociado a ${remainingKeys.length} actividad(es)`)
      }
    }
    
    // ✅ QUITAR TAMBIÉN DE LA PLANIFICACIÓN SEMANAL (para nuevas compras)
    console.log('🔄 DELETE-EXERCISE-ITEMS - Quitando IDs desactivados de planificación semanal:', { ids })
    
    // Obtener todas las planificaciones para esta actividad
    const { data: planificaciones, error: planError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', activityId)
    
    if (planError) {
      console.error('❌ DELETE-EXERCISE-ITEMS - Error obteniendo planificaciones:', planError)
    } else if (planificaciones && planificaciones.length > 0) {
      console.log('🗑️ DELETE-EXERCISE-ITEMS - Planificaciones encontradas:', planificaciones.length)
      
      const idsSet = new Set(ids)

      // Actualizar cada planificación eliminando los IDs
      for (const plan of planificaciones) {
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        let updated = false
        let hasExercises = false
        
        for (const dia of dias) {
          const dayValue = plan[dia]

          if (!dayValue) {
            continue
          }

          const filterList = (list: any[]) =>
            list.filter((item: any) => {
              const itemId = typeof item === 'object' && item !== null ? item.id : item
              return !idsSet.has(itemId)
            })

          if (Array.isArray(dayValue)) {
            const originalLength = dayValue.length
            const filtered = filterList(dayValue)
            if (filtered.length !== originalLength) {
              plan[dia] = filtered
              updated = true
              console.log(`🔄 DELETE-EXERCISE-ITEMS - ${dia}: ${originalLength} -> ${filtered.length} ejercicios (formato array)`)
            }
            if (filtered.length > 0) {
              hasExercises = true
            }
            continue
          }

          if (typeof dayValue === 'object') {
            let dayUpdated = false
            let dayHasExercises = false

            if (Array.isArray(dayValue.ejercicios)) {
              const originalLength = dayValue.ejercicios.length
              const filtered = filterList(dayValue.ejercicios)
              if (filtered.length !== originalLength) {
                dayValue.ejercicios = filtered
                dayUpdated = true
                console.log(`🔄 DELETE-EXERCISE-ITEMS - ${dia}: ${originalLength} -> ${filtered.length} ejercicios`)
              }
              if (filtered.length > 0) {
                dayHasExercises = true
              }
            }

            if (Array.isArray(dayValue.exercises)) {
              const originalLength = dayValue.exercises.length
              const filtered = filterList(dayValue.exercises)
              if (filtered.length !== originalLength) {
                dayValue.exercises = filtered
                dayUpdated = true
                console.log(`🔄 DELETE-EXERCISE-ITEMS - ${dia}: ${originalLength} -> ${filtered.length} ejercicios (payload nuevo)`)
              }
              if (filtered.length > 0) {
                dayHasExercises = true
              }
            }

            if (!dayHasExercises) {
              if (Array.isArray(dayValue.ejercicios)) {
                dayValue.ejercicios = []
              }
              if (Array.isArray(dayValue.exercises)) {
                dayValue.exercises = []
              }
            }

            if (dayUpdated) {
              updated = true
            }

            if (dayHasExercises) {
              hasExercises = true
            }
          }
        }
        
        if (!hasExercises) {
          const { error: deletePlanError } = await supabase
            .from('planificacion_ejercicios')
            .delete()
            .eq('id', plan.id)

          if (deletePlanError) {
            console.error(`❌ DELETE-EXERCISE-ITEMS - Error eliminando planificación vacía ${plan.id}:`, deletePlanError)
          } else {
            console.log(`🗑️ DELETE-EXERCISE-ITEMS - Planificación ${plan.id} eliminada (semana sin ejercicios)`)
          }
        } else if (updated) {
          const { error: updateError } = await supabase
            .from('planificacion_ejercicios')
            .update(plan)
            .eq('id', plan.id)
          
          if (updateError) {
            console.error(`❌ DELETE-EXERCISE-ITEMS - Error actualizando planificación ${plan.id}:`, updateError)
          } else {
            console.log(`✅ DELETE-EXERCISE-ITEMS - Planificación ${plan.id} actualizada`)
          }
        }
      }
    }
    
    console.log('✅ Elementos de ejercicios desactivados exitosamente')
    
    return NextResponse.json({ 
      message: 'Elementos eliminados exitosamente',
      deletedCount: ids.length,
      removedFromDetalle: exercisesRemovedCompletely.length
    })
    
  } catch (error) {
    console.error('❌ Error en delete-exercise-items:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
