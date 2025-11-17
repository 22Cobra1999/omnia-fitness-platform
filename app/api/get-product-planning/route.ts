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
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
        .select(
          'id, nombre_ejercicio, tipo, descripcion, calorias, intensidad, video_url, equipo, body_parts, detalle_series, duracion_min, is_active, activity_id'
        )
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
      const { data: ejerciciosFromDb, error: ejerciciosError } = await supabase
        .from('ejercicios_detalles')
        .select('id, nombre_ejercicio, tipo, descripcion, calorias, intensidad, video_url, equipo, body_parts, detalle_series, duracion_min, is_active, activity_id')
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
          
          const ejercicioInfo = {
            ...ejercicioFromDb,
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
            uniqueExercises.add(
              ejercicioInfo.nombre_ejercicio || `Ejercicio ${ordenDesdeData}`
            )
                  todosEjercicios.push({
              id: ejercicioInfo.id,
              name: ejercicioInfo.nombre_ejercicio,
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
          } else {
            const fallbackName =
              ejercicioData.name ||
              ejercicioData.nombre_ejercicio ||
              `Ejercicio ${ordenDesdeData}`
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
                    todosEjercicios.push({
              id: ejercicioData.id,
              name: ejercicioInfo?.nombre_ejercicio || fallbackName,
              nombre_ejercicio: ejercicioInfo?.nombre_ejercicio || fallbackName,
              type: ejercicioInfo?.tipo || ejercicioData.type || ejercicioData.tipo || 'General',
              tipo: ejercicioInfo?.tipo || ejercicioData.type || ejercicioData.tipo || 'General',
              description:
                ejercicioInfo?.descripcion || ejercicioData.description || ejercicioData.descripcion || '',
              descripcion:
                ejercicioInfo?.descripcion || ejercicioData.description || ejercicioData.descripcion || '',
              calories: ejercicioInfo?.calorias || ejercicioData.calories || ejercicioData.calorias || 0,
              calorias: ejercicioInfo?.calorias || ejercicioData.calories || ejercicioData.calorias || 0,
              intensity:
                ejercicioInfo?.intensidad || ejercicioData.intensity || ejercicioData.intensidad || 'Medio',
              intensidad:
                ejercicioInfo?.intensidad || ejercicioData.intensity || ejercicioData.intensidad || 'Medio',
              video_url: ejercicioInfo?.video_url || ejercicioData.video_url || null,
              equipo: ejercicioInfo?.equipo || ejercicioData.equipo || ejercicioData.equipment || '',
              body_parts: ejercicioInfo?.body_parts || ejercicioData.body_parts || '',
              detalle_series: ejercicioInfo?.detalle_series || (detalleSeriesRaw ?? null),
              duracion_min: ejercicioInfo?.duracion_min || (ejercicioData.duracion_min ?? null),
              duration: ejercicioInfo?.duracion_min || (ejercicioData.duracion_min ?? null),
              series: ejercicioInfo?.detalle_series || seriesValue,
              block: blockFromData,
              orden: ordenDesdeData,
                      activo: finalActivo,
                      is_active: finalActivo
                  })
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