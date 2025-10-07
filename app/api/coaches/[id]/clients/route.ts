import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get("coach_id")
    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 })
    }
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: clients, error } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("coach_id", coachId)
      .eq("level", "client")
    if (error) {
      throw error
    }
    return NextResponse.json(clients || [])
  } catch (error) {
    console.error("Error fetching coach clients:", error)
    return NextResponse.json({ error: "Failed to fetch coach clients" }, { status: 500 })
  }
}
