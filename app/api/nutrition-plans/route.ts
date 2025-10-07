import { NextResponse } from "next/server"
import { query, insert, getAll } from "@/lib/db"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const coachId = searchParams.get("coach_id")
    const clientId = searchParams.get("client_id")
    if (id) {
      // Get nutrition plan with meals
      const plan = await query("SELECT * FROM nutrition_plans WHERE id = $1", [id])
      if (!plan || plan.length === 0) {
        return NextResponse.json({ error: "Nutrition plan not found" }, { status: 404 })
      }
      const meals = await query("SELECT * FROM meals WHERE nutrition_plan_id = $1 ORDER BY meal_time", [id])
      return NextResponse.json({
        ...plan[0],
        meals,
      })
    }
    if (coachId) {
      // Get nutrition plans for a specific coach
      const plans = await query("SELECT * FROM nutrition_plans WHERE coach_id = $1 ORDER BY created_at DESC", [coachId])
      return NextResponse.json(plans)
    }
    if (clientId) {
      // Get nutrition plans assigned to a specific client
      const plans = await query(
        `
        SELECT np.*, cnp.start_date, cnp.end_date
        FROM client_nutrition_plans cnp
        JOIN nutrition_plans np ON cnp.nutrition_plan_id = np.id
        WHERE cnp.client_id = $1
        ORDER BY cnp.start_date DESC
      `,
        [clientId],
      )
      return NextResponse.json(plans)
    }
    // Get all nutrition plans
    const plans = await getAll("nutrition_plans")
    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error fetching nutrition plans:", error)
    return NextResponse.json({ error: "Failed to fetch nutrition plans" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { coach_id, title, description, calories, protein, carbs, fat, meals } = body
    // Validate required fields
    if (!coach_id || !title) {
      return NextResponse.json({ error: "Coach ID and title are required" }, { status: 400 })
    }
    // Create nutrition plan
    const newPlan = await insert("nutrition_plans", {
      coach_id,
      title,
      description,
      calories,
      protein,
      carbs,
      fat,
    })
    // Add meals if provided
    if (meals && Array.isArray(meals) && meals.length > 0) {
      for (const meal of meals) {
        await insert("meals", {
          nutrition_plan_id: newPlan.id,
          name: meal.name,
          description: meal.description,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          meal_time: meal.meal_time,
        })
      }
    }
    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    console.error("Error creating nutrition plan:", error)
    return NextResponse.json({ error: "Failed to create nutrition plan" }, { status: 500 })
  }
}
