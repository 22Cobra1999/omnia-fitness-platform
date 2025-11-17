import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/supabase-server'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE-NUTRITION-ITEMS - Iniciando endpoint')
    
    const { ids, activityId } = await request.json()
    
    console.log('🗑️ DELETE-NUTRITION-ITEMS - Datos recibidos:', {
      ids: ids,
      idsType: typeof ids,
      idsIsArray: Array.isArray(ids),
      idsLength: ids?.length,
      activityId: activityId,
      activityIdType: typeof activityId
    })
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.error('❌ DELETE-NUTRITION-ITEMS - IDs inválidos:', { ids })
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 })
    }
    
    if (!activityId) {
      console.error('❌ DELETE-NUTRITION-ITEMS - Activity ID faltante:', { activityId })
      return NextResponse.json({ error: 'Activity ID requerido' }, { status: 400 })
    }
    
    console.log('🗑️ DELETE-NUTRITION-ITEMS - Eliminando elementos de nutrición:', { 
      ids, 
      activityId,
      idsCount: ids.length 
    })
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.log('🗑️ DELETE-NUTRITION-ITEMS - Cliente Supabase creado')
    
    // Desactivar elementos (no eliminar) de la tabla nutrition_program_details
    console.log('🗑️ DELETE-NUTRITION-ITEMS - Ejecutando query UPDATE (is_active=FALSE):', {
      table: 'nutrition_program_details',
      ids: ids,
      activityId: activityId
    })
    
    const { error } = await supabase
      .from('nutrition_program_details')
      .update({ is_active: false })
      .in('id', ids)
      .eq('activity_id', activityId)
      .eq('coach_id', user.id)
    
    console.log('🗑️ DELETE-NUTRITION-ITEMS - Query ejecutada, resultado:', {
      error: error,
      hasError: !!error
    })
    
    if (error) {
      console.error('❌ DELETE-NUTRITION-ITEMS - Error desactivando elementos de nutrición:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ error: 'Error desactivando elementos' }, { status: 500 })
    }
    
    // ✅ ELIMINAR TAMBIÉN DE LA PLANIFICACIÓN SEMANAL
    console.log('🗑️ DELETE-NUTRITION-ITEMS - Eliminando de planificación semanal:', { ids })
    
    // Obtener todas las planificaciones para esta actividad
    const { data: planificaciones, error: planError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', activityId)
    
    if (planError) {
      console.error('❌ DELETE-NUTRITION-ITEMS - Error obteniendo planificaciones:', planError)
    } else if (planificaciones && planificaciones.length > 0) {
      console.log('🗑️ DELETE-NUTRITION-ITEMS - Planificaciones encontradas:', planificaciones.length)
      
      // Actualizar cada planificación eliminando los IDs
      for (const plan of planificaciones) {
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        let updated = false
        
        for (const dia of dias) {
          if (plan[dia] && plan[dia].ejercicios && Array.isArray(plan[dia].ejercicios)) {
            const ejerciciosOriginales = plan[dia].ejercicios
            const ejerciciosFiltrados = ejerciciosOriginales.filter((id: number) => !ids.includes(id))
            
            if (ejerciciosFiltrados.length !== ejerciciosOriginales.length) {
              plan[dia].ejercicios = ejerciciosFiltrados
              updated = true
              console.log(`🗑️ DELETE-NUTRITION-ITEMS - ${dia}: ${ejerciciosOriginales.length} -> ${ejerciciosFiltrados.length} ejercicios`)
            }
          }
        }
        
        if (updated) {
          const { error: updateError } = await supabase
            .from('planificacion_ejercicios')
            .update(plan)
            .eq('id', plan.id)
          
          if (updateError) {
            console.error(`❌ DELETE-NUTRITION-ITEMS - Error actualizando planificación ${plan.id}:`, updateError)
          } else {
            console.log(`✅ DELETE-NUTRITION-ITEMS - Planificación ${plan.id} actualizada`)
          }
        }
      }
    }
    
    console.log('✅ DELETE-NUTRITION-ITEMS - Elementos de nutrición desactivados exitosamente')
    
    return NextResponse.json({ 
      message: 'Elementos desactivados exitosamente',
      deletedCount: ids.length 
    })
    
  } catch (error) {
    console.error('❌ DELETE-NUTRITION-ITEMS - Error en catch:', {
      error: error,
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}