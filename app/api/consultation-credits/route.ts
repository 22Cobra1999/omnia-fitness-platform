import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")
    const activityId = searchParams.get("activity_id")
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    let query = supabase.from("client_consultation_credits").select(`
        *,
        activities:activity_id (
          title,
          coach_id
        )
      `)
    // Si se especifica client_id, filtrar por cliente
    if (clientId) {
      query = query.eq("client_id", clientId)
    } else {
      // Si no se especifica, usar el usuario actual
      query = query.eq("client_id", user.id)
    }
    // Si se especifica activity_id, filtrar por actividad
    if (activityId) {
      query = query.eq("activity_id", Number.parseInt(activityId))
    }
    const { data, error } = await query.order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching consultation credits:", error)
      return NextResponse.json({ error: "Error al obtener créditos de consulta" }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in consultation credits API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const body = await request.json()
    const { client_id, activity_id, coach_id, consultation_type, total_sessions, expires_at } = body
    // Validar datos requeridos
    if (!client_id || !activity_id || !coach_id || !consultation_type || !total_sessions) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }
    // Insertar o actualizar créditos de consulta
    const { data, error } = await supabase
      .from("client_consultation_credits")
      .upsert(
        {
          client_id,
          activity_id,
          coach_id,
          consultation_type,
          total_sessions,
          used_sessions: 0,
          expires_at,
        },
        {
          onConflict: "client_id,activity_id,consultation_type",
        },
      )
      .select()
      .single()
    if (error) {
      console.error("Error creating consultation credits:", error)
      return NextResponse.json({ error: "Error al crear créditos de consulta" }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in consultation credits API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
