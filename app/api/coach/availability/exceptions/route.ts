import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get("coach_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Construir la consulta base
    let query = supabase.from("coach_availability_exceptions").select("*").eq("coach_id", coachId)
    // Aplicar filtros de fecha si se proporcionan
    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate)
    }
    // Ejecutar la consulta
    const { data, error } = await query.order("date")
    if (error) {
      console.error("Error fetching coach availability exceptions:", error)
      return NextResponse.json({ error: "Failed to fetch availability exceptions" }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in availability exceptions API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { coach_id, date, exception_type, start_time, end_time, consultation_type, reason } = body
    // Validar datos requeridos
    if (!coach_id || !date || !exception_type) {
      return NextResponse.json({ error: "Missing required fields: coach_id, date, exception_type" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    // Verificar que el usuario es el coach o un administrador
    if (user.id !== coach_id) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()
      if (!roleData || roleData.role !== "admin") {
        return NextResponse.json({ error: "Not authorized to update this coach's availability" }, { status: 403 })
      }
    }
    // Insertar nueva excepción
    const { data, error } = await supabase
      .from("coach_availability_exceptions")
      .insert({
        coach_id,
        date,
        exception_type,
        start_time: exception_type === "custom_hours" ? start_time : null,
        end_time: exception_type === "custom_hours" ? end_time : null,
        consultation_type: exception_type === "custom_hours" ? consultation_type : null,
        reason,
      })
      .select()
      .single()
    if (error) {
      console.error("Error creating availability exception:", error)
      return NextResponse.json({ error: "Failed to create availability exception" }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error in availability exceptions API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Exception ID is required" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    // Obtener la excepción actual para verificar permisos
    const { data: currentException, error: fetchError } = await supabase
      .from("coach_availability_exceptions")
      .select("coach_id")
      .eq("id", id)
      .single()
    if (fetchError) {
      return NextResponse.json({ error: "Exception not found" }, { status: 404 })
    }
    // Verificar que el usuario es el coach o un administrador
    if (user.id !== currentException.coach_id) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()
      if (!roleData || roleData.role !== "admin") {
        return NextResponse.json({ error: "Not authorized to delete this exception" }, { status: 403 })
      }
    }
    // Eliminar la excepción
    const { error } = await supabase.from("coach_availability_exceptions").delete().eq("id", id)
    if (error) {
      console.error("Error deleting availability exception:", error)
      return NextResponse.json({ error: "Failed to delete availability exception" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in availability exceptions API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
