import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export async function GET(request: Request) {
  try {
    // Create a Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }
    const supabase = createClient(supabaseUrl, supabaseKey)
    // Get the current session
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("[SERVER] Session error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ session: data.session })
  } catch (error: any) {
    console.error("[SERVER] Unexpected server-side error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
