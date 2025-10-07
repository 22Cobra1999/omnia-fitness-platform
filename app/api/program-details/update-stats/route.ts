import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function POST(req: NextRequest) {
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { detailId, type, stats } = await req.json()
  if (!detailId || !type || !stats) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  try {
    let tableName: string
    if (type === "fitness") {
      tableName = "fitness_exercises"
    } else if (type === "nutrition") {
      tableName = "nutrition_program_details"
    } else {
      return NextResponse.json({ error: "Invalid program type" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from(tableName)
      .update({ ...stats, updated_at: new Date().toISOString() })
      .eq("id", detailId)
      .eq("client_id", user.id) // Ensure only the client's own record is updated
      .select()
      .single()
    if (error) {
      console.error(`Error updating ${type} program details:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Unexpected error updating program details:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
