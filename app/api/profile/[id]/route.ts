import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
import { TABLES } from "@/lib/supabase-config"
// Function to calculate age from birth date
function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  // Validate date is valid
  if (isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
// Caché en memoria para perfiles (TTL de 5 minutos)
const profileCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    // Verificar si se solicita una respuesta rápida (para UI)
    const { searchParams } = new URL(request.url)
    const fastResponse = searchParams.get("fast") === "true"
    // Verificar caché
    const now = Date.now()
    const cachedProfile = profileCache.get(userId)
    // Si se solicita respuesta rápida y hay caché, devolverla inmediatamente
    if (fastResponse && cachedProfile && now - cachedProfile.timestamp < CACHE_TTL) {
      console.log("Returning fast cached profile for user:", userId)
      return NextResponse.json(cachedProfile.data)
    }
    // Si hay caché válida (no rápida), usarla
    if (cachedProfile && now - cachedProfile.timestamp < CACHE_TTL) {
      console.log("Returning cached profile for user:", userId)
      // Actualizar caché en segundo plano si está por expirar
      if (now - cachedProfile.timestamp > CACHE_TTL * 0.8) {
        console.log("Cache nearing expiration, refreshing in background")
        refreshProfileCache(userId).catch((e) => console.error("Error refreshing cache:", e))
      }
      return NextResponse.json(cachedProfile.data)
    }
    const supabase = createRouteHandlerClient()
    // Get user profile without requiring authentication first
    try {
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.CLIENTS)
        .select("*")
        .eq("id", userId)
        .single()
      if (profileError) {
        console.error("Profile error:", profileError)
        // Try to get user data to create a basic profile
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          // If we can't get user data, return a generic error
          if (userError) {
            console.log("User data error:", userError)
            return NextResponse.json(
              {
                error: "Profile not found and unable to create one",
              },
              { status: 404 },
            )
          }
          // Create a basic profile
          const basicProfile = {
            id: userId,
            full_name: userData.user?.user_metadata?.full_name || userData.user?.user_metadata?.name || "Usuario",
            email: userData.user?.email || "user@example.com",
            Height: 170,
            weight: 70,
            Genre: "male",
            description: "Soy @ y me gusta...",
            birth_date: null,
            fitness_goals: [],
            health_conditions: [],
            activity_level: "Beginner",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          // Try to create a basic profile
          const { data: newProfile, error: insertError } = await supabase
            .from(TABLES.CLIENTS)
            .insert(basicProfile)
            .select()
            .single()
          if (insertError) {
            console.error("Error creating basic profile:", insertError)
            // Return basic profile even if it couldn't be saved
            const responseData = {
              ...basicProfile,
              height: basicProfile.Height,
              age: null,
            }
            // Guardar en caché
            profileCache.set(userId, { data: responseData, timestamp: now })
            return NextResponse.json(responseData)
          }
          // Calculate age
          const age = calculateAge(newProfile.birth_date)
          // Prepare response data
          const responseData = {
            ...newProfile,
            height: newProfile.Height,
            age,
          }
          // Guardar en caché
          profileCache.set(userId, { data: responseData, timestamp: now })
          // Return new profile
          return NextResponse.json(responseData)
        } catch (userError) {
          console.error("Error getting user data:", userError)
          return NextResponse.json(
            {
              error: "Profile not found and unable to create one",
            },
            { status: 404 },
          )
        }
      }
      // Calculate age
      const age = calculateAge(profile.birth_date)
      // Prepare response data
      const responseData = {
        ...profile,
        height: profile.Height,
        age,
      }
      // Guardar en caché
      profileCache.set(userId, { data: responseData, timestamp: now })
      // Return profile
      return NextResponse.json(responseData)
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
// Función para actualizar la caché en segundo plano
async function refreshProfileCache(userId: string) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.CLIENTS)
      .select("*")
      .eq("id", userId)
      .single()
    if (profileError) {
      console.error("Error refreshing profile cache:", profileError)
      return
    }
    // Calculate age
    const age = calculateAge(profile.birth_date)
    // Prepare response data
    const responseData = {
      ...profile,
      height: profile.Height,
      age,
    }
    // Actualizar caché
    profileCache.set(userId, { data: responseData, timestamp: Date.now() })
    console.log("Profile cache refreshed for user:", userId)
  } catch (error) {
    console.error("Error in background cache refresh:", error)
  }
}
// Update PUT function to handle arrays correctly
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const supabase = createRouteHandlerClient()
    let data
    try {
      data = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    // Process data to ensure correct format
    const processedData = { ...data }
    // Ensure fitness_goals and health_conditions are arrays of strings
    if (processedData.fitness_goals && Array.isArray(processedData.fitness_goals)) {
      // If they're objects, extract only the text
      if (processedData.fitness_goals.length > 0 && typeof processedData.fitness_goals[0] === "object") {
        processedData.fitness_goals = processedData.fitness_goals.map((goal: any) =>
          typeof goal === "object" && goal.text ? goal.text : goal,
        )
      }
    }
    if (processedData.health_conditions && Array.isArray(processedData.health_conditions)) {
      // If they're objects, extract only the type
      if (processedData.health_conditions.length > 0 && typeof processedData.health_conditions[0] === "object") {
        processedData.health_conditions = processedData.health_conditions.map((condition: any) =>
          typeof condition === "object" && condition.type ? condition.type : condition,
        )
      }
    }
    // Prepare data for update
    const updateData = {
      ...processedData,
      Height: data.height, // Use Height instead of height for database
      updated_at: new Date().toISOString(),
    }
    // Remove height to avoid conflicts
    if (updateData.height) {
      delete updateData.height
    }
    // Update profile
    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from(TABLES.CLIENTS)
        .update(updateData)
        .eq("id", userId)
        .select()
        .single()
      if (updateError) {
        console.error("Update error:", updateError)
        // If profile doesn't exist, create it
        if (updateError.code === "PGRST116") {
          const { data: userData } = await supabase.auth.getUser()
          const newProfileData = {
            id: userId,
            ...processedData,
            Height: data.height,
            full_name: userData.user?.user_metadata?.full_name || userData.user?.user_metadata?.name || "Usuario",
            email: userData.user?.email || "user@example.com",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          // Remove height to avoid conflicts
          if (newProfileData.height) {
            delete newProfileData.height
          }
          const { data: newProfile, error: insertError } = await supabase
            .from(TABLES.CLIENTS)
            .insert(newProfileData)
            .select()
            .single()
          if (insertError) {
            console.error("Error creating profile:", insertError)
            return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
          }
          // Calculate age
          const age = calculateAge(newProfile.birth_date)
          // Prepare response data
          const responseData = {
            ...newProfile,
            height: newProfile.Height,
            age,
          }
          // Actualizar caché
          profileCache.set(userId, { data: responseData, timestamp: Date.now() })
          // Return new profile
          return NextResponse.json(responseData)
        }
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
      }
      // Calculate age
      const age = calculateAge(updatedProfile.birth_date)
      // Prepare response data
      const responseData = {
        ...updatedProfile,
        height: updatedProfile.Height,
        age,
      }
      // Actualizar caché
      profileCache.set(userId, { data: responseData, timestamp: Date.now() })
      // Return updated profile
      return NextResponse.json(responseData)
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
