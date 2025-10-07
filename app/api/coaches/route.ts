import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET() {
  try {
    // console.log("🔍 GET /api/coaches - Obteniendo todos los coaches")
    const supabaseAdmin = await getSupabaseAdmin()
    // Get all coaches
    const { data: coaches, error } = await supabaseAdmin
      .from("coaches")
      .select("*") // Select all from coaches first
      .order("created_at", { ascending: false })
    if (error) {
      throw error
    }
    // Fetch user profiles separately and map them to coaches
    const coachIds = coaches.map((coach) => coach.id)
    const { data: userProfiles, error: userProfilesError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .in("id", coachIds) // Assuming user_profile.id matches coach.id
    if (userProfilesError) {
      console.error("Error fetching user profiles for coaches:", userProfilesError)
    }
    const userProfileMap = new Map(userProfiles?.map((profile) => [profile.id, profile]))
    // Get coach stats for all coaches
    const { data: coachStats, error: statsError } = await supabaseAdmin
      .from("coach_stats_view")
      .select("coach_id, avg_rating, total_reviews")
      .in("coach_id", coachIds)
    // console.log("🔍 Coach stats from coach_stats_view:", { coachStats, statsError, coachIds })
    const statsMap = new Map()
    if (!statsError && coachStats) {
      coachStats.forEach((stat) => {
        statsMap.set(stat.coach_id, stat)
      })
    }
    const formattedCoaches = coaches.map((coach) => {
      const userProfile = userProfileMap.get(coach.id) // Get corresponding user profile
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
        // Additional fields for the new card design
        experienceYears: coach.experience_years || 0,
        certifications: coach.certifications || [],
        hourlyRate: coach.hourly_rate || 0,
        bio: coach.bio || null,
      }
    })
    return NextResponse.json(formattedCoaches || [])
  } catch (error) {
    console.error("Error fetching coaches:", error)
    return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    // console.log("🚀 POST /api/coaches - Creando nueva actividad")
    const body = await request.json()
    const {
      name,
      avatar,
      user_id,
      specialization,
      experience_years,
      certifications,
      hourly_rate,
      rating,
      total_reviews,
      instagram,
      whatsapp,
    } = body
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Coach name is required" }, { status: 400 })
    }
    // Create coach
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: newCoach, error } = await supabaseAdmin
      .from("coaches")
      .insert({
        name,
        avatar,
        specialization,
        experience_years,
        certifications,
        hourly_rate,
        rating,
        total_reviews,
        instagram,
        whatsapp,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      throw error
    }
    // Link to user if provided
    if (user_id && newCoach) {
      // Update user level to coach and link coach_id to user_profiles
      const { error: updateError } = await supabaseAdmin
        .from("user_profiles")
        .update({ level: "coach", coach_id: newCoach.id, updated_at: new Date().toISOString() })
        .eq("id", user_id) // Assuming user_id here is the user_profile.id
      if (updateError) {
        console.error("Error updating user level and linking coach_id:", updateError)
      }
    }
    return NextResponse.json(newCoach, { status: 201 })
  } catch (error) {
    console.error("Error creating coach:", error)
    return NextResponse.json({ error: "Failed to create coach" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 })
    }
    const body = await request.json()
    body.updated_at = new Date().toISOString()
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: updatedCoach, error } = await supabaseAdmin
      .from("coaches")
      .update(body)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 })
    }
    return NextResponse.json(updatedCoach)
  } catch (error) {
    console.error("Error updating coach:", error)
    return NextResponse.json({ error: "Failed to update coach" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 })
    }
    // First, get the user_id associated with this coach from user_profiles
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: userProfile, error: userProfileError } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("coach_id", id)
      .single()
    if (userProfileError && userProfileError.code !== "PGRST116") {
      console.error("Error fetching user profile for coach:", userProfileError)
    }
    // Delete the coach
    const { data: deletedCoach, error } = await supabaseAdmin.from("coaches").delete().eq("id", id).select().single()
    if (error) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 })
    }
    // Update the user level if there was an associated user profile
    if (userProfile && userProfile.id) {
      const { error: updateError } = await supabaseAdmin
        .from("user_profiles")
        .update({ level: "client", coach_id: null, updated_at: new Date().toISOString() })
        .eq("id", userProfile.id)
      if (updateError) {
        console.error("Error updating user level:", updateError)
      }
    }
    return NextResponse.json({ message: "Coach deleted successfully" })
  } catch (error) {
    console.error("Error deleting coach:", error)
    return NextResponse.json({ error: "Failed to delete coach" }, { status: 500 })
  }
}
