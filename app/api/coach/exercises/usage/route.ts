import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')
    const category = searchParams.get('category') || 'fitness' // 'fitness' | 'nutricion'

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId es requerido' }, { status: 400 })
    }

    const exerciseIdNum = parseInt(exerciseId, 10)
    if (isNaN(exerciseIdNum)) {
      return NextResponse.json({ error: 'exerciseId inválido' }, { status: 400 })
    }

    const isNutrition = category === 'nutricion' || category === 'nutrition'

    console.log(`📥 COACH/EXERCISES/USAGE: Obteniendo uso de ${category} ${exerciseIdNum} del coach ${user.id}`)

    // Primero obtener todas las actividades del coach (con título para evitar segunda query)
    const { data: coachActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title')
      .eq('coach_id', user.id)

    if (activitiesError) {
      console.error(`❌ COACH/EXERCISES/USAGE: Error obteniendo actividades del coach:`, activitiesError)
      return NextResponse.json({ error: activitiesError.message }, { status: 500 })
    }

    const activityIds = (coachActivities || []).map((a: any) => a.id)
    const coachActivityMap: Record<number, string> = {}
    coachActivities?.forEach((a: any) => {
      coachActivityMap[a.id] = a.title || `Actividad ${a.id}`
    })

    if (activityIds.length === 0) {
      return NextResponse.json({
        success: true,
        exerciseId: exerciseIdNum,
        activitiesCount: 0,
        activities: [],
        usageDetails: []
      })
    }

    // Buscar en planificacion_ejercicios dónde se usa este ejercicio/plato
    let planificacion: any[] = []
    let planError: any = null
    
    try {
      const result = await supabase
        .from('planificacion_ejercicios')
        .select('activity_id, numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
        .in('activity_id', activityIds)
      
      planificacion = result.data || []
      planError = result.error
      
      if (planError) {
        console.error(`❌ COACH/EXERCISES/USAGE: Error obteniendo planificación:`, planError)
        // No fallar completamente, continuar con array vacío
        planificacion = []
      }
    } catch (err: any) {
      console.error(`❌ COACH/EXERCISES/USAGE: Excepción obteniendo planificación:`, err)
      planificacion = []
    }

    // Extraer actividades que usan este ejercicio/plato
    const activitiesUsing: number[] = []
    const usageDetails: Array<{ activityId: number; week: number; days: string[] }> = []

    if (planificacion && Array.isArray(planificacion) && planificacion.length > 0) {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      
      planificacion.forEach((semana: any) => {
        const activityId = semana.activity_id
        const weekNum = semana.numero_semana
        const daysUsed: string[] = []

        dias.forEach((dia: string) => {
          const diaData = semana[dia]
          if (diaData && typeof diaData === 'object') {
            let ejercicios: any[] = []
            if (Array.isArray(diaData)) {
              ejercicios = diaData
            } else if (Array.isArray(diaData.ejercicios)) {
              ejercicios = diaData.ejercicios
            } else if (Array.isArray(diaData.exercises)) {
              ejercicios = diaData.exercises
            }

            // Verificar si este ejercicio/plato está en los ejercicios del día
            const isUsed = ejercicios.some((ej: any) => {
              const ejId = typeof ej.id === 'number' ? ej.id : parseInt(String(ej.id), 10)
              return !isNaN(ejId) && ejId === exerciseIdNum
            })

            if (isUsed) {
              daysUsed.push(dia)
            }
          }
        })

        if (daysUsed.length > 0) {
          if (!activitiesUsing.includes(activityId)) {
            activitiesUsing.push(activityId)
          }
          usageDetails.push({
            activityId,
            week: weekNum,
            days: daysUsed
          })
        }
      })
    }

    // Obtener estado activo desde activity_id_new o activity_id en la tabla de ejercicios/platos
    const activityStatus: Record<number, boolean> = {}
    
    // Usar el mapa de actividades ya obtenido
    const activityNames: Record<number, string> = coachActivityMap
    
    if (activitiesUsing.length > 0) {
      
      // Obtener estado activo desde activity_id_new o activity_id en la tabla de ejercicios/platos
      const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'
      
      let exerciseData: any = null
      let exerciseError: any = null
      
      // Para fitness, intentar primero sin coach_id ya que puede ser NULL o no existir
      // Para nutrición, intentar primero con coach_id
      try {
        if (isNutrition) {
          // Para nutrición, intentar con coach_id primero
          const { data: data1, error: error1 } = await supabase
            .from(tableName)
            .select('activity_id, activity_id_new, is_active')
            .eq('id', exerciseIdNum)
            .eq('coach_id', user.id)
            .maybeSingle()
          
          if (error1) {
            // Si hay error (ej: columna no existe), intentar sin coach_id
            console.warn(`⚠️ COACH/EXERCISES/USAGE: Error con coach_id para nutrición, intentando sin filtro:`, error1.message)
            const { data: data2, error: error2 } = await supabase
              .from(tableName)
              .select('activity_id, activity_id_new, is_active')
              .eq('id', exerciseIdNum)
              .maybeSingle()
            
            if (error2) {
              // Si el error es "no encontrado", continuar sin datos del ejercicio
              if (error2.code === 'PGRST116' || error2.message?.includes('No rows') || error2.message?.includes('not found')) {
                console.warn(`⚠️ COACH/EXERCISES/USAGE: Ejercicio ${exerciseIdNum} no encontrado (sin filtro coach_id)`)
                exerciseError = null // No es un error crítico
              } else {
                exerciseError = error2
              }
            } else if (data2) {
              exerciseData = data2
            }
          } else if (data1) {
            exerciseData = data1
          }
        } else {
          // Para fitness, intentar primero sin coach_id (puede ser NULL o no existir)
          const { data: data1, error: error1 } = await supabase
            .from(tableName)
            .select('activity_id')
            .eq('id', exerciseIdNum)
            .maybeSingle()
          
          if (error1) {
            // Si el error es "no encontrado" o similar, continuar sin datos del ejercicio
            if (error1.code === 'PGRST116' || error1.message?.includes('No rows') || error1.message?.includes('not found')) {
              console.warn(`⚠️ COACH/EXERCISES/USAGE: Ejercicio ${exerciseIdNum} no encontrado`)
              exerciseError = null // No es un error crítico
            } else {
              exerciseError = error1
              console.error(`❌ COACH/EXERCISES/USAGE: Error obteniendo ejercicio ${exerciseIdNum}:`, error1)
            }
          } else if (data1) {
            // Verificar ownership: verificar que alguna actividad en activity_id pertenezca al coach
            if (data1.activity_id && typeof data1.activity_id === 'object' && !Array.isArray(data1.activity_id)) {
              const exerciseActivityIds = Object.keys(data1.activity_id)
                .map(k => parseInt(k, 10))
                .filter(id => !isNaN(id) && activityIds.includes(id))
              
              if (exerciseActivityIds.length > 0) {
                exerciseData = data1
              } else {
                exerciseError = { message: 'Ejercicio no pertenece al coach' }
                console.warn(`⚠️ COACH/EXERCISES/USAGE: Ejercicio ${exerciseIdNum} no pertenece al coach`)
              }
            } else if (!data1.activity_id || (typeof data1.activity_id === 'object' && Object.keys(data1.activity_id).length === 0)) {
              // Si activity_id está vacío o es null, el ejercicio no está asociado a ninguna actividad
              exerciseError = { message: 'Ejercicio no tiene actividades asociadas' }
            } else {
              exerciseData = data1
            }
          }
        }
      } catch (err: any) {
        exerciseError = err
        console.error(`❌ COACH/EXERCISES/USAGE: Excepción obteniendo ejercicio ${exerciseIdNum}:`, err)
        // Continuar sin datos del ejercicio, no es crítico
      }
      
      // Manejar el caso donde el ejercicio no existe o no se puede obtener
      if (!exerciseError && exerciseData) {
        // Para nutrición, priorizar activity_id_new (JSONB), luego activity_id (integer), y finalmente is_active
        // Para fitness, usar activity_id (JSONB)
        const activityIdData = isNutrition 
          ? (exerciseData.activity_id_new || exerciseData.activity_id)
          : exerciseData.activity_id
        
        if (activityIdData) {
          if (typeof activityIdData === 'object' && !Array.isArray(activityIdData)) {
            // Es JSONB: {"93": {"activo": true}, "94": {"activo": false}}
            Object.keys(activityIdData).forEach((key) => {
              const activityIdNum = parseInt(key, 10)
              if (!isNaN(activityIdNum) && activitiesUsing.includes(activityIdNum)) {
                const activityData = activityIdData[key]
                activityStatus[activityIdNum] = activityData?.activo !== false
              }
            })
          } else if (typeof activityIdData === 'number') {
            // Es integer: solo un ID, usar is_active si está disponible, sino asumir activo
            if (activitiesUsing.includes(activityIdData)) {
              activityStatus[activityIdData] = isNutrition 
                ? (exerciseData.is_active !== false)
                : true
            }
          }
        } else if (isNutrition && exerciseData.is_active !== undefined) {
          // Si no hay activity_id_new ni activity_id, usar is_active general para todas las actividades
          activitiesUsing.forEach(actId => {
            activityStatus[actId] = exerciseData.is_active !== false
          })
        }
      } else if (exerciseError) {
        console.warn(`⚠️ COACH/EXERCISES/USAGE: Error obteniendo ejercicio ${exerciseIdNum}:`, exerciseError.message || exerciseError)
        // No fallar completamente, solo no tendremos el estado activo
      }
    }

    console.log(`✅ COACH/EXERCISES/USAGE: ${exerciseIdNum} usado en ${activitiesUsing.length} actividades`)

    return NextResponse.json({
      success: true,
      exerciseId: exerciseIdNum,
      activitiesCount: activitiesUsing.length,
      activities: activitiesUsing.map(id => ({
        id,
        name: activityNames[id] || `Actividad ${id}`,
        activo: activityStatus[id] !== false // Default a true si no está definido
      })),
      usageDetails
    })
  } catch (error: any) {
    console.error('❌ COACH/EXERCISES/USAGE: Error:', error)
    
    // Intentar extraer exerciseId de manera segura
    let exerciseIdNum: number | null = null
    try {
      if (request?.url) {
        const { searchParams } = new URL(request.url)
        const exerciseId = searchParams.get('exerciseId')
        exerciseIdNum = exerciseId ? parseInt(exerciseId, 10) : null
        if (isNaN(exerciseIdNum as number)) {
          exerciseIdNum = null
        }
      }
    } catch (parseError) {
      // Si falla el parse, continuar sin exerciseId
      console.warn('⚠️ COACH/EXERCISES/USAGE: No se pudo extraer exerciseId del error')
    }
    
    // Si es un error de validación, retornar error 400
    if (error.message?.includes('exerciseId') || error.message?.includes('requerido')) {
      return NextResponse.json({ error: error.message || 'Error de validación' }, { status: 400 })
    }
    
    // Para otros errores, intentar retornar una respuesta válida pero vacía si tenemos el exerciseId
    if (exerciseIdNum !== null) {
      console.warn(`⚠️ COACH/EXERCISES/USAGE: Retornando respuesta vacía debido a error para ejercicio ${exerciseIdNum}`)
      return NextResponse.json({
        success: true,
        exerciseId: exerciseIdNum,
        activitiesCount: 0,
        activities: [],
        usageDetails: []
      })
    }
    
    // Si no tenemos exerciseId, retornar error genérico
    return NextResponse.json({ 
      error: error.message || 'Error interno',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

