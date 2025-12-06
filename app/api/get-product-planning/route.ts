import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import {
  getActiveFlagForActivity,
  normalizeActivityMap
} from '@/lib/utils/exercise-activity-map'

// GET - Obtener planificación de ejercicios de un producto
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    const { searchParams } = new URL(request.url)
    const actividad_id = searchParams.get('actividad_id')
    const actividadIdNumber = actividad_id ? parseInt(actividad_id, 10) : NaN

    if (!actividad_id || Number.isNaN(actividadIdNumber)) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id es requerido' 
      }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // 0. Obtener categoría del producto para determinar qué tabla usar
    const { data: actividadInfo, error: actividadError } = await supabase
      .from('activities')
      .select('categoria')
      .eq('id', actividadIdNumber)
      .single()

    if (actividadError) {
      console.error('Error obteniendo información de la actividad:', actividadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo información de la actividad' 
      }, { status: 500 })
    }

    const isNutrition = actividadInfo?.categoria === 'nutricion' || actividadInfo?.categoria === 'nutrition'
    const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'
    console.log(`📊 [get-product-planning] Producto ${actividadIdNumber}: categoría=${actividadInfo?.categoria}, tabla=${tableName}`)

    // 1. Obtener planificación de ejercicios
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', actividad_id)
      .order('numero_semana')

    if (planificacionError) {
      console.error('Error obteniendo planificación:', planificacionError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo planificación' 
      }, { status: 500 })
    }

    // 2. Obtener información de períodos
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('*')
      .eq('actividad_id', actividad_id)
      .single()

    if (periodosError && periodosError.code !== 'PGRST116') {
      console.error('Error obteniendo períodos:', periodosError)
    }

    // 3. Obtener ejercicios asociados para obtener nombres
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

    type ParsedDayData = {
      ejercicios: any[]
      blockNames: Record<number, string>
      blockCount: number
    }

    const extractDayData = (raw: any): ParsedDayData => {
      const result: ParsedDayData = {
        ejercicios: [],
        blockNames: {},
        blockCount: 1
      }

      if (!raw) {
        return result
      }

      const normalizeEntry = (entry: any, index: number) => {
        if (!entry || typeof entry !== 'object') return null
        const normalized = { ...entry }
        const candidateId =
          normalized.id ??
          normalized.ejercicioId ??
          normalized.exerciseId ??
          normalized.ejercicio_id ??
          normalized.exercise_id
        if (candidateId !== undefined && candidateId !== null) {
          const parsedId =
            typeof candidateId === 'string'
              ? parseInt(candidateId, 10)
              : candidateId
          if (!Number.isNaN(parsedId)) {
            normalized.id = parsedId
          }
        }
        if (normalized.block === undefined && normalized.bloque !== undefined) {
          normalized.block = normalized.bloque
        }
        if (normalized.bloque === undefined && normalized.block !== undefined) {
          normalized.bloque = normalized.block
        }
        if (normalized.orden === undefined && normalized.order !== undefined) {
          normalized.orden = normalized.order
        }
        if (normalized.orden === undefined || normalized.orden === null) {
          normalized.orden = index + 1
        }
        if (normalized.activo === undefined && typeof normalized.is_active === 'boolean') {
          normalized.activo = normalized.is_active
        }
        return normalized
      }

      const processList = (list: any[] | undefined | null) => {
        if (!Array.isArray(list)) return
        list.forEach((item, index) => {
          const normalized = normalizeEntry(item, index)
          if (normalized) {
            result.ejercicios.push(normalized)
          }
        })
      }

      const processParsedObject = (parsed: any) => {
        if (!parsed || typeof parsed !== 'object') return

        if (Array.isArray(parsed)) {
          processList(parsed)
          return
        }

        if (Array.isArray(parsed.ejercicios)) {
          processList(parsed.ejercicios)
          if (parsed.blockNames && typeof parsed.blockNames === 'object') {
            result.blockNames = parsed.blockNames
          }
          if (typeof parsed.blockCount === 'number' && parsed.blockCount > 0) {
            result.blockCount = parsed.blockCount
          }
          return
        }

        const ejerciciosColectados: any[] = []
        Object.keys(parsed).forEach((key) => {
          if (key === 'blockNames' || key === 'blockCount') return
          const maybeBlock = parsed[key]
          if (Array.isArray(maybeBlock)) {
            maybeBlock.forEach((item: any, index: number) => {
              const normalized = normalizeEntry(item, index)
              if (normalized) {
                normalized.block =
                  ((normalized.block ?? normalized.bloque ?? parseInt(key, 10)) || 1)
                normalized.bloque = normalized.block
                ejerciciosColectados.push(normalized)
              }
            })
          }
        })

        if (ejerciciosColectados.length > 0) {
          result.ejercicios.push(...ejerciciosColectados)
        }
        if (parsed.blockNames && typeof parsed.blockNames === 'object') {
          result.blockNames = parsed.blockNames
        }
        if (typeof parsed.blockCount === 'number' && parsed.blockCount > 0) {
          result.blockCount = parsed.blockCount
        }
      }

      if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return result
        try {
          const parsed = JSON.parse(trimmed)
          processParsedObject(parsed)
        } catch (jsonError) {
          const ids = trimmed
            .split(',')
            .map((id: string) => parseInt(id.trim(), 10))
            .filter((id: number) => !Number.isNaN(id))
          ids.forEach((id: number, index: number) => {
            result.ejercicios.push({
              id,
              bloque: 1,
              block: 1,
              orden: index + 1
            })
          })
        }
      } else if (Array.isArray(raw)) {
        processList(raw)
      } else if (typeof raw === 'object') {
        processParsedObject(raw)
      }

      if (result.ejercicios.length > 0) {
        const maxBlock = Math.max(
          1,
          ...result.ejercicios.map((item: any) => {
            const blockValue = item.block ?? item.bloque
            return typeof blockValue === 'number' && blockValue > 0
              ? blockValue
              : 1
          })
        )
        result.blockCount = maxBlock
      } else {
        result.blockCount = 1
      }

      return result
    }

    const parsedPlanByWeek: Record<string, Record<string, ParsedDayData>> = {}
    const exerciseIds = new Set<number>()

    if (planificacion && planificacion.length > 0) {
      planificacion.forEach((semana) => {
        const semanaKey = semana.numero_semana.toString()
        parsedPlanByWeek[semanaKey] = {}

        diasSemana.forEach((dia, index) => {
          const diaKey = (index + 1).toString()
          const parsedDay = extractDayData(semana[dia])

          if (parsedDay.ejercicios.length > 0) {
            parsedDay.ejercicios.forEach((ejercicio: any) => {
              const idValue = ejercicio.id
              if (typeof idValue === 'number' && !Number.isNaN(idValue)) {
                exerciseIds.add(idValue)
              }
            })
            parsedPlanByWeek[semanaKey][diaKey] = parsedDay
          }
        })
      })
    }

    const ejerciciosMap = new Map<string, any>()
    if (exerciseIds.size > 0) {
      // Consultar la tabla correcta según la categoría
      const camposSelect = isNutrition
        ? 'id, nombre_plato, tipo, descripcion, calorias, proteinas, carbohidratos, grasas, video_url, receta, is_active, activity_id'
        : 'id, nombre_ejercicio, tipo, descripcion, calorias, intensidad, video_url, equipo, body_parts, detalle_series, duracion_min, is_active, activity_id'
      
      const { data: ejercicios, error: ejerciciosError } = await supabase
        .from(tableName)
        .select(camposSelect)
        .in('id', Array.from(exerciseIds))

    if (ejerciciosError) {
        console.error('Error obteniendo ejercicios por IDs:', ejerciciosError)
      } else if (ejercicios) {
        console.log('[get-product-planning] ejercicios encontrados:', {
          idsSolicitados: Array.from(exerciseIds),
          count: ejercicios.length,
          primeros: ejercicios.slice(0, 5)
        })
        ejercicios.forEach((ejercicio) => {
        const activityMap = normalizeActivityMap(ejercicio.activity_id)
          const hasActivity = !!activityMap[String(actividadIdNumber)]
          
          if (!hasActivity) {
            console.warn('[get-product-planning] Ejercicio NO tiene activity_id correcto:', {
              ejercicioId: ejercicio.id,
              nombre_ejercicio: ejercicio.nombre_ejercicio,
              activity_id: ejercicio.activity_id,
              actividadIdBuscado: actividadIdNumber,
              activityMapKeys: Object.keys(activityMap),
              activityMap: activityMap
            })
            // NO hacer return, agregar igualmente al mapa para que tenga los datos
            // El filtro de activity_id es solo para el flag is_active
          }
          
        const isActive = hasActivity ? getActiveFlagForActivity(
          activityMap,
            actividadIdNumber,
          ejercicio.is_active !== false
        ) : true // Si no tiene el activity_id, asumir activo por defecto

          ejerciciosMap.set(String(ejercicio.id), {
          ...ejercicio,
          activity_map: activityMap,
          is_active: isActive
        })
      })
      
      console.log('[get-product-planning] ejerciciosMap construido:', {
        mapSize: ejerciciosMap.size,
        mapKeys: Array.from(ejerciciosMap.keys()),
        sampleEntries: Array.from(ejerciciosMap.entries()).slice(0, 3).map(([key, val]) => ({
          key,
          id: val.id,
          nombre_ejercicio: val.nombre_ejercicio,
          tipo: val.tipo,
          activity_id: val.activity_id
        }))
      })
      }
    }

    // 5. Procesar planificación y convertir a formato del frontend
    const weeklySchedule: { [weekNumber: string]: { [dayNumber: string]: any[] } } = {}
    let totalSessions = 0
    const uniqueExercises = new Set<string>()
    
    // Primero, identificar todos los ejercicios que no están en el mapa
    const ejerciciosFaltantes = new Set<number>()
    Object.entries(parsedPlanByWeek).forEach(([semanaKey, days]) => {
      Object.entries(days).forEach(([diaKey, dayData]) => {
        dayData.ejercicios.forEach((ejercicioData: any) => {
          const ejercicioIdStr = String(ejercicioData.id ?? '')
          const ejercicioIdNum = Number(ejercicioData.id)
          if (!ejerciciosMap.has(ejercicioIdStr) && !ejerciciosMap.has(String(ejercicioIdNum)) && ejercicioIdNum && !Number.isNaN(ejercicioIdNum)) {
            ejerciciosFaltantes.add(ejercicioIdNum)
          }
        })
      })
    })

    // Consultar todos los ejercicios faltantes de una vez
    if (ejerciciosFaltantes.size > 0) {
      const camposSelectFaltantes = isNutrition
        ? 'id, nombre_plato, tipo, descripcion, calorias, proteinas, carbohidratos, grasas, video_url, receta, is_active, activity_id'
        : 'id, nombre_ejercicio, tipo, descripcion, calorias, intensidad, video_url, equipo, body_parts, detalle_series, duracion_min, is_active, activity_id'
      
      const { data: ejerciciosFromDb, error: ejerciciosError } = await supabase
        .from(tableName)
        .select(camposSelectFaltantes)
        .in('id', Array.from(ejerciciosFaltantes))

      if (!ejerciciosError && ejerciciosFromDb) {
        ejerciciosFromDb.forEach((ejercicioFromDb) => {
          const activityMap = normalizeActivityMap(ejercicioFromDb.activity_id)
          const hasActivity = !!activityMap[String(actividadIdNumber)]
          const isActive = hasActivity ? getActiveFlagForActivity(
            activityMap,
            actividadIdNumber,
            ejercicioFromDb.is_active !== false
          ) : true
          
          const nombreItem = isNutrition ? ejercicioFromDb.nombre_plato : ejercicioFromDb.nombre_ejercicio
          const ejercicioInfo = {
            ...ejercicioFromDb,
            // Normalizar nombre para uso genérico
            nombre_ejercicio: nombreItem,
            nombre_plato: nombreItem,
            activity_map: activityMap,
            is_active: isActive
          }
          
          ejerciciosMap.set(String(ejercicioFromDb.id), ejercicioInfo)
        })
      }
    }

    // Ahora procesar la planificación con todos los ejercicios disponibles en el mapa
    Object.entries(parsedPlanByWeek).forEach(([semanaKey, days]) => {
      Object.entries(days).forEach(([diaKey, dayData]) => {
        const todosEjercicios: any[] = []
        dayData.ejercicios.forEach((ejercicioData: any, index: number) => {
          const ejercicioIdStr = String(ejercicioData.id ?? '')
          const ejercicioIdNum = Number(ejercicioData.id)
          let ejercicioInfo = ejerciciosMap.get(ejercicioIdStr) || ejerciciosMap.get(String(ejercicioIdNum))
          
          if (!ejercicioInfo) {
            console.warn('[get-product-planning] ⚠️ Ejercicio NO encontrado después de consultar BD', {
              ejercicioId: ejercicioData.id,
              ejercicioIdStr,
              ejercicioIdNum,
              semana: semanaKey,
              dia: diaKey
            })
          }
          
          const blockFromData =
            ejercicioData.block ?? ejercicioData.bloque ?? 1
          const ordenDesdeData =
            ejercicioData.orden ?? ejercicioData.order ?? index + 1
          const explicitActivo =
            typeof ejercicioData.activo === 'boolean'
              ? ejercicioData.activo
              : typeof ejercicioData.is_active === 'boolean'
                ? ejercicioData.is_active
                : undefined

          if (ejercicioInfo) {
            const detalleSeriesRaw = ejercicioInfo.detalle_series
            let seriesValue: string | null = null

            if (typeof detalleSeriesRaw === 'string') {
              seriesValue = detalleSeriesRaw
            } else if (Array.isArray(detalleSeriesRaw)) {
              seriesValue = detalleSeriesRaw.join(' | ')
            } else if (
              detalleSeriesRaw &&
              typeof detalleSeriesRaw === 'object'
            ) {
              seriesValue = JSON.stringify(detalleSeriesRaw)
            }

            const finalActivo =
              explicitActivo !== undefined
                    ? explicitActivo
                : ejercicioInfo.is_active !== false
            
            const nombreItem = ejercicioInfo.nombre_plato || ejercicioInfo.nombre_ejercicio || (isNutrition ? `Plato ${ordenDesdeData}` : `Ejercicio ${ordenDesdeData}`)
            uniqueExercises.add(nombreItem)
            
            if (isNutrition) {
              // Formato para platos
              todosEjercicios.push({
                id: ejercicioInfo.id,
                name: nombreItem,
                nombre_plato: nombreItem,
                nombre_ejercicio: nombreItem, // Para compatibilidad
                type: ejercicioInfo.tipo,
                tipo: ejercicioInfo.tipo,
                description: ejercicioInfo.descripcion || ejercicioInfo.receta || '',
                descripcion: ejercicioInfo.descripcion || ejercicioInfo.receta || '',
                receta: ejercicioInfo.receta || '',
                calories: ejercicioInfo.calorias || 0,
                calorias: ejercicioInfo.calorias || 0,
                proteinas: ejercicioInfo.proteinas || 0,
                carbohidratos: ejercicioInfo.carbohidratos || 0,
                grasas: ejercicioInfo.grasas || 0,
                video_url: ejercicioInfo.video_url || null,
                block: blockFromData,
                orden: ordenDesdeData,
                activo: finalActivo,
                is_active: finalActivo
              })
            } else {
              // Formato para ejercicios
              todosEjercicios.push({
                id: ejercicioInfo.id,
                name: nombreItem,
                nombre_ejercicio: nombreItem,
                type: ejercicioInfo.tipo,
                description: ejercicioInfo.descripcion,
                calories: ejercicioInfo.calorias,
                intensity: ejercicioInfo.intensidad,
                video_url: ejercicioInfo.video_url,
                equipo: ejercicioInfo.equipo,
                body_parts: ejercicioInfo.body_parts,
                detalle_series: ejercicioInfo.detalle_series,
                duracion_min: ejercicioInfo.duracion_min,
                series: seriesValue,
                block: blockFromData,
                orden: ordenDesdeData,
                activo: finalActivo,
                is_active: finalActivo
              })
            }
          } else {
            const fallbackName =
              ejercicioData.name ||
              ejercicioData.nombre_plato ||
              ejercicioData.nombre_ejercicio ||
              (isNutrition ? `Plato ${ordenDesdeData}` : `Ejercicio ${ordenDesdeData}`)
            uniqueExercises.add(fallbackName)
            const finalActivo =
              explicitActivo !== undefined ? explicitActivo : true

            const detalleSeriesRaw = ejercicioData.detalle_series
            let seriesValue: string | null = null
            if (typeof detalleSeriesRaw === 'string') {
              seriesValue = detalleSeriesRaw
            } else if (Array.isArray(detalleSeriesRaw)) {
              seriesValue = detalleSeriesRaw.join(' | ')
            } else if (
              detalleSeriesRaw &&
              typeof detalleSeriesRaw === 'object'
            ) {
              seriesValue = JSON.stringify(detalleSeriesRaw)
            }

                    // Usar datos del fallback pero incluir el ID para que el frontend pueda buscarlo
                    if (isNutrition) {
                      todosEjercicios.push({
                        id: ejercicioData.id,
                        name: fallbackName,
                        nombre_plato: fallbackName,
                        nombre_ejercicio: fallbackName,
                        type: ejercicioData.type || ejercicioData.tipo || 'General',
                        tipo: ejercicioData.type || ejercicioData.tipo || 'General',
                        description: ejercicioData.description || ejercicioData.descripcion || ejercicioData.receta || '',
                        descripcion: ejercicioData.description || ejercicioData.descripcion || ejercicioData.receta || '',
                        receta: ejercicioData.receta || '',
                        calories: ejercicioData.calories || ejercicioData.calorias || 0,
                        calorias: ejercicioData.calories || ejercicioData.calorias || 0,
                        proteinas: ejercicioData.proteinas || 0,
                        carbohidratos: ejercicioData.carbohidratos || 0,
                        grasas: ejercicioData.grasas || 0,
                        video_url: ejercicioData.video_url || null,
                        block: blockFromData,
                        orden: ordenDesdeData,
                        activo: finalActivo,
                        is_active: finalActivo
                      })
                    } else {
                      todosEjercicios.push({
                        id: ejercicioData.id,
                        name: fallbackName,
                        nombre_ejercicio: fallbackName,
                        type: ejercicioData.type || ejercicioData.tipo || 'General',
                        tipo: ejercicioData.type || ejercicioData.tipo || 'General',
                        description: ejercicioData.description || ejercicioData.descripcion || '',
                        descripcion: ejercicioData.description || ejercicioData.descripcion || '',
                        calories: ejercicioData.calories || ejercicioData.calorias || 0,
                        calorias: ejercicioData.calories || ejercicioData.calorias || 0,
                        intensity: ejercicioData.intensity || ejercicioData.intensidad || 'Medio',
                        intensidad: ejercicioData.intensity || ejercicioData.intensidad || 'Medio',
                        video_url: ejercicioData.video_url || null,
                        equipo: ejercicioData.equipo || ejercicioData.equipment || '',
                        body_parts: ejercicioData.body_parts || '',
                        detalle_series: detalleSeriesRaw ?? null,
                        duracion_min: ejercicioData.duracion_min ?? null,
                        duration: ejercicioData.duracion_min ?? null,
                        series: seriesValue,
                        block: blockFromData,
                        orden: ordenDesdeData,
                        activo: finalActivo,
                        is_active: finalActivo
                      })
                    }
                  }
                })

        todosEjercicios.sort(
          (a, b) => (a.orden ?? index + 1) - (b.orden ?? index + 1)
        )

        if (todosEjercicios.length > 0) {
          if (!weeklySchedule[semanaKey]) {
            weeklySchedule[semanaKey] = {}
                  }
                weeklySchedule[semanaKey][diaKey] = {
            ejercicios: todosEjercicios,
            blockNames: dayData.blockNames || {},
            blockCount:
              dayData.blockCount ||
              Math.max(
                1,
                ...todosEjercicios.map((item) =>
                  typeof item.block === 'number' && item.block > 0
                    ? item.block
                    : 1
                )
              )
                }
                totalSessions++
              }
      })
    })

    const result = {
      success: true,
      data: {
        weeklySchedule,
        periods: periodos?.cantidad_periodos || 1,
        totalSessions,
        uniqueExercises: Array.from(uniqueExercises),
        semanas: Object.keys(weeklySchedule).length
      }
    }

    // Log detallado para debugging
    console.log('📊 [get-product-planning] Resultado final:', {
      actividad_id: actividadIdNumber,
      categoria: actividadInfo?.categoria,
      isNutrition,
      semanas: Object.keys(weeklySchedule).length,
      totalSessions,
      uniqueExercises: Array.from(uniqueExercises).length,
      sampleWeek: Object.keys(weeklySchedule)[0] ? {
        semana: Object.keys(weeklySchedule)[0],
        dias: Object.keys(weeklySchedule[Object.keys(weeklySchedule)[0]] || {}),
        primerDia: (() => {
          const primeraSemana = weeklySchedule[Object.keys(weeklySchedule)[0]]
          if (!primeraSemana) return null
          const primerDiaKey = Object.keys(primeraSemana)[0]
          if (!primerDiaKey) return null
          const primerDia = primeraSemana[primerDiaKey]
          return {
            dia: primerDiaKey,
            estructura: Array.isArray(primerDia) ? 'array' : typeof primerDia,
            tieneEjercicios: Array.isArray(primerDia) 
              ? primerDia.length 
              : (primerDia?.ejercicios?.length || primerDia?.exercises?.length || 0),
            primerosEjercicios: (() => {
              const ejercicios = Array.isArray(primerDia) 
                ? primerDia 
                : (primerDia?.ejercicios || primerDia?.exercises || [])
              return ejercicios.slice(0, 2).map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                tieneName: !!ex.name,
                tieneNombreEjercicio: !!ex.nombre_ejercicio,
                tieneNombrePlato: !!ex.nombre_plato
              }))
            })()
          }
        })()
      } : null
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Error en GET /api/get-product-planning:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('❌ Stack trace:', errorStack)
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
  }
}