import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getActiveFlagForActivity } from '@/lib/utils/exercise-activity-map'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { activityId, weeklySchedule, periods, blockNames } = body

    // Validar límite de semanas según plan
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener plan del coach
    const { data: plan } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const planType = (plan?.plan_type || 'free') as 'free' | 'basico' | 'black' | 'premium'
    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const weeksLimit = getPlanLimit(planType, 'weeksPerProduct')

    // Calcular semanas totales (número de semanas en weeklySchedule * períodos)
    const weeksCount = Object.keys(weeklySchedule).length * (periods || 1)

    if (weeksCount > weeksLimit) {
      return NextResponse.json({
        error: `El número de semanas (${weeksCount}) excede el límite de tu plan (${planType}: ${weeksLimit} semanas). Reduce el número de semanas o períodos.`
      }, { status: 400 })
    }

    if (!activityId || !weeklySchedule) {
      return NextResponse.json({ error: 'ID de actividad y planificación semanal son requeridos' }, { status: 400 })
    }

    console.log('💾 SAVE WEEKLY PLANNING: Guardando planificación para actividad:', activityId)
    console.log('📅 SAVE WEEKLY PLANNING: Semanas:', Object.keys(weeklySchedule).length)
    console.log('🔄 SAVE WEEKLY PLANNING: Períodos:', periods)
    console.log('🏷️ SAVE WEEKLY PLANNING: Nombres de bloques:', blockNames)
    console.log('🔍 ESTRUCTURA COMPLETA weeklySchedule:', JSON.stringify(weeklySchedule, null, 2))

    // Eliminar planificación existente
    const { error: deleteError } = await supabase
      .from('planificacion_ejercicios')
      .delete()
      .eq('actividad_id', activityId)

    if (deleteError) {
      console.error('❌ SAVE WEEKLY PLANNING: Error eliminando planificación existente:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Obtener todos los ejercicios de la actividad de una vez para consultar is_active
    // Esto se hace una sola vez antes de procesar las semanas para optimizar rendimiento
    const { data: activityData } = await supabase
      .from('activities')
      .select('categoria')
      .eq('id', activityId)
      .single()

    const isNutrition = activityData?.categoria === 'nutricion'
    const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'

    // Obtener todos los ejercicios de la actividad para crear un mapa de is_active
    let exerciseActiveMap = new Map<number, boolean>()

    if (tableName === 'ejercicios_detalles') {
      const { data, error } = await supabase
        .from('ejercicios_detalles')
        .select('id, activity_id')
        .contains('activity_id', { [activityId]: {} })

      if (!error && data) {
        exerciseActiveMap = new Map(
          data.map(ex => [
            ex.id,
            getActiveFlagForActivity(ex.activity_id, activityId, true)
          ])
        )
        console.log(`✅ Mapa de estado activo creado desde JSON: ${exerciseActiveMap.size} ejercicios`)
      } else {
        console.log('⚠️ No se pudo crear mapa de estado activo desde JSON, usando valores del frontend')
      }
    } else {
      // Para nutrición, buscar en activity_id_new (JSONB) o activity_id (integer)
      const activityKeyObj = { [activityId.toString()]: {} }
      // ✅ Intentar buscar en activity_id_new primero (JSONB)
      let { data, error } = await supabase
        .from(tableName)
        .select('id, activity_id, activity_id_new')
        .contains('activity_id_new', activityKeyObj)

      // Si no hay resultados en activity_id_new, buscar en activity_id (integer)
      if ((!data || data.length === 0) && !error) {
        const { data: dataInteger, error: errorInteger } = await supabase
          .from(tableName)
          .select('id, activity_id, activity_id_new')
          .eq('activity_id', activityId)

        if (!errorInteger && dataInteger) {
          data = dataInteger
        } else if (errorInteger) {
          error = errorInteger
        }
      }

      if (!error && data) {
        // Para nutrición, extraer el flag activo del JSONB activity_id_new o activity_id usando la función helper
        exerciseActiveMap = new Map(
          data.map((ex: any) => {
            // ✅ Usar activity_id_new si existe (JSONB), sino activity_id
            const activityIdData = ex.activity_id_new || ex.activity_id
            const isActive = isNutrition && activityIdData
              ? getActiveFlagForActivity(activityIdData, activityId, true)
              : true
            return [ex.id, isActive]
          })
        )
        console.log(`✅ Mapa de estado activo creado: ${exerciseActiveMap.size} registros de nutrición`)
      } else {
        console.log('⚠️ No se pudo crear mapa de estado activo, usando valores del frontend')
      }
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

      // Procesar cada día de la semana (las claves son días 1-7, no períodos)
      for (const [dayNumber, dayData] of Object.entries(weekData as Record<string, any>)) {
        const dayNum = parseInt(dayNumber)

        // Validar que sea un día válido (1-7)
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
          console.log('⚠️ DÍA INVÁLIDO IGNORADO:', dayNumber, 'debe ser 1-7')
          continue
        }

        console.log('🔍 PROCESANDO DÍA:', dayNumber, '->', dayNum)
        console.log('📊 DATOS DEL DÍA:', JSON.stringify(dayData, null, 2))

        // El día puede venir como array directo o como objeto {exercises: [], blockCount: N}
        let dayExercises: any[] = []
        if (Array.isArray(dayData)) {
          dayExercises = dayData
          console.log('✅ DÍA COMO ARRAY:', dayExercises.length, 'ejercicios')
        } else if (dayData && typeof dayData === 'object' && Array.isArray((dayData as any).ejercicios)) {
          dayExercises = (dayData as any).ejercicios
          console.log('✅ DÍA COMO OBJETO CON EJERCICIOS:', dayExercises.length, 'ejercicios')
        } else if (dayData && typeof dayData === 'object' && Array.isArray((dayData as any).exercises)) {
          dayExercises = (dayData as any).exercises
          console.log('✅ DÍA COMO OBJETO (exercises) CON EJERCICIOS:', dayExercises.length, 'ejercicios')
        } else {
          console.log('❌ FORMATO DE DÍA NO RECONOCIDO:', typeof dayData, dayData)
          continue
        }

        // Convertir ejercicios a formato esperado por la base de datos
        // Solo guardar ID, orden y bloque (numérico) - los detalles están en ejercicios_detalles
        const exercisesData = await Promise.all(dayExercises.map(async (exercise: any, index: number) => {
          console.log('🔍 EJERCICIO RECIBIDO:', JSON.stringify(exercise, null, 2))

          // Mapear IDs temporales a reales si es necesario
          let exerciseId = exercise.id

          // Si el ID es temporal (exercise-X o nutrition-X), buscar el ID real en la base de datos
          if (typeof exerciseId === 'string' && (exerciseId.startsWith('exercise-') || exerciseId.startsWith('nutrition-'))) {
            console.log('🔄 ID TEMPORAL DETECTADO:', exerciseId, 'buscando ID real...')

            // ✅ Intentar extraer el índice del ID temporal
            const tempIndexMatch = exerciseId.match(/(\d+)$/)
            const tempIndex = tempIndexMatch ? parseInt(tempIndexMatch[1], 10) : null

            // Buscar ejercicio por nombre en la base de datos
            const exerciseName = exercise.name || exercise['Nombre de la Actividad'] || exercise.nombre || exercise['Nombre']
            if (exerciseName) {
              try {
                // Determinar qué tabla usar según la categoría de actividad
                // Usar la variable isNutrition ya obtenida al inicio del endpoint
                const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'
                const nameField = isNutrition ? 'nombre' : 'nombre_ejercicio' // ✅ Campo correcto: 'nombre' no 'nombre_plato'

                console.log('🔍 Buscando en tabla:', tableName, 'campo:', nameField, 'para:', exerciseName)

                // Buscar ejercicio por nombre en la actividad actual
                // Para nutrición, buscar en activity_id_new (JSONB) o activity_id (integer)
                let realExercise: any = null
                let searchError: any = null

                if (isNutrition) {
                  // ✅ Intentar buscar en activity_id_new primero (JSONB)
                  const activityKeyObj = { [activityId.toString()]: {} }
                  const { data: dataNew, error: errorNew } = await supabase
                    .from(tableName)
                    .select('id')
                    .ilike(nameField, exerciseName)
                    .contains('activity_id_new', activityKeyObj)
                    .maybeSingle()

                  if (dataNew && !errorNew) {
                    realExercise = dataNew
                  } else {
                    // Si no se encuentra, buscar en activity_id (integer)
                    const { data: dataInteger, error: errorInteger } = await supabase
                      .from(tableName)
                      .select('id')
                      .ilike(nameField, exerciseName)
                      .eq('activity_id', activityId)
                      .maybeSingle()

                    if (dataInteger && !errorInteger) {
                      realExercise = dataInteger
                    } else if (errorInteger) {
                      searchError = errorInteger
                    }
                  }
                } else {
                  // Para fitness, buscar en activity_id JSONB
                  const activityKeyObj = { [activityId.toString()]: {} }
                  const { data: dataFitness, error: errorFitness } = await supabase
                    .from(tableName)
                    .select('id')
                    .ilike(nameField, exerciseName)
                    .contains('activity_id', activityKeyObj)
                    .maybeSingle()

                  realExercise = dataFitness
                  searchError = errorFitness
                }

                console.log('🔍 RESULTADO BÚSQUEDA:', { realExercise, searchError })

                if (realExercise && !searchError) {
                  exerciseId = realExercise.id
                  console.log('✅ ID REAL ENCONTRADO:', exerciseId, 'para plato/ejercicio:', exerciseName)
                } else {
                  // ✅ Si no se encuentra por nombre, intentar buscar por índice (orden de inserción)
                  if (tempIndex !== null && isNutrition) {
                    console.log(`🔍 Intentando buscar por índice temporal: ${tempIndex}`)
                    const activityKeyObj = { [activityId.toString()]: {} }
                    // ✅ Intentar buscar en activity_id_new primero (JSONB)
                    let { data: allExercises, error: listError } = await supabase
                      .from(tableName)
                      .select('id')
                      .contains('activity_id_new', activityKeyObj)
                      .order('created_at', { ascending: true })
                      .limit(100)

                    // Si no hay resultados, buscar en activity_id (integer)
                    if ((!allExercises || allExercises.length === 0) && !listError) {
                      const { data: dataInteger, error: errorInteger } = await supabase
                        .from(tableName)
                        .select('id')
                        .eq('activity_id', activityId)
                        .order('created_at', { ascending: true })
                        .limit(100)

                      if (!errorInteger && dataInteger) {
                        allExercises = dataInteger
                      } else if (errorInteger) {
                        listError = errorInteger
                      }
                    }

                    if (!listError && allExercises && allExercises.length > tempIndex) {
                      exerciseId = allExercises[tempIndex].id
                      console.log(`✅ ID REAL ENCONTRADO POR ÍNDICE: ${exerciseId} (índice ${tempIndex})`)
                    } else {
                      console.log('⚠️ NO SE ENCONTRÓ ID REAL para:', exerciseName, 'usando temporal:', exerciseId)
                      console.error('❌ NO SE PUEDE MAPEAR ID TEMPORAL A REAL:', exerciseName)
                    }
                  } else {
                    console.log('⚠️ NO SE ENCONTRÓ ID REAL para:', exerciseName, 'usando temporal:', exerciseId)
                    console.error('❌ NO SE PUEDE MAPEAR ID TEMPORAL A REAL:', exerciseName)
                  }
                }
              } catch (error) {
                console.log('❌ ERROR buscando ID real:', error, 'usando temporal:', exerciseId)
              }
            }
          }

          // Usar el orden del ejercicio si existe, sino usar la posición en el array
          const orden = exercise.orden || (index + 1)
          // El bloque DEBE ser numérico (1, 2, 3, 4...)
          const bloque = exercise.block || exercise.bloque || 1

          console.log('✅ Guardando - ID:', exerciseId, 'Orden:', orden, 'Bloque:', bloque)

          // Normalizar ID a número si es posible
          const exerciseIdNumber = typeof exerciseId === 'string'
            ? (exerciseId.includes('-') ? exerciseId : parseInt(exerciseId, 10))
            : exerciseId

          const mapKey = typeof exerciseIdNumber === 'number' && !Number.isNaN(exerciseIdNumber)
            ? exerciseIdNumber
            : (typeof exerciseId === 'number' ? exerciseId : null)

          // Obtener el valor de is_active desde el mapa (obtenido de la BD)
          let activo = true // Por defecto activo
          if (mapKey !== null && exerciseActiveMap.has(mapKey)) {
            console.log(`✅ Estado activo obtenido de mapa para ejercicio ${mapKey}: ${exerciseActiveMap.get(mapKey)}`)
          } else {
            console.log(`⚠️ Ejercicio ${exerciseId} (mapKey: ${mapKey}) no encontrado en mapa, se omitirá flag activo`)
          }

          return {
            id: mapKey ?? exerciseId,
            orden,
            bloque
          }
        }))

        const blockNamesForDay = (dayData as any)?.blockNames || blockNames || {}
        const blockCountValue = (() => {
          if (dayData && typeof dayData === 'object' && typeof (dayData as any).blockCount === 'number') {
            return Math.max(1, (dayData as any).blockCount)
          }
          if (dayExercises.length > 0) {
            return Math.max(1, Math.max(...dayExercises.map((ex: any) => ex.block || ex.bloque || 1)))
          }
          if (exercisesData.length > 0) {
            return Math.max(1, Math.max(...exercisesData.map((ex: any) => ex.bloque || 1)))
          }
          return 1
        })()

        const dayDataToSave = {
          ejercicios: exercisesData,
          blockNames: blockNamesForDay,
          blockCount: blockCountValue
        }

        const hasContent =
          exercisesData.length > 0 ||
          Object.keys(blockNamesForDay || {}).length > 0 ||
          blockCountValue > 1

        if (hasContent) {
          console.log('📅 APLICANDO DÍA AL DÍA ESPECÍFICO:', dayNum, 'ejercicios:', exercisesData.length)

          // Aplicar ejercicios al día correspondiente
          // Día 1 = Lunes, Día 2 = Martes, Día 3 = Miércoles, etc.
          switch (dayNum) {
            case 1: weekPlanning.lunes = dayDataToSave; break
            case 2: weekPlanning.martes = dayDataToSave; break
            case 3: weekPlanning.miercoles = dayDataToSave; break
            case 4: weekPlanning.jueves = dayDataToSave; break
            case 5: weekPlanning.viernes = dayDataToSave; break
            case 6: weekPlanning.sabado = dayDataToSave; break
            case 7: weekPlanning.domingo = dayDataToSave; break
            default:
              console.log('⚠️ DÍA NO RECONOCIDO:', dayNum, 'no se asignará a ningún día')
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

    // Guardar períodos en la tabla periodos
    if (periods && periods > 0) {
      // Eliminar períodos existentes
      const { error: deletePeriodsError } = await supabase
        .from('periodos')
        .delete()
        .eq('actividad_id', activityId)

      if (deletePeriodsError) {
        console.error('❌ SAVE WEEKLY PLANNING: Error eliminando períodos existentes:', deletePeriodsError)
      }

      // Insertar nuevo período
      const { error: periodsError } = await supabase
        .from('periodos')
        .insert({
          actividad_id: activityId,
          cantidad_periodos: periods
        })

      if (periodsError) {
        console.error('❌ SAVE WEEKLY PLANNING: Error insertando períodos:', periodsError)
        return NextResponse.json({ error: periodsError.message }, { status: 500 })
      }

      console.log('✅ SAVE WEEKLY PLANNING: Períodos guardados:', periods)
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




