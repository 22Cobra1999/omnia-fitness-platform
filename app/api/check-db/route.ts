import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET() {
  try {
    // console.log("🔍 GET /api/check-db - Checking database tables")
    const supabaseAdmin = await getSupabaseAdmin()
    // Test connection
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
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
    console.error("Error in check-db route:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Database connection failed",
      details: error 
    }, { status: 500 })
  }
}
