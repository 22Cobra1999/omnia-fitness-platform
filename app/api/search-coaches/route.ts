import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET(request: Request) {
  try {
    console.log("API search-coaches: Iniciando procesamiento de solicitud")
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 10
    console.log("API: Fetching coaches...")
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Get coaches from both coaches table and user_profiles table
    let allCoaches = []
    // First, try to get coaches from the coaches table
    const { data: coachesFromTable, error: coachesError } = await supabase
      .from("coaches")
      .select("id, full_name, specialization, experience_years, certifications, hourly_rate, bio")
      .limit(limit)
      // Removido el filtro .is("client_id", null) que causaba errores 400
    if (!coachesError && coachesFromTable) {
      // console.log('🔍 Coaches from coaches table:', coachesFromTable)
      allCoaches = coachesFromTable.map(coach => ({
        ...coach,
        source: 'coaches_table'
      }))
    } else {
      console.log('❌ Error getting coaches from coaches table:', coachesError)
    }
    // Then, get coaches from user_profiles table where role = 'coach'
    const { data: coachesFromProfiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "coach")
      .ilike("full_name", `%${query}%`)
      .limit(limit)
    if (!profilesError && coachesFromProfiles) {
      // console.log('🔍 Coaches from user_profiles:', coachesFromProfiles)
      const profileCoaches = coachesFromProfiles.map(coach => ({
        ...coach,
        source: 'user_profiles'
      }))
      allCoaches = [...allCoaches, ...profileCoaches]
    } else {
      console.log('❌ Error getting coaches from user_profiles:', profilesError)
    }
    // Remove duplicates and limit results
    const uniqueCoaches = allCoaches
      .filter((coach, index, self) => index === self.findIndex(c => c.id === coach.id))
      .slice(0, limit)
    console.log(`API: Found ${uniqueCoaches.length} coaches (${coachesFromTable?.length || 0} from coaches table, ${coachesFromProfiles?.length || 0} from user_profiles)`)
    const coaches = uniqueCoaches
    const error = coachesError || profilesError
    console.log(`API: Raw coaches data:`, coaches)
    console.log(`API: Error from database:`, error)
    // Don't fail the entire API if there's an error, just log it
    if (error) {
      console.error("Error in search-coaches API:", error)
      // Continue processing even if there's an error
    }
    console.log(`API: Found ${coaches?.length || 0} coaches, fetching details...`)
    // console.log('🔍 All coaches data:', coaches)
    if (!coaches || coaches.length === 0) {
      console.log("API: No coaches found in database, returning empty array")
      return NextResponse.json([])
    }
    // Get activities count and stats for each coach
    const coachesWithDetails = await Promise.all(
      coaches.map(async (coach) => {
        // Get coach activities count
        const { count: activitiesCount } = await supabase
            .from("activities")
          .select("*", { count: "exact", head: true })
            .eq("coach_id", coach.id)
        // Get coach stats from coach_stats_view
        const { data: coachStats, error: statsError } = await supabase
          .from("coach_stats_view")
          .select("avg_rating, total_reviews")
          .eq("coach_id", coach.id)
          .single()
        // console.log(`🔍 Coach stats for ${coach.id}:`, { coachStats, statsError })
        // Always try to get avatar_url from user_profiles for coaches from coaches table
        let coachName = coach.full_name
        let coachAvatar = coach.avatar_url
        if (coach.source === 'coaches_table') {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("full_name, avatar_url")
            .eq("id", coach.id)
            .single()
          if (userProfile) {
            // Use full_name from user_profiles if coach doesn't have one, otherwise keep the original
            if (!coachName) {
              coachName = userProfile.full_name
            }
            // Always try to get avatar_url from user_profiles
            coachAvatar = userProfile.avatar_url
          }
        }
        // Use the actual specialization from the database
        let specialty = "Fitness"
        let specialtyDetail = "General Fitness"
        if (coach.specialization) {
          // Use the actual specialization string from the database
          specialty = coach.specialization
          specialtyDetail = coach.specialization
        }
        const coachData = {
          id: coach.id,
          name: coachName,
          full_name: coachName, // Agregar full_name para compatibilidad
          specialty: specialty,
          specialtyDetail: specialtyDetail,
          avatar: coachAvatar || null,
          avatar_url: coachAvatar || null, // Agregar avatar_url para compatibilidad
          description: coach.bio || coach.specialization || "Fitness Coach",
          rating: coachStats?.avg_rating || 0,
          totalReviews: coachStats?.total_reviews || 0,
          activities: activitiesCount || 0,
          verified: true, // Assuming all coaches are verified
          isLive: false, // Default to false
          // New fields from coaches table
          experienceYears: coach.experience_years || 0,
          certifications: coach.certifications || [],
          hourlyRate: coach.hourly_rate || 0,
          bio: coach.bio || null,
        }
        // console.log(`🔍 Final coach data for ${coach.id}:`, coachData)
        return coachData
      }),
    )
    console.log(`API: Successfully processed ${coachesWithDetails.length} coaches`)
    return NextResponse.json(coachesWithDetails)
  } catch (error) {
    console.error("Error in search-coaches API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
