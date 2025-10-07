import { NextResponse } from "next/server"
import { query, insert, update, remove } from "@/lib/db"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const coachId = searchParams.get("coach_id")
    const clientId = searchParams.get("client_id")
    if (id) {
      // Get workout details
      const workout = await query(`SELECT * FROM workouts WHERE id = $1`, [id])
      if (!workout || workout.length === 0) {
        return NextResponse.json({ error: "Workout not found" }, { status: 404 })
      }
      // Get exercises for this workout
      const exercises = await query(
        `
        SELECT we.*, e.name, e.description, e.muscle_group, e.equipment, e.video_url
        FROM workout_exercises we
        JOIN exercises e ON we.exercise_id = e.id
        WHERE we.workout_id = $1
        ORDER BY we.order_index
      `,
        [id],
      )
      return NextResponse.json({
        ...workout[0],
        exercises,
      })
    }
    if (coachId) {
      // Get workouts for a specific coach
      const workouts = await query(
        `
        SELECT w.*, COUNT(we.id) as exercise_count
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.id = we.workout_id
        WHERE w.coach_id = $1
        GROUP BY w.id
        ORDER BY w.created_at DESC
      `,
        [coachId],
      )
      return NextResponse.json(workouts)
    }
    if (clientId) {
      // Get workouts assigned to a specific client
      const workouts = await query(
        `
        SELECT w.*, cw.assigned_date, cw.completed_date, cw.feedback
        FROM client_workouts cw
        JOIN workouts w ON cw.workout_id = w.id
        WHERE cw.client_id = $1
        ORDER BY cw.assigned_date DESC
      `,
        [clientId],
      )
      return NextResponse.json(workouts)
    }
    // Get all workouts
    const workouts = await query(`
      SELECT w.*, c.name as coach_name, COUNT(we.id) as exercise_count
      FROM workouts w
      JOIN coaches c ON w.coach_id = c.id
      LEFT JOIN workout_exercises we ON w.id = we.workout_id
      GROUP BY w.id, c.name
      ORDER BY w.created_at DESC
    `)
    return NextResponse.json(workouts)
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json({ error: "Failed to fetch workouts" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { coach_id, title, description, difficulty, duration, exercises } = body
    // Validate required fields
    if (!coach_id || !title) {
      return NextResponse.json({ error: "Coach ID and title are required" }, { status: 400 })
    }
    // Create workout
    const newWorkout = await insert("workouts", {
      coach_id,
      title,
      description,
      difficulty,
      duration,
      created_at: new Date(),
      updated_at: new Date(),
    })
    // Add exercises if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]
        await insert("workout_exercises", {
          workout_id: newWorkout.id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          rest: exercise.rest,
          notes: exercise.notes,
          order_index: i,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }
    return NextResponse.json(newWorkout, { status: 201 })
  } catch (error) {
    console.error("Error creating workout:", error)
    return NextResponse.json({ error: "Failed to create workout" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Workout ID is required" }, { status: 400 })
    }
    const body = await request.json()
    const { exercises, ...workoutData } = body
    workoutData.updated_at = new Date()
    // Update workout
    const updatedWorkout = await update("workouts", Number.parseInt(id), workoutData)
    if (!updatedWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }
    // Update exercises if provided
    if (exercises && Array.isArray(exercises)) {
      // Remove existing exercises
      await query("DELETE FROM workout_exercises WHERE workout_id = $1", [id])
      // Add new exercises
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]
        await insert("workout_exercises", {
          workout_id: id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          rest: exercise.rest,
          notes: exercise.notes,
          order_index: i,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }
    return NextResponse.json(updatedWorkout)
  } catch (error) {
    console.error("Error updating workout:", error)
    return NextResponse.json({ error: "Failed to update workout" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Workout ID is required" }, { status: 400 })
    }
    // Delete workout (cascade will delete workout_exercises)
    const deletedWorkout = await remove("workouts", Number.parseInt(id))
    if (!deletedWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Workout deleted successfully" })
  } catch (error) {
    console.error("Error deleting workout:", error)
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 })
  }
}
