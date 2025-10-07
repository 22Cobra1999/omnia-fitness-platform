"use server"

import { createClient } from "@supabase/supabase-js"

export async function setupDatabase() {
  try {
    // Create a Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create the necessary tables
    const { error: usersError } = await supabase.rpc("create_users_table")

    if (usersError) {
      console.error("Error creating users table:", usersError)
      return { success: false, error: usersError.message }
    }

    // Create user profiles table
    const { error: profilesError } = await supabase.rpc("create_profiles_table")

    if (profilesError) {
      console.error("Error creating profiles table:", profilesError)
      return { success: false, error: profilesError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error setting up database:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
