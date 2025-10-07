import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const coachId = resolvedParams.id
    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 })
    }
    const supabaseAdmin = await getSupabaseAdmin()
    // Obtener actividades del coach
    const { data: activities, error } = await supabaseAdmin
      .from("activities")
      .select(`
        *,
        activity_media!fk_activity_media_activity_id(*),
        // activity_program_info no existe en el nuevo esquema
        activity_consultation_info!fk_activity_consultation_info_activity_id(*),
        activity_availability!fk_activity_availability_activity_id(*),
        activity_tags!fk_activity_tags_activity_id(*)
      `)
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
    if (error) {
      throw error
    }
    if (!activities || activities.length === 0) {
      return NextResponse.json([])
    }
    // Obtener datos de fitness (ejercicios y sesiones) como en activities/search
    const activityIds = activities.map(a => a.id)
    const { data: fitnessData, error: fitnessError } = await supabaseAdmin
      .from("organizacion_ejercicios")
      .select("activity_id")
      .in("activity_id", activityIds)
    if (fitnessError) {
      console.error("Error fetching fitness data:", fitnessError)
    }
    // Contar ejercicios y sesiones por actividad
    const fitnessCounts = new Map()
    if (fitnessData) {
      fitnessData.forEach(fitness => {
        const activityId = fitness.activity_id
        if (!fitnessCounts.has(activityId)) {
          fitnessCounts.set(activityId, { exercisesCount: 0, totalSessions: 0 })
        }
        const current = fitnessCounts.get(activityId)
        current.exercisesCount++
        // Asumir que cada ejercicio es una sesión por ahora
        current.totalSessions++
      })
    }
    // Obtener ratings de actividades
    const { data: ratingsData, error: ratingsError } = await supabaseAdmin
      .from("activity_stats_view")
      .select("activity_id, avg_rating, total_reviews")
      .in("activity_id", activityIds)
    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError)
    }
    const ratingsMap = new Map()
    if (ratingsData) {
      ratingsData.forEach(rating => {
        ratingsMap.set(rating.activity_id, {
          avg_rating: rating.avg_rating,
          total_reviews: rating.total_reviews
        })
      })
    }
    // Flatten the data structure with real values
    const flattenedActivities = activities.map((activity) => {
      const fitness = fitnessCounts.get(activity.id) || { exercisesCount: 0, totalSessions: 0 }
      const rating = ratingsMap.get(activity.id) || { avg_rating: 0, total_reviews: 0 }
      return {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        difficulty: activity.difficulty,
        price: activity.price,
        coach_id: activity.coach_id,
        is_public: activity.is_public,
        created_at: activity.created_at,
        updated_at: activity.updated_at,
        // Media info
        image_url: activity.activity_media?.[0]?.image_url || null,
        video_url: activity.activity_media?.[0]?.video_url || null,
        vimeo_id: activity.activity_media?.[0]?.vimeo_id || null,
        // Program info - usar valores reales
        totalSessions: fitness.totalSessions,
        exercisesCount: fitness.exercisesCount,
        // Workshop specific
        sessions_per_client: activity.activity_consultation_info?.[0]?.videocall_duration || null,
        workshop_type: activity.activity_consultation_info?.[0]?.includes_videocall ? 'Individual' : 'Grupal',
        modality: activity.activity_consultation_info?.[0]?.includes_message ? 'Online' : 'Presencial',
        // Rating fields - usar valores reales
        program_rating: rating.avg_rating || null,
        total_program_reviews: rating.total_reviews || 0,
        // Coach info needed by ActivityCard
        coach_name: 'Coach', // Default value since we don't have coach name in this context
        coach_avatar_url: null, // Default value since we don't have coach avatar in this context
        // Tags
        tags: activity.activity_tags || [],
      }
    })
    return NextResponse.json(flattenedActivities)
  } catch (error) {
    console.error("Error fetching coach activities:", error)
    return NextResponse.json({ error: "Failed to fetch coach activities" }, { status: 500 })
  }
}
