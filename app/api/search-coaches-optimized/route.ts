import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Cache en memoria para coaches con TTL más largo
const COACHES_CACHE = new Map<string, { data: any[]; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos
const BACKGROUND_REFRESH_THRESHOLD = 8 * 60 * 1000 // 8 minutos para refresh en background

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10
    const fastResponse = searchParams.get("fast") === "true"

    // Generar clave de cache única
    const cacheKey = `coaches_${query}_${limit}`
    
    const now = Date.now()
    const cachedCoaches = COACHES_CACHE.get(cacheKey)

    // Respuesta rápida desde cache si está disponible
    if (fastResponse && cachedCoaches && now - cachedCoaches.timestamp < CACHE_TTL) {
      console.log(`⚡ [COACHES] Fast cache hit for: ${cacheKey}`)
      return NextResponse.json(cachedCoaches.data)
    }

    // Si hay cache válida, usarla y refrescar en background si es necesario
    if (cachedCoaches && now - cachedCoaches.timestamp < CACHE_TTL) {
      console.log(`📦 [COACHES] Returning cached data for: ${cacheKey}`)
      
      // Refrescar en background si está cerca de expirar
      if (now - cachedCoaches.timestamp > BACKGROUND_REFRESH_THRESHOLD) {
        console.log(`🔄 [COACHES] Background refresh for: ${cacheKey}`)
        refreshCoachesCache(cacheKey, query, limit)
          .catch(e => console.error("Background refresh error:", e))
      }
      
      return NextResponse.json(cachedCoaches.data)
    }

    // Cache miss - cargar datos frescos
    console.log(`🔄 [COACHES] Cache miss - fetching fresh data for: ${cacheKey}`)
    const startTime = performance.now()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query optimizado con una sola consulta usando UNION
    const { data: coaches, error } = await supabase.rpc('get_all_coaches_optimized', {
      search_query: query,
      limit_count: limit
    })

    if (error) {
      console.error("❌ Error al obtener coaches:", error)
      
      // Fallback a queries separadas si la función RPC no existe
      console.log("🔄 Fallback to separate queries...")
      const fallbackCoaches = await getCoachesFallback(supabase, query, limit)
      return NextResponse.json(fallbackCoaches)
    }

    const endTime = performance.now()
    console.log(`✅ [COACHES] Loaded ${coaches?.length || 0} coaches in ${(endTime - startTime).toFixed(2)}ms`)

    // Cachear los datos
    COACHES_CACHE.set(cacheKey, {
      data: coaches || [],
      timestamp: now
    })

    return NextResponse.json(coaches || [])

  } catch (error) {
    console.error("❌ [COACHES] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    )
  }
}

// Función de fallback para obtener coaches con queries separadas
async function getCoachesFallback(supabase: any, query: string, limit: number) {
  console.log("🔄 [COACHES] Using fallback method...")
  
  // Obtener coaches de ambas tablas en paralelo
  const [coachesFromTable, coachesFromProfiles] = await Promise.all([
    supabase
      .from("coaches")
      .select("id, full_name, specialization, experience_years, certifications, hourly_rate, bio")
      .limit(limit),
    supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "coach")
      .ilike("full_name", `%${query}%`)
      .limit(limit)
  ])

  let allCoaches = []
  
  if (!coachesFromTable.error && coachesFromTable.data) {
    allCoaches = coachesFromTable.data.map((coach: any) => ({
      ...coach,
      source: 'coaches_table'
    }))
  }

  if (!coachesFromProfiles.error && coachesFromProfiles.data) {
    const profileCoaches = coachesFromProfiles.data.map((coach: any) => ({
      ...coach,
      source: 'user_profiles'
    }))
    allCoaches = [...allCoaches, ...profileCoaches]
  }

  // Remover duplicados y limitar resultados
  const uniqueCoaches = allCoaches
    .filter((coach, index, self) => index === self.findIndex(c => c.id === coach.id))
    .slice(0, limit)

  // Obtener estadísticas en paralelo para todos los coaches
  const coachesWithStats = await Promise.all(
    uniqueCoaches.map(async (coach) => {
      // Obtener actividades y estadísticas en paralelo
      const [activitiesCount, coachStats] = await Promise.all([
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", coach.id),
        supabase
          .from("coach_stats_view")
          .select("avg_rating, total_reviews")
          .eq("coach_id", coach.id)
          .single()
      ])

      return {
        id: coach.id,
        name: coach.full_name || "Coach",
        full_name: coach.full_name || "Coach",
        avatar_url: coach.avatar_url || "/placeholder.svg?height=200&width=200&query=coach",
        specialization: coach.specialization || "General",
        specialty: coach.specialization || "General",
        experience_years: coach.experience_years || 0,
        experienceYears: coach.experience_years || 0,
        certifications: coach.certifications || [],
        activities: activitiesCount.count || 0,
        products_count: activitiesCount.count || 0,
        rating: coachStats.data?.avg_rating || 0,
        total_reviews: coachStats.data?.total_reviews || 0,
        totalReviews: coachStats.data?.total_reviews || 0,
        bio: coach.bio || null,
        verified: true,
        isLive: false,
        source: coach.source
      }
    })
  )

  return coachesWithStats
}

// Función para refrescar cache en background
async function refreshCoachesCache(cacheKey: string, query: string, limit: number) {
  try {
    console.log(`🔄 [COACHES] Background refresh for: ${cacheKey}`)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: coaches, error } = await supabase.rpc('get_all_coaches_optimized', {
      search_query: query,
      limit_count: limit
    })

    if (!error && coaches) {
      COACHES_CACHE.set(cacheKey, {
        data: coaches,
        timestamp: Date.now()
      })
      console.log(`✅ [COACHES] Background refresh completed for: ${cacheKey}`)
    }
  } catch (error) {
    console.error(`❌ [COACHES] Background refresh failed for: ${cacheKey}`, error)
  }
}




























