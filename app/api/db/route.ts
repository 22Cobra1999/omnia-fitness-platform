import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET() {
  try {
    // console.log("🔍 GET /api/db - Testing database connection")
    const supabaseAdmin = await getSupabaseAdmin()
    // Test connection
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("count")
      .limit(1)
    if (error) {
      throw error
    }
    return NextResponse.json({
      success: true, 
      message: "Database connection successful",
      data 
    })
  } catch (error) {
    console.error("Error in db route:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Database connection failed",
      details: error 
    }, { status: 500 })
  }
}
