import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from '@/lib/config/db'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'


export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const supabase = await createRouteHandlerClient()
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

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
      .select("id, full_name, avatar_url, role")
      .in("id", coachIds)

    if (userProfilesError) {
      console.error("Error fetching user profiles for coaches:", userProfilesError)
    }

    const userProfileMap = new Map(userProfiles?.map((profile) => [profile.id, profile]))

    // Get ALL activities for these coaches (needed for total sales history)
    const { data: allActivities, error: activitiesError } = await supabaseAdmin
      .from("activities")
      .select("id, coach_id, type, is_active")
      .in("coach_id", coachIds)

    const productCountMap = new Map<string, number>()
    const allActivityIds: string[] = [] // For sales

    // Quick lookup map
    const activityToCoachMap = new Map<string, string>()

    if (!activitiesError && allActivities) {
      allActivities.forEach((activity) => {
        // Map activity to coach for sales lookup
        activityToCoachMap.set(activity.id, activity.coach_id)
        allActivityIds.push(activity.id)

        // For Product Count: Only Active + NOT Consultation
        if (activity.is_active && activity.type !== 'consultation') {
          const currentCount = productCountMap.get(activity.coach_id) || 0
          productCountMap.set(activity.coach_id, currentCount + 1)
        }
      })
    }

    // Get sales (enrollments) count based on ALL activities (historical included)
    // We only care about count per coach.
    const { data: enrollmentData } = await supabaseAdmin
      .from("activity_enrollments")
      .select("activity_id")
      .in("activity_id", allActivityIds)

    const salesCountMap = new Map<string, number>()

    if (enrollmentData) {
      enrollmentData.forEach((enrollment) => {
        const coachId = activityToCoachMap.get(enrollment.activity_id)
        if (coachId) {
          const currentSales = salesCountMap.get(coachId) || 0
          salesCountMap.set(coachId, currentSales + 1)
        }
      })
    }

    // Get certifications for all coaches (since coaches table's certifications column seems empty)
    const { data: certificationsData, error: certsError } = await supabaseAdmin
      .from("coach_certifications")
      .select("coach_id, name, issuer, year")
      .in("coach_id", coachIds)

    const certificationsMap = new Map<string, string[]>()

    if (!certsError && certificationsData) {
      certificationsData.forEach((cert) => {
        const issuer = cert.issuer ? ` - ${cert.issuer}` : ''
        const year = cert.year ? ` (${cert.year})` : ''
        const formattedCert = `${cert.name || 'Certificación'}${issuer}${year}`

        const currentCerts = certificationsMap.get(cert.coach_id) || []
        currentCerts.push(formattedCert)
        certificationsMap.set(cert.coach_id, currentCerts)
      })
    }

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

    const formattedCoaches = coaches
      .map((coach) => {
        const userProfile = userProfileMap.get(coach.id)
        const coachStat = statsMap.get(coach.id)

        // Only include if the user profile role is 'coach'
        if (userProfile && (userProfile as any).role !== 'coach' && (userProfile as any).role !== undefined) {
          // If role is explicitly something else, we might want to skip, 
          // but wait, the API as it was didn't even have 'role' in the select.
          // Let's add 'role' to the select first.
        }

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
          name: userProfile?.full_name || coach.full_name,
          specialty: specialty,
          specialty_detail: specialtyDetail,
          full_name: userProfile?.full_name || coach.full_name,
          avatar_url: userProfile?.avatar_url || null,
          role: (userProfile as any)?.role,
          description: coach.bio || coach.specialization || "Fitness Coach",
          rating: coachStat?.avg_rating || 0,
          total_reviews: coachStat?.total_reviews || 0,
          total_products: productCountMap.get(coach.id) || 0,
          total_sessions: salesCountMap.get(coach.id) || 0, // Using total_sessions field for "Sales"
          experienceYears: coach.experience_years || 0,
          experience_years: coach.experience_years || 0,
          certifications: certificationsMap.get(coach.id) || coach.certifications || [],
          hourlyRate: coach.hourly_rate || 0,
          bio: coach.bio || null,

        }
      })
      .filter(coach => {
        const userProfile = userProfileMap.get(coach.id)
        if (!userProfile) {
          console.log(`[SearchCoaches] ❌ Excluded ${coach.id}: No user profile found`)
          return false
        }

        const rawRole = (userProfile as any).role
        const role = typeof rawRole === 'string' ? rawRole.trim().toLowerCase() : ''
        const isCoach = role === 'coach'

        if (!isCoach) {
          console.log(`[SearchCoaches] ❌ Excluded ${userProfile.full_name || coach.id}: Role is '${rawRole}' (normalized: '${role}'), expected 'coach'`)
        } else {
          // console.log(`[SearchCoaches] ✅ Included ${userProfile.full_name}: Role is '${rawRole}'`)
        }

        // STRICT CHECK: Must have a user profile and role MUST be 'coach'
        return isCoach
      })

    const filteredCoaches = formattedCoaches.filter(coach => coach.id !== currentUserId)

    return NextResponse.json(filteredCoaches || [])
  } catch (error) {
    console.error("Error fetching coaches:", error)
    return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 })
  }
}
