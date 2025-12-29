import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import {
  getActiveFlagForActivity,
  normalizeActivityMap
} from '@/lib/utils/exercise-activity-map'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const rawParamId = typeof params?.id === 'string' ? params.id : ''
    const rawFromPath = request?.nextUrl?.pathname?.split('/').filter(Boolean).pop() || ''
    const rawId = (rawParamId || rawFromPath || '').toString()
    const normalizedIdStr = decodeURIComponent(rawId).trim()

    const activityId = Number(normalizedIdStr)

    if (!Number.isFinite(activityId) || activityId <= 0) {
      console.warn('⚠️ /api/activity-nutrition/[id] id inválido', {
        rawParamId,
        rawFromPath,
        normalizedIdStr
      })
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

    // Obtener platos de la actividad desde nutrition_program_details
    // Manejar múltiples formatos: JSONB, integer, y activity_id_new
    let platos: any[] = []
    let platosError: any = null
    
    console.log('🔍 Buscando platos para activityId:', activityId)
    
    // Estrategia 1: Intentar con JSONB usando .contains() (nuevo formato)
    try {
      const activityKeyObj = { [activityId.toString()]: {} }
      const { data: platosJsonb, error: errorJsonb } = await supabase
        .from('nutrition_program_details')
        .select('*, recetas(receta)')
        .contains('activity_id', activityKeyObj)
        .eq('coach_id', user.id)
        .order('id', { ascending: true })

      if (!errorJsonb && platosJsonb && platosJsonb.length > 0) {
        console.log('✅ Platos encontrados con formato JSONB:', platosJsonb.length)
        platos = platosJsonb
      } else if (errorJsonb) {
        console.log('⚠️ Error con JSONB, intentando otros formatos:', errorJsonb.message)
      }
    } catch (error: any) {
      console.log('⚠️ Excepción con JSONB, intentando otros formatos:', error.message)
    }
    
    // Estrategia 1.5: Buscar también en activity_id_new si activity_id es null o no es JSONB
    if (platos.length === 0) {
      try {
        console.log('⚠️ Intentando buscar en activity_id_new...')
        // Buscar todos los platos del coach y filtrar manualmente por activity_id_new
        const { data: allPlatosForNew, error: errorNew } = await supabase
          .from('nutrition_program_details')
          .select('*, recetas(receta)')
          .eq('coach_id', user.id)
          .order('id', { ascending: true })
        
        if (!errorNew && allPlatosForNew) {
          const platosFromNew = allPlatosForNew.filter((plato: any) => {
            // Si activity_id es null o no es objeto, verificar activity_id_new
            if (!plato.activity_id || typeof plato.activity_id !== 'object') {
              if (plato.activity_id_new) {
                try {
                  const activityMap = typeof plato.activity_id_new === 'string' 
                    ? JSON.parse(plato.activity_id_new)
                    : plato.activity_id_new
                  return activityId.toString() in activityMap
                } catch (e) {
                  return false
                }
              }
            }
            return false
          })
          
          if (platosFromNew.length > 0) {
            console.log('✅ Platos encontrados en activity_id_new:', platosFromNew.length)
            // Convertir activity_id_new a activity_id para consistencia
            platos = platosFromNew.map((plato: any) => {
              if (plato.activity_id_new && (!plato.activity_id || typeof plato.activity_id !== 'object')) {
                const activityMap = typeof plato.activity_id_new === 'string' 
                  ? JSON.parse(plato.activity_id_new)
                  : plato.activity_id_new
                return {
                  ...plato,
                  activity_id: activityMap
                }
              }
              return plato
            })
          }
        }
      } catch (error: any) {
        console.log('⚠️ Excepción buscando en activity_id_new:', error.message)
      }
    }
    
    // Estrategia 2: Si no hay resultados, intentar con integer (formato antiguo)
    if (platos.length === 0) {
      try {
        console.log('⚠️ Intentando con formato integer (legacy)...')
        const { data: platosInt, error: errorInt } = await supabase
          .from('nutrition_program_details')
          .select('*, recetas(receta)')
          .eq('activity_id', activityId)
          .eq('coach_id', user.id)
          .order('id', { ascending: true })
        
        if (!errorInt && platosInt) {
          console.log('✅ Platos encontrados con formato integer:', platosInt.length)
          platos = platosInt || []
          // Convertir formato antiguo a nuevo formato JSONB para la respuesta
          platos = platos.map((plato: any) => ({
            ...plato,
            activity_id: typeof plato.activity_id === 'number' 
              ? { [plato.activity_id.toString()]: { activo: plato.is_active !== false } }
              : plato.activity_id
          }))
        } else if (errorInt) {
          console.error('❌ Error obteniendo platos con formato integer:', errorInt)
          platosError = errorInt
        }
      } catch (error: any) {
        console.error('❌ Excepción obteniendo platos con formato integer:', error)
        platosError = error
      }
    }
    
    // Estrategia 3: Si aún no hay resultados, buscar todos los platos del coach y filtrar manualmente
    if (platos.length === 0) {
      try {
        console.log('⚠️ Intentando búsqueda amplia (todos los platos del coach)...')
        const { data: allPlatos, error: errorAll } = await supabase
          .from('nutrition_program_details')
          .select('*, recetas(receta)')
          .eq('coach_id', user.id)
          .order('id', { ascending: true })
        
        if (!errorAll && allPlatos) {
          console.log('📋 Total platos del coach:', allPlatos.length)
          
          // Filtrar manualmente los que pertenecen a esta actividad
          platos = allPlatos.filter((plato: any) => {
            // Verificar activity_id (puede ser integer, JSONB, o string)
            if (typeof plato.activity_id === 'number') {
              return plato.activity_id === activityId
            }
            
            // Verificar activity_id como JSONB
            if (plato.activity_id && typeof plato.activity_id === 'object') {
              return activityId.toString() in plato.activity_id
            }
            
            // Verificar activity_id_new si existe
            if (plato.activity_id_new) {
              try {
                const activityMap = typeof plato.activity_id_new === 'string' 
                  ? JSON.parse(plato.activity_id_new)
                  : plato.activity_id_new
                return activityId.toString() in activityMap
              } catch (e) {
                return false
              }
            }
            
            return false
          })
          
          // Convertir formato antiguo a nuevo formato JSONB para la respuesta
          platos = platos.map((plato: any) => {
            if (typeof plato.activity_id === 'number') {
              return {
                ...plato,
                activity_id: { [plato.activity_id.toString()]: { activo: plato.is_active !== false } }
              }
            }
            if (plato.activity_id_new && !plato.activity_id) {
              try {
                const activityMap = typeof plato.activity_id_new === 'string' 
                  ? JSON.parse(plato.activity_id_new)
                  : plato.activity_id_new
                return {
                  ...plato,
                  activity_id: activityMap
                }
              } catch (e) {
                return plato
              }
            }
            return plato
          })
          
          console.log('✅ Platos encontrados con búsqueda amplia:', platos.length)
        } else if (errorAll) {
          console.error('❌ Error obteniendo todos los platos:', errorAll)
        }
      } catch (error: any) {
        console.error('❌ Excepción en búsqueda amplia:', error)
      }
    }

    // Filtrar platos que estén asociados a esta actividad
    // NO filtrar por is_active aquí - dejamos que el frontend maneje la visualización
    // Solo asegurarnos de que el plato esté asociado a esta actividad
    if (platos.length > 0) {
      const activityKey = activityId.toString()
      platos = platos.filter((plato: any) => {
        const activityMap = normalizeActivityMap(plato.activity_id)
        
        // Verificar si el plato está asociado a esta actividad
        const isAssociated = activityKey in activityMap
        
        if (!isAssociated) {
          return false
        }
        
        // El plato está asociado, lo incluimos (el frontend decidirá si mostrarlo según is_active)
        return true
      })
      
      console.log('✅ Platos filtrados (asociados a actividad):', platos.length)
    }

    if (platosError && platos.length === 0) {
      console.error('❌ Error obteniendo platos (todos los formatos fallaron):', platosError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener platos',
        details: platosError.message 
      }, { status: 500 })
    }

    // Transformar los platos al formato esperado por el frontend
    const transformedPlatos = (platos || []).map((plato: any) => {
      const activityMap = normalizeActivityMap(plato.activity_id)
      const primaryActivityIdKey = Object.keys(activityMap)[0]
      const primaryActivityId = primaryActivityIdKey ? parseInt(primaryActivityIdKey, 10) : null
      const isActive = getActiveFlagForActivity(
        activityMap,
        activityId,
        plato.is_active !== false
      )

      return {
        id: plato.id,
        nombre_plato: plato.nombre_plato || plato.nombre || '', // Manejar ambos nombres de columna
        tipo: plato.tipo || 'otro',
        descripcion: plato.descripcion || '',
        calorias: plato.calorias || plato.calorías || 0,
        proteinas: plato.proteinas || 0,
        carbohidratos: plato.carbohidratos || 0,
        grasas: plato.grasas || 0,
        receta: plato.receta || '',
        video_url: plato.video_url || null,
        is_active: isActive,
        activo: isActive,
        activity_map: activityMap,
        activity_id: primaryActivityId,
        activity_assignments: activityMap
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedPlatos
    })
  } catch (error: any) {
    console.error('Error en /api/activity-nutrition/[id]:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

