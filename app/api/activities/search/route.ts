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
    .neq('borrada', true)

    // Por defecto, las consultas no son "productos": se muestran solo en la sección Café.
    // Evitamos que aparezcan en search/listados generales.
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
    const formattedActivities = filteredActivities.map((activity: any) => {
      const rating = ratingsData[activity.id] || { avg_rating: 0, total_reviews: 0 }
      const coach = coachesData[activity.coach_id] || null

      // Parsear objetivos desde workshop_type si existe
      let objetivos = []
      if (activity.workshop_type) {
        try {
          const parsed = typeof activity.workshop_type === 'string' 
            ? JSON.parse(activity.workshop_type) 
            : activity.workshop_type
          if (parsed?.objetivos) {
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

      // Usar directamente las columnas pre-calculadas de la base de datos
      const exercisesCount = activity.items_unicos || 0
      const totalSessions = activity.sesiones_dias_totales || 0
      const weeks = activity.semanas_totales || 0

      return {
        ...activity,
        objetivos,
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
        program_rating: rating.avg_rating || 0,
        total_program_reviews: rating.total_reviews || 0,
        exercisesCount,
        totalSessions,
        semanas_totales: weeks
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
