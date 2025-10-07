import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get("date")
  const clientId = searchParams.get("clientId")
  if (!dateParam || !clientId) {
    return NextResponse.json({ error: "Date and clientId are required" }, { status: 400 })
  }
  const supabase = createRouteHandlerClient({ cookies })
  try {
    const { data: dailyActivities, error } = await supabase.rpc("get_client_daily_activities", {
      p_client_id: clientId,
      p_date: dateParam,
    })
    if (error) {
      console.error("Error calling get_client_daily_activities RPC:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(dailyActivities)
  } catch (error: any) {
    console.error("Unexpected error in client-daily-activities route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
