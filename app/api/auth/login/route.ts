import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
// Optimizar la función POST para hacerla más eficiente
export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    console.log("[SERVER] Login attempt for:", email)
    // Optimización: Verificación rápida para entorno de desarrollo
    if (process.env.NODE_ENV === "development" && email === "demo@example.com" && password === "demo123") {
      console.log("[SERVER] Using mock user for development")
      // Return mock user data immediately without database calls
      return NextResponse.json(
        {
          user: {
            id: "mock-user-id",
            email: "demo@example.com",
            name: "Demo User",
            avatar_url: null,
            level: role || "client",
          },
          token: "mock-token-for-development",
        },
        { status: 200 },
      )
    }
    // Create a Supabase client specifically for this API route
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }
    const supabase = createClient(supabaseUrl, supabaseKey)
    // Sign in with Supabase auth - optimizado para ser más rápido
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error("[SERVER] Sign in error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!data.user) {
      console.error("[SERVER] No user returned from Supabase")
      return NextResponse.json({ error: "Authentication failed - no user" }, { status: 401 })
    }
    console.log("[SERVER] Login successful for:", email)
    // Optimización: Hacer el registro de seguridad en segundo plano sin esperar
    supabase
      .from("user_security_logs")
      .insert([
        {
          user_id: data.user.id,
          event_type: "login",
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
          details: { email },
          created_at: new Date().toISOString(),
        },
      ])
      .then(() => {
        console.log("[SERVER] Security log created")
      })
      .catch((logError) => {
        console.error("[SERVER] Error logging security event:", logError)
      })
    // Get basic user data
    const userData = {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name || null,
      avatar_url: data.user.user_metadata?.avatar_url || null,
      level: data.user.user_metadata?.role || data.user.app_metadata?.role || role || "client",
    }
    // IMPORTANTE: Verificar si el usuario tiene un registro en la tabla clients
    // Si no existe y el rol es "client", crear uno automáticamente
    if (userData.level === "client") {
      const { data: existingClient } = await supabase.from("clients").select("id").eq("id", data.user.id).maybeSingle()
      if (!existingClient) {
        console.log("[SERVER] Creating client record for user:", data.user.id)
        // Obtener datos del perfil de usuario si existen
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("user_id", data.user.id)
          .maybeSingle()
        // Crear el registro en la tabla clients
        await supabase
          .from("clients")
          .insert({
            id: data.user.id,
            full_name: userProfile?.full_name || userData.name || "Cliente",
            email: userData.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .catch((error) => {
            console.error("[SERVER] Error creating client record:", error)
          })
      }
    }
    // Optimización: Verificar si se necesita el perfil completo o si podemos usar datos básicos
    if (role && userData.level !== role) {
      // Verificar si el usuario tiene un perfil con el rol especificado
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("preferences")
        .eq("user_id", data.user.id)
        .single()
      if (profileData && profileData.preferences?.role && profileData.preferences.role !== role) {
        return NextResponse.json(
          {
            error: {
              type: "role_mismatch",
              actualRole: profileData.preferences.role,
            },
          },
          { status: 403 },
        )
      }
    }
    // Create a JWT token for the user - simplificado
    const token = Buffer.from(
      JSON.stringify({
        sub: userData.id,
        email: userData.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
      }),
    ).toString("base64")
    // Create response with the token
    const response = NextResponse.json({ user: userData }, { status: 200 })
    // Set an auth cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    })
    return response
  } catch (error: any) {
    console.error("[SERVER] Unexpected server-side login error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
