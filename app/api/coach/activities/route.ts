import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🚀 COACH/ACTIVITIES: API ejecutándose...')
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("term")
    const typeFilter = searchParams.get("type")
    const difficultyFilter = searchParams.get("difficulty")
    const coachIdFilter = searchParams.get("coachId")
    
    // Usar service role para bypass RLS temporalmente
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
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
        // Map fitness data
        exercisesCount: fitness.exercisesCount || 0,
        totalSessions: fitness.totalSessions || 0,
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
