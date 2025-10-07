import { NextResponse } from "next/server"
import { query, insert, update, remove } from "@/lib/db"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("user_id")
    if (id) {
      const goal = await query("SELECT * FROM goals WHERE id = $1", [id])
      if (!goal || goal.length === 0) {
        return NextResponse.json({ error: "Goal not found" }, { status: 404 })
      }
      return NextResponse.json(goal[0])
    }
    if (userId) {
      const goals = await query("SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC", [userId])
      return NextResponse.json(goals)
    }
    // Get all goals
    const goals = await query("SELECT * FROM goals ORDER BY created_at DESC")
    return NextResponse.json(goals)
  } catch (error) {
    console.error("Error fetching goals:", error)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, text, color, training_frequency, change_timeline, category } = body
    // Validate required fields
    if (!user_id || !text) {
      return NextResponse.json({ error: "User ID and goal text are required" }, { status: 400 })
    }
    // Create goal
    const newGoal = await insert("goals", {
      user_id,
      text,
      color: color || "blue",
      training_frequency,
      change_timeline,
      category,
      created_at: new Date(),
      updated_at: new Date(),
    })
    return NextResponse.json(newGoal, { status: 201 })
  } catch (error) {
    console.error("Error creating goal:", error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 })
    }
    const body = await request.json()
    body.updated_at = new Date()
    const updatedGoal = await update("goals", Number.parseInt(id), body)
    if (!updatedGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }
    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 })
    }
    const deletedGoal = await remove("goals", Number.parseInt(id))
    if (!deletedGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Goal deleted successfully" })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}
