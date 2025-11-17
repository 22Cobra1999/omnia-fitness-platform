import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from '@/lib/config/db'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    
    // Get all coaches
    const { data: coaches, error } = await supabaseAdmin
      .from("coaches")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) {
      throw error
    }
    
    // Fetch user profiles separately and map them to coaches
    const coachIds = coaches.map((coach) => coach.id)
    const { data: userProfiles, error: userProfilesError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .in("id", coachIds)
    
    if (userProfilesError) {
      console.error("Error fetching user profiles for coaches:", userProfilesError)
    }
    
    const userProfileMap = new Map(userProfiles?.map((profile) => [profile.id, profile]))
    
    // Get coach stats for all coaches
    const { data: coachStats, error: statsError } = await supabaseAdmin
      .from("coach_stats_view")
      .select("coach_id, avg_rating, total_reviews")
      .in("coach_id", coachIds)
    
    const statsMap = new Map()
    if (!statsError && coachStats) {
      coachStats.forEach((stat) => {
        statsMap.set(stat.coach_id, stat)
      })
    }
    
    const formattedCoaches = coaches.map((coach) => {
      const userProfile = userProfileMap.get(coach.id)
      const coachStat = statsMap.get(coach.id)
      
      let specialty = "fitness"
      let specialtyDetail = "General Fitness"
      if (coach.specialization) {
        if (coach.specialization.toLowerCase().includes("nutrition")) {
          specialty = "nutrition"
          specialtyDetail = "Nutrition Coach"
        } else if (
          coach.specialization.toLowerCase().includes("gym") ||
          coach.specialization.toLowerCase().includes("strength")
        ) {
          specialty = "gym"
          specialtyDetail = "Strength & Gym"
        } else if (coach.specialization.toLowerCase().includes("yoga")) {
          specialty = "yoga"
          specialtyDetail = "Yoga Instructor"
        }
      }
      
      return {
        ...coach,
        specialty: specialty,
        specialty_detail: specialtyDetail,
        full_name: userProfile?.full_name || coach.full_name,
        avatar_url: userProfile?.avatar_url || null,
        description: coach.bio || coach.specialization || "Fitness Coach",
        rating: coachStat?.avg_rating || 0,
        total_reviews: coachStat?.total_reviews || 0,
        experienceYears: coach.experience_years || 0,
        experience_years: coach.experience_years || 0,
        certifications: coach.certifications || [],
        hourlyRate: coach.hourly_rate || 0,
        bio: coach.bio || null,
        name: userProfile?.full_name || coach.full_name,
      }
    })
    
    return NextResponse.json(formattedCoaches || [])
  } catch (error) {
    console.error("Error fetching coaches:", error)
    return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 })
  }
}

