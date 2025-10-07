import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export async function GET(request: Request) {
  try {
    // Get the auth token from the cookie
    const cookieHeader = request.headers.get("cookie") || ""
    const authToken = cookieHeader
      .split(";")
      .find((cookie) => cookie.trim().startsWith("auth_token="))
      ?.split("=")[1]
    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    // Create a Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }
    const supabase = createClient(supabaseUrl, supabaseKey)
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error("[SERVER] Session error:", sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 400 })
    }
    if (!sessionData.session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }
    // Get user data
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error("[SERVER] User error:", userError)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }
    if (!userData.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    // Get profile data
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .single()
    // Return user data
    return NextResponse.json({
      user: {
        id: userData.user.id,
        email: userData.user.email,
        name: userData.user.user_metadata?.name || "Usuario OMNIA",
        profile: profileData || null,
        role: userData.user.user_metadata?.role || profileData?.preferences?.role || "client",
      },
    })
  } catch (error: any) {
    console.error("[SERVER] Unexpected server-side error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
