import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("term")
    const typeFilter = searchParams.get("type") // e.g., 'fitness', 'nutrition'
    const difficultyFilter = searchParams.get("difficulty") // e.g., 'beginner', 'intermediate'
    const coachIdFilter = searchParams.get("coachId") // Filter by specific coach
    // console.log("🔍 GET /api/activities/search - Buscando actividades con término:", searchTerm)
    console.log("Filtros:", { typeFilter, difficultyFilter, coachIdFilter })
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
    // Obtener ratings desde la vista materializada por separado
    const activityIds = activities.map((a: any) => a.id)
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
        console.log("⚠️ Error obteniendo estadísticas:", ratingsError.message)
      }
    }
    // Obtener datos de coaches por separado
    const coachIds = [...new Set(activities.map((a: any) => a.coach_id).filter(Boolean))]
    const coachesData: any = {}
    // console.log("🔍 Coach IDs a buscar:", coachIds)
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
      // console.log("🔍 Resultado de consulta user_profiles:", { userProfiles, error: userProfilesError })
      // Obtener datos adicionales de coaches (especialización y experiencia)
      const { data: coaches, error: coachesError } = await supabase
        .from("coaches")
        .select("id, specialization, experience_years")
        .in("id", coachIds)
      // console.log("🔍 Resultado de consulta coaches:", { coaches, error: coachesError })
      // Combinar datos de user_profiles y coaches
      if (!userProfilesError && userProfiles) {
        userProfiles.forEach((profile: any) => {
          const coachData = coaches?.find(c => c.id === profile.id)
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
      // console.log("🔍 Datos finales de coaches:", coachesData)
    }
    // Obtener estadísticas detalladas usando el nuevo endpoint
    const programActivityIds = activities
      .filter((a: any) => a.type === 'fitness' || a.type === 'program' || a.type === 'workshop')
      .map((a: any) => a.id)
    
    const fitnessData: any = {}
    
    // Para cada actividad, obtener estadísticas usando el nuevo cálculo
    for (const activityId of programActivityIds) {
      try {
        // Calcular ejercicios: cantidad de filas en ejercicios_detalles × cantidad de periodos
        const { data: ejercicios } = await supabase
          .from('ejercicios_detalles')
          .select('id')
          .eq('activity_id', activityId)

        // Calcular periodos únicos
        const { data: periodosData } = await supabase
          .from('organizacion_ejercicios')
          .select('numero_periodo')
          .eq('activity_id', activityId)

        // Calcular sesiones: count distinct (dias-semanas) × periodos
        const { data: sesionesData } = await supabase
          .from('organizacion_ejercicios')
          .select('dia, semana, numero_periodo')
          .eq('activity_id', activityId)

        const ejerciciosCount = ejercicios?.length || 0
        const periodosUnicos = [...new Set(periodosData?.map(p => p.numero_periodo) || [])].length
        
        // Días únicos por período
        const diasUnicosPorPeriodo = new Map<number, Set<string>>()
        sesionesData?.forEach(session => {
          const key = `${session.dia}-${session.semana}`
          if (!diasUnicosPorPeriodo.has(session.numero_periodo)) {
            diasUnicosPorPeriodo.set(session.numero_periodo, new Set())
          }
          diasUnicosPorPeriodo.get(session.numero_periodo)!.add(key)
        })

        // Total de sesiones: días únicos × periodos
        let totalSessions = 0
        diasUnicosPorPeriodo.forEach(diasSet => {
          totalSessions += diasSet.size
        })

        // Si no hay datos en organizacion_ejercicios, usar datos de ejercicios_detalles
        if (periodosUnicos === 0 && totalSessions === 0) {
          const { data: ejerciciosDetalles } = await supabase
            .from('ejercicios_detalles')
            .select('semana, dia, periodo')
            .eq('activity_id', activityId)
            .not('semana', 'is', null)

          if (ejerciciosDetalles && ejerciciosDetalles.length > 0) {
            const diasUnicos = new Set<string>()
            ejerciciosDetalles.forEach(ej => {
              if (ej.semana && ej.dia) {
                diasUnicos.add(`${ej.dia}-${ej.semana}`)
              }
            })
            totalSessions = diasUnicos.size
            
            const periodosUnicosDetalles = [...new Set(ejerciciosDetalles.map(ej => ej.periodo).filter(Boolean))].length
            if (periodosUnicosDetalles > 0) {
              totalSessions *= periodosUnicosDetalles
            }
          }
        }

        fitnessData[activityId] = {
          exercisesCount: ejerciciosCount,
          totalSessions,
          periods: periodosUnicos
        }
      } catch (error) {
        console.error(`Error calculando estadísticas para actividad ${activityId}:`, error)
        fitnessData[activityId] = {
          exercisesCount: 0,
          totalSessions: 0,
          periods: 0
        }
      }
    }
    // Formatear las actividades
    const formattedActivities = activities.map((activity: any) => {
      const rating = ratingsData[activity.id] || { avg_rating: 0, total_reviews: 0 }
      const coach = coachesData[activity.coach_id] || null
      const fitness = fitnessData[activity.id] || { exercisesCount: 0, totalSessions: 0 }
      return {
        ...activity,
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
    // console.log(`✅ Encontradas ${formattedActivities.length} actividades.`)
    // console.log("📊 Ejemplo de datos de rating:", {
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
