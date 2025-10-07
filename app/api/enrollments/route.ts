import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")

  if (!clientId) {
    return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: enrollments, error } = await supabase
      .from("activity_enrollments")
      .select(
        `
        id,
        activity_id,
        client_id,
        status,
        amount_paid,
        payment_method,
        payment_date,
        created_at,
        activities:activities (
          id,
          title,
          description,
          type,
          difficulty,
          image_url,
          video_url,
          vimeo_id,
          price,
          coach_id
        )
      `,
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching enrollments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(enrollments)
  } catch (error: any) {
    console.error("Unexpected error in enrollments route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
