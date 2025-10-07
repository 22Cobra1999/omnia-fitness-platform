import { NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase"
export async function POST(request: Request) {
  try {
    // Parse JSON data instead of form data
    const { email, password, name, role = "client" } = await request.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }
    console.log(`[SERVER] Registering new user: ${email} with role: ${role}`)
    const supabase = getServerSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role, // This stores the role in user_metadata
        },
      },
    })
    if (error) {
      console.error("Supabase signup error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.log(`[SERVER] User registered successfully with ID: ${data.user?.id}`)
    console.log(`[SERVER] User metadata:`, data.user?.user_metadata)
    // Also create a user profile with the role
    if (data.user) {
      try {
        const { error: profileError } = await supabase.from("user_profiles").insert([
          {
            id: data.user.id,
            full_name: name,
            bio: `Hola, soy ${name}!`,
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        if (profileError) {
          console.error("[SERVER] Error creating user profile:", profileError)
        } else {
          console.log("[SERVER] User profile created with role:", role)
        }
        // IMPORTANTE: También crear un registro en la tabla clients si el rol es "client"
        if (role === "client") {
          const { error: clientError } = await supabase.from("clients").insert([
            {
              id: data.user.id,
              full_name: name,
              email: email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          if (clientError) {
            console.error("[SERVER] Error creating client record:", clientError)
          } else {
            console.log("[SERVER] Client record created for user:", data.user.id)
          }
        }
      } catch (profileError) {
        console.error("[SERVER] Exception creating user profile:", profileError)
      }
    }
    return NextResponse.json({
      message: "Check your email to confirm your account",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name,
        level: role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "An unexpected error occurred during registration" }, { status: 500 })
  }
}
