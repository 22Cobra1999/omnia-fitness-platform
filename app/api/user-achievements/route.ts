import { NextResponse } from "next/server"
import { query, insert } from "@/lib/db"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const achievementId = searchParams.get("achievement_id")
    if (userId && achievementId) {
      // Check if user has earned a specific achievement
      const userAchievement = await query(
        `
        SELECT * FROM user_achievements 
        WHERE user_id = $1 AND achievement_id = $2
      `,
        [userId, achievementId],
      )
      if (userAchievement.length === 0) {
        return NextResponse.json({ earned: false })
      }
      return NextResponse.json({
        earned: true,
        earned_at: userAchievement[0].earned_at,
      })
    }
    if (userId) {
      // Get all achievements earned by a user
      const userAchievements = await query(
        `
        SELECT ua.*, a.name, a.description, a.icon, a.color
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.earned_at DESC
      `,
        [userId],
      )
      return NextResponse.json(userAchievements)
    }
    if (achievementId) {
      // Get all users who earned a specific achievement
      const userAchievements = await query(
        `
        SELECT ua.*, u.name, u.email
        FROM user_achievements ua
        JOIN users u ON ua.user_id = u.id
        WHERE ua.achievement_id = $1
        ORDER BY ua.earned_at DESC
      `,
        [achievementId],
      )
      return NextResponse.json(userAchievements)
    }
    return NextResponse.json({ error: "User ID or Achievement ID is required" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching user achievements:", error)
    return NextResponse.json({ error: "Failed to fetch user achievements" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, achievement_id } = body
    // Validate required fields
    if (!user_id || !achievement_id) {
      return NextResponse.json({ error: "User ID and Achievement ID are required" }, { status: 400 })
    }
    // Check if user already has this achievement
    const existingAchievement = await query(
      `
      SELECT * FROM user_achievements 
      WHERE user_id = $1 AND achievement_id = $2
    `,
      [user_id, achievement_id],
    )
    if (existingAchievement.length > 0) {
      return NextResponse.json({ error: "User already has this achievement" }, { status: 409 })
    }
    // Award achievement to user
    const userAchievement = await insert("user_achievements", {
      user_id,
      achievement_id,
      earned_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    return NextResponse.json(userAchievement, { status: 201 })
  } catch (error) {
    console.error("Error awarding achievement:", error)
    return NextResponse.json({ error: "Failed to award achievement" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const achievementId = searchParams.get("achievement_id")
    if (!userId || !achievementId) {
      return NextResponse.json({ error: "User ID and Achievement ID are required" }, { status: 400 })
    }
    // Remove achievement from user
    await query(
      `
      DELETE FROM user_achievements 
      WHERE user_id = $1 AND achievement_id = $2
    `,
      [userId, achievementId],
    )
    return NextResponse.json({ message: "Achievement removed from user" })
  } catch (error) {
    console.error("Error removing achievement:", error)
    return NextResponse.json({ error: "Failed to remove achievement" }, { status: 500 })
  }
}
