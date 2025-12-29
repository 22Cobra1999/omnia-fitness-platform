import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

// Hacer la ruta dinámica para evitar evaluación durante el build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const isInvalidApiKeyError = (err: any) => {
  const msg = String(err?.message || '')
  return msg.toLowerCase().includes('invalid api key')
}

export async function GET(request: NextRequest) {
  console.log('🚀 COACH/ACTIVITIES: API ejecutándose...')
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("term")
    const typeFilter = searchParams.get("type")
    const difficultyFilter = searchParams.get("difficulty")
    const coachIdFilter = searchParams.get("coachId")

    const authSupabase = await createRouteHandlerClient()
    let user = null as any
    const { data: userData, error: authError } = await authSupabase.auth.getUser()
    if (!authError && userData?.user) {
      user = userData.user
    } else {
      const { data: sessionData } = await authSupabase.auth.getSession()
      if (sessionData?.session?.user) {
        user = sessionData.session.user
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Seguridad: el coach solo puede consultar sus propias actividades.
    // Si el frontend manda coachId distinto, lo ignoramos.
    const coachId = String(user.id)
    
    // Preferir service role para bypass RLS; si no está disponible o es inválida, usar el cliente autenticado.
    let supabase: any = createServiceRoleClient()
    let usingServiceRole = Boolean(supabase)

    if (!supabase) {
      console.warn('⚠️ [coach/activities] SUPABASE_SERVICE_ROLE_KEY ausente: usando cliente autenticado del request')
      supabase = authSupabase
      usingServiceRole = false
    } else {
      const { error: validationError } = await supabase
        .from('activities')
        .select('id')
        .limit(1)

      if (validationError && isInvalidApiKeyError(validationError)) {
        console.warn('⚠️ [coach/activities] SUPABASE_SERVICE_ROLE_KEY inválida: usando cliente autenticado del request')
        supabase = authSupabase
        usingServiceRole = false
      }
    }
    
    let query = supabase.from("activities").select(`
      *,
      activity_media!activity_media_activity_id_fkey(*)
    `)
    
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }
    if (typeFilter) {
      query = query.eq("type", typeFilter)
    }
    if (difficultyFilter) {
      query = query.eq("difficulty", difficultyFilter)
    }
    // Siempre filtrar por coach autenticado
    query = query.eq("coach_id", coachId)
    
    query = query.order("created_at", { ascending: false })
    const { data: activities, error } = await query
    
    if (error) {
      console.error("❌ Error al buscar actividades:", {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        usingServiceRole,
        coachId,
        coachIdFilter
      })
      return NextResponse.json(
        {
          success: false,
          error: `Error al buscar actividades: ${error.message}`,
          code: (error as any).code,
          hint: (error as any).hint
        },
        { status: 500 },
      )
    }

    // Para el coach, NO filtrar talleres finalizados
    // El coach necesita ver todos sus talleres para gestionarlos
    console.log(`📊 Actividades del coach: ${activities.length} (sin filtrar talleres finalizados)`)
    
    // Obtener ratings desde la vista materializada por separado
    const activityIds = activities.map((a: any) => a.id)
    const ratingsData: any = {}
    if (activityIds.length > 0) {
      const { data: ratings, error: ratingsError } = await supabase
        .from("activity_stats_view")
        .select("activity_id, avg_rating, total_reviews")
        .in("activity_id", activityIds)
      
      if (!ratingsError && ratings) {
        ratings.forEach((rating: any) => {
          ratingsData[rating.activity_id] = {
            avg_rating: rating.avg_rating || 0,
            total_reviews: rating.total_reviews || 0
          }
        })
      }
    }

    // Obtener datos de coaches
    const coachIds = [...new Set(activities.map((a: any) => a.coach_id))]
    const coachesData: any = {}
    if (coachIds.length > 0) {
      const { data: coaches, error: coachesError } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url, whatsapp, specialization, experience_years, rating, total_reviews, instagram")
        .in("id", coachIds)
      
      if (!coachesError && coaches) {
        coaches.forEach((coach: any) => {
          coachesData[coach.id] = coach
        })
      }
    }

    // Obtener datos de talleres para calcular cantidadTemas y cantidadDias
    const workshopData: any = {}
    const workshopActivityIds = activities.filter((a: any) => a.type === 'workshop').map((a: any) => a.id)
    if (workshopActivityIds.length > 0) {
      for (const activityId of workshopActivityIds) {
        try {
          const { data: tallerDetallesStats } = await supabase
            .from('taller_detalles')
            .select('nombre, originales')
            .eq('actividad_id', activityId)
            .eq('activo', true)
          
          if (tallerDetallesStats && tallerDetallesStats.length > 0) {
            // Calcular cantidad de temas únicos
            const temasUnicos = new Set(tallerDetallesStats.map((t: any) => t.nombre).filter(Boolean))
            const cantidadTemas = temasUnicos.size
            
            // Calcular duración desde la primera fecha hasta la última fecha
            const allDates: string[] = []
            tallerDetallesStats.forEach((tema: any) => {
              try {
                let originales = tema.originales
                if (typeof originales === 'string') {
                  originales = JSON.parse(originales)
                }
                if (originales?.fechas_horarios && Array.isArray(originales.fechas_horarios)) {
                  originales.fechas_horarios.forEach((fecha: any) => {
                    if (fecha?.fecha) {
                      allDates.push(fecha.fecha)
                    }
                  })
                }
              } catch (e) {
                console.error('Error procesando fechas del tema:', e)
              }
            })
            
            let cantidadDias = cantidadTemas // Fallback: cantidad de temas
            if (allDates.length > 0) {
              const fechas = allDates
                .map((fecha: string) => new Date(fecha))
                .filter((fecha: Date) => !isNaN(fecha.getTime()))
                .sort((a: Date, b: Date) => a.getTime() - b.getTime())
              
              if (fechas.length > 0) {
                const primeraFecha = fechas[0]
                const ultimaFecha = fechas[fechas.length - 1]
                const diferenciaMs = ultimaFecha.getTime() - primeraFecha.getTime()
                cantidadDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24)) + 1 // +1 para incluir ambos días
              }
            }
            
            workshopData[activityId] = {
              cantidadTemas,
              cantidadDias,
              exercisesCount: cantidadTemas,
              totalSessions: cantidadDias
            }
            
            console.log(`📊 COACH/ACTIVITIES: Taller ${activityId} - Temas: ${cantidadTemas}, Días: ${cantidadDias}`)
          }
        } catch (error) {
          console.error(`❌ Error calculando estadísticas del taller ${activityId}:`, error)
        }
      }
    }

    // Obtener datos de fitness/nutrición para cada actividad
    const fitnessData: any = {}
    for (const activity of activities) {
      if (activity.categoria === 'fitness' || activity.categoria === 'nutrition') {
        try {
          const isNutrition = activity.categoria === 'nutrition' || activity.categoria === 'nutricion'
          
          if (isNutrition) {
            // Para nutrición: obtener platos ÚNICOS realmente usados en la planificación
            const activityId = activity.id
            
            // Obtener planificación desde planificacion_ejercicios
            // La tabla planificacion_ejercicios usa 'actividad_id' (no 'activity_id')
            const { data: planificacion, error: planError } = await supabase
              .from('planificacion_ejercicios')
              .select('lunes, martes, miercoles, jueves, viernes, sabado, domingo')
              .eq('actividad_id', activityId)
            
            if (planError) {
              console.error(`❌ COACH/ACTIVITIES: Error obteniendo planificación para actividad ${activityId}:`, planError)
            }
            
            console.log(`🔍 COACH/ACTIVITIES: Planificación para actividad ${activityId}:`, {
              encontrada: planificacion?.length || 0,
              error: planError?.message
            })
            
            // Extraer todos los IDs únicos de platos de la planificación
            const uniquePlateIds = new Set<number>()
            let totalSessions = 0
            
            if (planificacion && planificacion.length > 0) {
              const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
              const diasConEjercicios = new Set<string>()
              
              planificacion.forEach((semana: any) => {
                dias.forEach((dia: string) => {
                  const diaData = semana[dia]
                  if (diaData && typeof diaData === 'object') {
                    // El día puede ser un objeto con ejercicios o un array directo
                    let ejercicios: any[] = []
                    if (Array.isArray(diaData)) {
                      ejercicios = diaData
                    } else if (Array.isArray(diaData.ejercicios)) {
                      ejercicios = diaData.ejercicios
                    } else if (Array.isArray(diaData.exercises)) {
                      ejercicios = diaData.exercises
                    }
                    
                    // Extraer IDs de los ejercicios
                    ejercicios.forEach((ej: any) => {
                      if (ej && ej.id !== undefined && ej.id !== null) {
                        const id = typeof ej.id === 'number' ? ej.id : Number(ej.id)
                        if (!isNaN(id) && id > 0) {
                          uniquePlateIds.add(id)
                        }
                      }
                    })
                    
                    // Contar días con ejercicios válidos
                    if (ejercicios.length > 0) {
                      const hasValidExercise = ejercicios.some((ej: any) => {
                        if (ej && ej.id !== undefined && ej.id !== null) {
                          const id = typeof ej.id === 'number' ? ej.id : Number(ej.id)
                          return !isNaN(id) && id > 0
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
              
              // Obtener períodos (usar actividad_id o activity_id)
              // La tabla periodos usa 'actividad_id'
              const { data: periodosData, error: periodosError } = await supabase
                .from('periodos')
                .select('cantidad_periodos')
                .eq('actividad_id', activityId)
                .maybeSingle()
              
              if (periodosError) {
                console.error(`❌ COACH/ACTIVITIES: Error obteniendo períodos para actividad ${activityId}:`, periodosError)
              }
              
              const periodosUnicos = periodosData?.cantidad_periodos || 1
              const diasUnicos = diasConEjercicios.size
              totalSessions = diasUnicos * periodosUnicos
            }
            
            const exercisesCount = uniquePlateIds.size
            
            fitnessData[activity.id] = {
              exercisesCount, // ✅ Platos únicos realmente usados en la planificación
              totalSessions,
              uniqueDays: 0,
              uniquePeriods: 0
            }
            
            console.log(`🥗 COACH/ACTIVITIES: Actividad ${activityId} (Nutrición) - Platos únicos: ${exercisesCount}, Sesiones: ${totalSessions}, Planificación encontrada: ${planificacion?.length || 0} semanas`)
          } else {
            // Para fitness: obtener ejercicios desde planificacion_ejercicios
            const { data: stats, error: statsError } = await supabase
              .from('planificacion_ejercicios')
              .select('*')
              .eq('activity_id', activity.id)
            
            if (!statsError && stats) {
              const uniqueExercises = new Set()
              const totalSessions = stats.length
              const uniqueDays = new Set()
              const uniquePeriods = new Set()
              
              stats.forEach((stat: any) => {
                if (stat.ejercicios_ids) {
                  stat.ejercicios_ids.forEach((id: any) => uniqueExercises.add(id))
                }
                if (stat.dia) uniqueDays.add(stat.dia)
                if (stat.periodo) uniquePeriods.add(stat.periodo)
              })
              
              fitnessData[activity.id] = {
                exercisesCount: uniqueExercises.size,
                totalSessions,
                uniqueDays: uniqueDays.size,
                uniquePeriods: uniquePeriods.size
              }
            } else {
              fitnessData[activity.id] = {
                exercisesCount: 0,
                totalSessions: 0,
                uniqueDays: 0,
                uniquePeriods: 0
              }
            }
          }
        } catch (error) {
          console.error(`Error obteniendo estadísticas para actividad ${activity.id}:`, error)
          fitnessData[activity.id] = {
            exercisesCount: 0,
            totalSessions: 0,
            uniqueDays: 0,
            uniquePeriods: 0
          }
        }
      }
    }

    // Formatear las actividades
    const formattedActivities = activities.map((activity: any) => {
      const rating = ratingsData[activity.id] || { avg_rating: 0, total_reviews: 0 }
      const coach = coachesData[activity.coach_id] || null
      const fitness = fitnessData[activity.id] || { exercisesCount: 0, totalSessions: 0 }
      const workshop = workshopData[activity.id] || null
      
      // Parsear objetivos desde workshop_type si existe
      let objetivos = []
      if (activity.workshop_type) {
        try {
          const parsed = JSON.parse(activity.workshop_type)
          if (Array.isArray(parsed)) {
            objetivos = parsed
          }
        } catch (error) {
          console.error('Error parseando objetivos:', error)
        }
      }
      
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
        // Map fitness data o workshop data
        exercisesCount: workshop ? workshop.exercisesCount : (fitness.exercisesCount || 0),
        totalSessions: workshop ? workshop.totalSessions : (fitness.totalSessions || 0),
        // Para talleres: agregar cantidadTemas y cantidadDias
        cantidadTemas: workshop?.cantidadTemas,
        cantidadDias: workshop?.cantidadDias,
      }
    })

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error("💥 Error en GET /api/coach/activities:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
