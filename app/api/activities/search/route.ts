import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

// Función para detectar si un taller está finalizado
async function isWorkshopFinished(supabase: any, activityId: number): Promise<boolean> {
  try {
    // Obtener detalles del taller
    const { data: tallerDetalles, error: tallerError } = await supabase
      .from('taller_detalles')
      .select('originales')
      .eq('actividad_id', activityId)

    if (tallerError || !tallerDetalles || tallerDetalles.length === 0) {
      return false // Si no hay detalles, no está finalizado
    }

    // Extraer todas las fechas de todos los temas
    const allDates: string[] = []
    tallerDetalles.forEach((tema: any) => {
      if (tema.originales?.fechas_horarios) {
        tema.originales.fechas_horarios.forEach((fecha: any) => {
          if (fecha.fecha) {
            allDates.push(fecha.fecha)
          }
        })
      }
    })

    if (allDates.length === 0) {
      return true // Si no hay fechas, está finalizado
    }

    // Verificar si la última fecha ya pasó
    const now = new Date()
    const lastDate = new Date(Math.max(...allDates.map(date => new Date(date).getTime())))
    
    return lastDate < now
  } catch (error) {
    console.error('Error verificando si taller está finalizado:', error)
    return false
  }
}

// Hacer la ruta dinámica para evitar evaluación durante el build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('🚀 ACTIVITIES/SEARCH: API ejecutándose...')
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("term")
    const typeFilter = searchParams.get("type") // e.g., 'fitness', 'nutrition'
    const difficultyFilter = searchParams.get("difficulty") // e.g., 'beginner', 'intermediate'
    const coachIdFilter = searchParams.get("coachId") // Filter by specific coach
    
    // Preferir service role; si no está disponible, usar sesión del usuario.
    let supabase = createServiceRoleClient()
    let usingServiceRole = Boolean(supabase)

    if (!supabase) {
      console.warn('⚠️ [activities/search] SUPABASE_SERVICE_ROLE_KEY ausente: usando cliente autenticado del request')
      supabase = await createRouteHandlerClient()
    } else {
      const { error: validationError } = await supabase
        .from('activities')
        .select('id')
        .limit(1)

      if (validationError && typeof validationError.message === 'string' && validationError.message.toLowerCase().includes('invalid api key')) {
        console.warn('⚠️ [activities/search] SUPABASE_SERVICE_ROLE_KEY inválida: usando cliente autenticado del request')
        supabase = await createRouteHandlerClient()
        usingServiceRole = false
      }
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    let query = supabase.from("activities").select(`
      *,
      activity_media!activity_media_activity_id_fkey(*)
    `)

    // Por defecto, las consultas no son "productos": se muestran solo en la sección Café.
    // Evitamos que aparezcan en search/listados generales.
    if (!typeFilter || typeFilter !== 'consultation') {
      query = query.neq('type', 'consultation')
    }
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }
    if (typeFilter) {
      query = query.eq("type", typeFilter)
    }
    if (difficultyFilter) {
      query = query.eq("difficulty", difficultyFilter)
    }
    if (coachIdFilter) {
      query = query.eq("coach_id", coachIdFilter)
    }
    query = query.order("created_at", { ascending: false })
    const { data: activities, error } = await query
    if (error) {
      console.error("❌ Error al buscar actividades:", error)
      return NextResponse.json(
        { success: false, error: `Error al buscar actividades: ${error.message}` },
        { status: 500 },
      )
    }

    // Filtrar talleres finalizados para clientes
    const filteredActivities = []
    for (const activity of activities) {
      if (activity.type === 'workshop') {
        const isFinished = await isWorkshopFinished(supabase, activity.id)
        if (!isFinished) {
          filteredActivities.push(activity)
        } else {
          console.log(`🚫 Taller finalizado filtrado: ${activity.title} (ID: ${activity.id})`)
        }
      } else {
        // Programas y documentos no se filtran
        filteredActivities.push(activity)
      }
    }

    console.log(`📊 Actividades encontradas: ${activities.length}, Filtradas: ${filteredActivities.length}`)
    // Obtener ratings desde la vista materializada por separado
    const activityIds = filteredActivities.map((a: any) => a.id)
    const ratingsData: any = {}
    if (activityIds.length > 0) {
      // Ahora que las tablas existen, podemos usar las estadísticas
      const { data: ratings, error: ratingsError } = await supabase
        .from("activity_stats_view")
        .select("activity_id, avg_rating, total_reviews")
        .in("activity_id", activityIds)
      if (!ratingsError && ratings) {
        ratings.forEach((rating: any) => {
          ratingsData[rating.activity_id] = {
            avg_rating: rating.avg_rating,
            total_reviews: rating.total_reviews
          }
        })
      } else if (ratingsError) {
      }
    }
    // Obtener datos de coaches por separado
    const coachIds = [...new Set(activities.map((a: any) => a.coach_id).filter(Boolean))]
    const coachesData: any = {}
    if (coachIds.length > 0) {
      // Obtener ratings de coaches desde coach_stats_view
      const { data: coachStats, error: coachStatsError } = await supabase
        .from("coach_stats_view")
        .select("coach_id, avg_rating, total_reviews")
        .in("coach_id", coachIds)
      const coachStatsData: any = {}
      if (!coachStatsError && coachStats) {
        coachStats.forEach((stat: any) => {
          coachStatsData[stat.coach_id] = {
            avg_rating: stat.avg_rating,
            total_reviews: stat.total_reviews
          }
        })
      }
      // Obtener datos de user_profiles (nombre y avatar)
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url")
        .in("id", coachIds)
      // Obtener datos adicionales de coaches (especialización y experiencia)
      const { data: coaches, error: coachesError } = await supabase
        .from("coaches")
        .select("id, specialization, experience_years")
        .in("id", coachIds)
      // Combinar datos de user_profiles y coaches
      if (!userProfilesError && userProfiles) {
        userProfiles.forEach((profile: any) => {
          const coachData = coaches?.find((coach: { id: string; specialization?: string | null; experience_years?: number | null }) => coach.id === profile.id)
          const stats = coachStatsData[profile.id] || { avg_rating: 0, total_reviews: 0 }
          coachesData[profile.id] = {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            whatsapp: null,
            specialization: coachData?.specialization || "Fitness Coach",
            experience_years: coachData?.experience_years || null,
            rating: stats.avg_rating,
            total_reviews: stats.total_reviews,
            instagram: null
          }
        })
      }
    }
    // Obtener estadísticas detalladas usando el nuevo endpoint
    const programActivityIds = activities
      .filter((a: any) => a.type === 'fitness' || a.type === 'program' || a.type === 'workshop')
      .map((a: any) => a.id)
    
    const fitnessData: any = {}
    const workshopData: any = {} // Datos específicos para talleres
    const nutritionData: any = {}
    
    // Para cada actividad, obtener estadísticas usando el nuevo cálculo
    for (const activityId of programActivityIds) {
      let isWorkshop = false
      let isNutrition = false

      try {
        const { data: actividad } = await supabase
          .from('activities')
          .select('type, categoria')
          .eq('id', activityId)
          .single()

        isNutrition = actividad?.categoria === 'nutricion' || actividad?.type === 'nutrition'
        isWorkshop = actividad?.type === 'workshop'

        let ejerciciosCount = 0
        let totalSessions = 0
        let periodosUnicos = 1

        if (isWorkshop) {
          try {
            const { data: tallerDetallesStats } = await supabase
              .from('taller_detalles')
              .select('nombre, originales')
              .eq('actividad_id', activityId)
              .eq('activo', true)

            if (tallerDetallesStats && tallerDetallesStats.length > 0) {
              const temasUnicos = new Set<string>(
                tallerDetallesStats
                  .map((tema: { nombre?: string | null }) => tema.nombre)
                  .filter((nombre: string | null | undefined): nombre is string => Boolean(nombre))
              )
              const cantidadTemas = temasUnicos.size

              const allDates: string[] = []
              tallerDetallesStats.forEach((tema: { originales?: unknown }) => {
                try {
                  let originales = tema.originales as any
                  if (typeof originales === 'string') {
                    originales = JSON.parse(originales)
                  }
                  if (originales?.fechas_horarios && Array.isArray(originales.fechas_horarios)) {
                    originales.fechas_horarios.forEach((fecha: { fecha?: string }) => {
                      if (fecha?.fecha) {
                        allDates.push(fecha.fecha)
                      }
                    })
                  }
                } catch (innerError) {
                  console.error('Error procesando fechas del tema:', innerError)
                }
              })

              let cantidadDias = cantidadTemas
              if (allDates.length > 0) {
                const fechasOrdenadas = allDates
                  .map((fecha) => new Date(fecha))
                  .filter((fecha) => !Number.isNaN(fecha.getTime()))
                  .sort((a, b) => a.getTime() - b.getTime())

                if (fechasOrdenadas.length > 0) {
                  const primeraFecha = fechasOrdenadas[0]
                  const ultimaFecha = fechasOrdenadas[fechasOrdenadas.length - 1]
                  const diferenciaMs = ultimaFecha.getTime() - primeraFecha.getTime()
                  cantidadDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24)) + 1
                }
              }

              workshopData[activityId] = {
                cantidadTemas,
                cantidadDias
              }
            } else {
              workshopData[activityId] = {
                cantidadTemas: 0,
                cantidadDias: 0
              }
            }
          } catch (innerError) {
            console.error(`Error calculando estadísticas de taller para actividad ${activityId}:`, innerError)
            workshopData[activityId] = {
              cantidadTemas: 0,
              cantidadDias: 0
            }
          }

          continue
        }

        if (isNutrition) {
          const { data: planificacion } = await supabase
            .from('planificacion_ejercicios')
            .select('lunes, martes, miercoles, jueves, viernes, sabado, domingo')
            .eq('actividad_id', activityId)

          const uniquePlateIds = new Set<number>()
          const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const

          if (planificacion && planificacion.length > 0) {
            planificacion.forEach((semana: Record<string, any>) => {
              diasSemana.forEach((dia) => {
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

                  ejercicios.forEach((ejercicio: { id?: number | string | null }) => {
                    if (ejercicio?.id !== undefined && ejercicio.id !== null) {
                      const id = typeof ejercicio.id === 'number' ? ejercicio.id : Number(ejercicio.id)
                      if (!Number.isNaN(id) && id > 0) {
                        uniquePlateIds.add(id)
                      }
                    }
                  })
                }
              })
            })
          }

          ejerciciosCount = uniquePlateIds.size

          if (planificacion && planificacion.length > 0) {
            const diasConEjercicios = new Set<string>()

            planificacion.forEach((semana: Record<string, any>) => {
              diasSemana.forEach((dia) => {
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

                  if (ejercicios.length > 0) {
                    const hasValidExercise = ejercicios.some((ejercicio: { id?: number | string | null }) => {
                      if (ejercicio?.id !== undefined && ejercicio.id !== null) {
                        const id = typeof ejercicio.id === 'number' ? ejercicio.id : Number(ejercicio.id)
                        return !Number.isNaN(id) && id > 0
                      }
                      return false
                    })

                    if (hasValidExercise) {
                      diasConEjercicios.add(dia)
                    }
                  }
                }
              })
            })

            const diasUnicos = diasConEjercicios.size
            const { data: periodosData } = await supabase
              .from('periodos')
              .select('cantidad_periodos')
              .eq('actividad_id', activityId)
              .maybeSingle()

            periodosUnicos = periodosData?.cantidad_periodos || 1
            totalSessions = diasUnicos * periodosUnicos

            console.log(`🥗 Actividad ${activityId} (Nutrición):`, {
              platosUnicos: ejerciciosCount,
              diasUnicos,
              periodosUnicos,
              totalSessions,
              planificacion: planificacion.length
            })
          } else {
            totalSessions = 0
            console.log(`🥗 Actividad ${activityId} (Nutrición): Sin planificación`)
          }

          nutritionData[activityId] = {
            exercisesCount: ejerciciosCount,
            totalSessions,
            periods: periodosUnicos,
          }
        } else {
          const { data: ejercicios } = await supabase
            .from('ejercicios_detalles')
            .select('id')
            .contains('activity_id', { [activityId]: {} })

          const { data: periodosData } = await supabase
            .from('periodos')
            .select('cantidad_periodos')
            .eq('actividad_id', activityId)

          const { data: sesionesData } = await supabase
            .from('planificacion_ejercicios')
            .select('lunes, martes, miercoles, jueves, viernes, sabado, domingo, numero_semana')
            .eq('actividad_id', activityId)

          ejerciciosCount = ejercicios?.length || 0
          periodosUnicos = periodosData?.[0]?.cantidad_periodos || 1

          if (sesionesData && sesionesData.length > 0) {
            const diasConEjercicios = new Set<string>()
            const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const

            sesionesData.forEach((planificacion: Record<string, any>) => {
              diasSemana.forEach((dia) => {
                const diaContent = planificacion[dia]
                if (diaContent && diaContent !== 'null' && diaContent !== '[]') {
                  if (
                    typeof diaContent === 'object' &&
                    diaContent.ejercicios &&
                    Array.isArray(diaContent.ejercicios)
                  ) {
                    const activeExercises = diaContent.ejercicios.filter((exercise: { activo?: boolean }) => exercise.activo !== false)
                    if (activeExercises.length > 0) {
                      diasConEjercicios.add(`${planificacion.numero_semana}-${dia}`)
                    }
                  } else {
                    diasConEjercicios.add(`${planificacion.numero_semana}-${dia}`)
                  }
                }
              })
            })

            const diasUnicos = diasConEjercicios.size
            totalSessions = diasUnicos * Math.max(periodosUnicos, 1)

            console.log(`📊 Actividad ${activityId} (Fitness):`, {
              diasUnicos,
              periodosUnicos,
              totalSessions,
              planificacion: sesionesData.length,
              diasConEjercicios: Array.from(diasConEjercicios),
              sesionesData: sesionesData.map((s: Record<string, any>) => ({
                numero_semana: s.numero_semana,
                lunes: s.lunes,
                martes: s.martes,
                miercoles: s.miercoles,
                jueves: s.jueves,
                viernes: s.viernes,
                sabado: s.sabado,
                domingo: s.domingo
              }))
            })
          }

          if (totalSessions === 0) {
            const { data: ejerciciosDetalles } = await supabase
              .from('ejercicios_detalles')
              .select('semana, dia, periodo')
              .contains('activity_id', { [activityId]: {} })
              .not('semana', 'is', null)

            if (ejerciciosDetalles && ejerciciosDetalles.length > 0) {
              const diasUnicos = new Set<string>()
              ejerciciosDetalles.forEach((detalle: { semana?: string | number; dia?: string | number; periodo?: number | null }) => {
                if (detalle.semana && detalle.dia) {
                  diasUnicos.add(`${detalle.dia}-${detalle.semana}`)
                }
              })

              totalSessions = diasUnicos.size
              const periodosPorDetalle = ejerciciosDetalles
                .map((detalle: { periodo?: number | null }) => detalle.periodo)
                .filter((periodo: number | null | undefined): periodo is number => typeof periodo === 'number' && !Number.isNaN(periodo))
              const periodosUnicosDetalles = [...new Set<number>(periodosPorDetalle)].length
              if (periodosUnicosDetalles > 0) {
                totalSessions *= periodosUnicosDetalles
              }
            }
          }
        }

        if (!isNutrition) {
          fitnessData[activityId] = {
            exercisesCount: ejerciciosCount,
            totalSessions,
            periods: periodosUnicos
          }
        }
      } catch (error) {
        console.error(`Error calculando estadísticas para actividad ${activityId}:`, error)

        if (isWorkshop) {
          if (!workshopData[activityId]) {
            workshopData[activityId] = {
              cantidadTemas: 0,
              cantidadDias: 0
            }
          }
        } else if (!fitnessData[activityId]) {
          fitnessData[activityId] = {
            exercisesCount: 0,
            totalSessions: 0,
            periods: 0
          }
        }
      }
    }
    // Formatear las actividades
    const formattedActivities = filteredActivities.map((activity: any) => {
      const rating = ratingsData[activity.id] || { avg_rating: 0, total_reviews: 0 }
      const coach = coachesData[activity.coach_id] || null
      const fitness = fitnessData[activity.id] || { exercisesCount: 0, totalSessions: 0 }
      const nutrition = nutritionData[activity.id] || { exercisesCount: 0, totalSessions: 0 }
      const workshop = workshopData[activity.id] || null
      
      // Parsear objetivos desde workshop_type si existe
      let objetivos = []
      if (activity.workshop_type) {
        try {
          const parsed = JSON.parse(activity.workshop_type)
          if (parsed.objetivos) {
            // Si objetivos es un string separado por ';', convertirlo a array
            if (typeof parsed.objetivos === 'string') {
              objetivos = parsed.objetivos.split(';').map((obj: string) => obj.trim()).filter((obj: string) => obj.length > 0)
            } else if (Array.isArray(parsed.objetivos)) {
              objetivos = parsed.objetivos
            }
          }
        } catch (error) {
          console.error('Error parseando objetivos:', error)
        }
      }
      
      // Para talleres, usar datos de workshop; para otros, usar fitness
      const isWorkshop = activity.type === 'workshop'
      const isNutrition = activity.categoria === 'nutricion' || activity.categoria === 'nutrition'

      const exercisesCount = isWorkshop && workshop
        ? workshop.cantidadTemas
        : isNutrition
          ? (nutrition.exercisesCount || 0)
          : (fitness.exercisesCount || 0)

      const totalSessions = isWorkshop && workshop
        ? workshop.cantidadDias
        : isNutrition
          ? (nutrition.totalSessions || 0)
          : (fitness.totalSessions || 0)
      
      return {
        ...activity,
        // Incluir objetivos parseados
        objetivos: objetivos,
        // Incluir media de la actividad
        media: activity.activity_media?.[0] || null,
        coach_name: coach?.full_name || null,
        full_name: coach?.full_name || null,
        coach_avatar_url: coach?.avatar_url || null,
        coach_whatsapp: coach?.whatsapp || null,
        specialization: coach?.specialization || null,
        coach_experience_years: coach?.experience_years || null,
        coach_rating: coach?.rating || null,
        coach_total_reviews: coach?.total_reviews || null,
        coach_instagram: coach?.instagram || null,
        // Map the rating data from the materialized view
        program_rating: rating.avg_rating || 0,
        total_program_reviews: rating.total_reviews || 0,
        // Map fitness data
        exercisesCount: exercisesCount,
        totalSessions: totalSessions,
        // Para talleres: incluir cantidadTemas y cantidadDias
        ...(isWorkshop && workshop ? {
          cantidadTemas: workshop.cantidadTemas,
          cantidadDias: workshop.cantidadDias
        } : {}),
      }
    })
    //   program_rating: formattedActivities[0]?.program_rating,
    //   total_program_reviews: formattedActivities[0]?.total_program_reviews,
    // })
    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error("💥 Error en GET /api/activities/search:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
