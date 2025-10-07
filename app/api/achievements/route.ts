import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET() {
  try {
    // console.log("🔍 GET /api/achievements - Obteniendo logros")
    const supabaseAdmin = await getSupabaseAdmin()
      const { data: achievements, error } = await supabaseAdmin
        .from("achievements")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      throw error
    }
    return NextResponse.json(achievements || [])
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, icon, criteria, points } = body
    if (!name) {
      return NextResponse.json({ error: "Achievement name is required" }, { status: 400 })
    }
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: newAchievement, error } = await supabaseAdmin
      .from("achievements")
      .insert({
        name,
        description,
        icon,
        criteria,
        points,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      throw error
    }
    return NextResponse.json(newAchievement, { status: 201 })
  } catch (error) {
    console.error("Error creating achievement:", error)
    return NextResponse.json({ error: "Failed to create achievement" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Achievement ID is required" }, { status: 400 })
    }
    const body = await request.json()
    body.updated_at = new Date().toISOString()
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: updatedAchievement, error } = await supabaseAdmin
      .from("achievements")
      .update(body)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }
    return NextResponse.json(updatedAchievement)
  } catch (error) {
    console.error("Error updating achievement:", error)
    return NextResponse.json({ error: "Failed to update achievement" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Achievement ID is required" }, { status: 400 })
    }
    // Check if achievement is earned by any users
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: userAchievements, error: checkError } = await supabaseAdmin
      .from("user_achievements")
      .select("id")
      .eq("achievement_id", id)
    if (checkError) {
      console.error("Error checking user achievements:", checkError)
    }
    if (userAchievements && userAchievements.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete achievement that has been earned by users" },
        { status: 400 },
      )
    }
    // Delete the achievement
    const { data: deletedAchievement, error } = await supabaseAdmin
      .from("achievements")
      .delete()
      .eq("id", id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Achievement deleted successfully" })
  } catch (error) {
    console.error("Error deleting achievement:", error)
    return NextResponse.json({ error: "Failed to delete achievement" }, { status: 500 })
  }
}
