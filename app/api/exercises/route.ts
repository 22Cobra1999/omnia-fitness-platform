import { NextResponse } from "next/server"
import { query, insert, update, remove } from "@/lib/db"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const muscleGroup = searchParams.get("muscle_group")
    if (id) {
      const exercise = await query("SELECT * FROM exercises WHERE id = $1", [id])
      if (!exercise || exercise.length === 0) {
        return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
      }
      return NextResponse.json(exercise[0])
    }
    if (muscleGroup) {
      const exercises = await query("SELECT * FROM exercises WHERE muscle_group = $1 ORDER BY name", [muscleGroup])
      return NextResponse.json(exercises)
    }
    // Get all exercises
    const exercises = await query("SELECT * FROM exercises ORDER BY name")
    return NextResponse.json(exercises)
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, muscle_group, equipment, video_url } = body
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Exercise name is required" }, { status: 400 })
    }
    // Create exercise
    const newExercise = await insert("exercises", {
      name,
      description,
      muscle_group,
      equipment,
      video_url,
      created_at: new Date(),
      updated_at: new Date(),
    })
    return NextResponse.json(newExercise, { status: 201 })
  } catch (error) {
    console.error("Error creating exercise:", error)
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Exercise ID is required" }, { status: 400 })
    }
    const body = await request.json()
    body.updated_at = new Date()
    const updatedExercise = await update("exercises", Number.parseInt(id), body)
    if (!updatedExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }
    return NextResponse.json(updatedExercise)
  } catch (error) {
    console.error("Error updating exercise:", error)
    return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Exercise ID is required" }, { status: 400 })
    }
    // Check if exercise is used in any workouts
    const workoutExercises = await query("SELECT * FROM workout_exercises WHERE exercise_id = $1 LIMIT 1", [id])
    if (workoutExercises.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete exercise that is used in workouts. Remove it from all workouts first.",
        },
        { status: 400 },
      )
    }
    const deletedExercise = await remove("exercises", Number.parseInt(id))
    if (!deletedExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Exercise deleted successfully" })
  } catch (error) {
    console.error("Error deleting exercise:", error)
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 })
  }
}
