import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get("coach_id")
    const dayOfWeek = searchParams.get("day_of_week")
    const consultationType = searchParams.get("consultation_type")
    const isGeneralPreference = searchParams.get("is_general_preference") === "true"
    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 })
    }
    const supabase = createClient(cookieStore)
    // Obtener disponibilidad sin validar auth para permitir consultas públicas
    let query = supabase.from("coach_availability").select("*").eq("coach_id", coachId).eq("is_active", true)
    if (dayOfWeek) {
      query = query.eq("day_of_week", Number.parseInt(dayOfWeek))
    }
    if (consultationType) {
      query = query.contains("consultation_type", [consultationType])
    }
    if (isGeneralPreference) {
      query = query.eq("is_general_preference", true)
    } else {
      query = query.eq("is_general_preference", false)
    }
    const { data, error } = await query.order("day_of_week").order("start_time")
    if (error) {
      console.error("Error fetching coach availability:", error)
      return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in availability API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      coach_id,
      day_of_week,
      start_time,
      end_time,
      consultation_type,
      available_days,
      available_hours,
      videocall_duration,
      is_general_preference = false,
    } = body
    if (!coach_id || day_of_week === undefined || !start_time || !end_time || !consultation_type) {
      return NextResponse.json(
        { error: "Missing required fields: coach_id, day_of_week, start_time, end_time, consultation_type" },
        { status: 400 },
      )
    }
    if (!Array.isArray(consultation_type)) {
      return NextResponse.json({ error: "consultation_type must be an array of strings" }, { status: 400 })
    }
    const supabase = createClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    if (user.id !== coach_id) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()
      if (!roleData || roleData.role !== "admin") {
        return NextResponse.json({ error: "Not authorized to update this coach's availability" }, { status: 403 })
      }
    }
    const { data, error } = await supabase
      .from("coach_availability")
      .insert({
        coach_id,
        day_of_week,
        start_time,
        end_time,
        consultation_type,
        is_active: true,
        available_days: available_days || null,
        available_hours: available_hours || null,
        videocall_duration: videocall_duration || null,
        is_general_preference,
      })
      .select()
      .single()
    if (error) {
      console.error("Error creating availability:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ya existe una disponibilidad para este día y horario" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create availability" }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error in availability API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Availability ID is required" }, { status: 400 })
    }
    const body = await request.json()
    const {
      day_of_week,
      start_time,
      end_time,
      consultation_type,
      is_active,
      available_days,
      available_hours,
      videocall_duration,
      is_general_preference,
    } = body
    const supabase = createClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    const { data: currentAvailability, error: fetchError } = await supabase
      .from("coach_availability")
      .select("coach_id")
      .eq("id", id)
      .single()
    if (fetchError) {
      return NextResponse.json({ error: "Availability not found" }, { status: 404 })
    }
    if (user.id !== currentAvailability.coach_id) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()
      if (!roleData || roleData.role !== "admin") {
        return NextResponse.json({ error: "Not authorized to update this availability" }, { status: 403 })
      }
    }
    const updateData: any = {}
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (consultation_type !== undefined) {
      if (!Array.isArray(consultation_type)) {
        return NextResponse.json({ error: "consultation_type must be an array of strings" }, { status: 400 })
      }
      updateData.consultation_type = consultation_type
    }
    if (is_active !== undefined) updateData.is_active = is_active
    if (available_days !== undefined) updateData.available_days = available_days
    if (available_hours !== undefined) updateData.available_hours = available_hours
    if (videocall_duration !== undefined) updateData.videocall_duration = videocall_duration
    if (is_general_preference !== undefined) updateData.is_general_preference = is_general_preference
    const { data, error } = await supabase.from("coach_availability").update(updateData).eq("id", id).select().single()
    if (error) {
      console.error("Error updating availability:", error)
      return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in availability API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Availability ID is required" }, { status: 400 })
    }
    const supabase = createClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    const { data: currentAvailability, error: fetchError } = await supabase
      .from("coach_availability")
      .select("coach_id")
      .eq("id", id)
      .single()
    if (fetchError) {
      return NextResponse.json({ error: "Availability not found" }, { status: 404 })
    }
    if (user.id !== currentAvailability.coach_id) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()
      if (!roleData || roleData.role !== "admin") {
        return NextResponse.json({ error: "Not authorized to delete this availability" }, { status: 403 })
      }
    }
    const { error } = await supabase.from("coach_availability").delete().eq("id", id)
    if (error) {
      console.error("Error deleting availability:", error)
      return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in availability API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
