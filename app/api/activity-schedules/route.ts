import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")
    const coachId = searchParams.get("coach_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const supabase = createRouteHandlerClient({ cookies })
    let query = supabase.from("activity_schedules").select(`
        *,
        activity:activities(id, title, type),
        enrollment:activity_enrollments(id, status)
      `)
    if (clientId) {
      query = query.eq("client_id", clientId)
    }
    if (coachId) {
      query = query.eq("coach_id", coachId)
    }
    if (startDate && endDate) {
      query = query.gte("scheduled_date", startDate).lte("scheduled_date", endDate)
    }
    const { data: schedules, error } = await query.order("scheduled_date", { ascending: true })
    if (error) {
      throw error
    }
    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching activity schedules:", error)
    return NextResponse.json({ error: "Failed to fetch activity schedules" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { data: schedule, error } = await supabase.from("activity_schedules").insert(body).select().single()
    if (error) {
      throw error
    }
    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("Error creating activity schedule:", error)
    return NextResponse.json({ error: "Failed to create activity schedule" }, { status: 500 })
  }
}
