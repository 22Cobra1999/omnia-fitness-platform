import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
// GET - Obtener todas las actividades recientes del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Obtener actividades recientes del usuario
    const { data, error } = await supabase
      .from("recent_activities")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
    if (error) {
      console.error("Error al obtener actividades recientes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // Devolver directamente el array de actividades
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error en GET /api/recent-activities:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
// POST - Crear una nueva actividad reciente
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Obtener datos de la actividad del cuerpo de la solicitud
    const activityData = await request.json()
    // Asegurarse de que el user_id sea el del usuario actual y sea un UUID válido
    if (!user.id) {
      console.error("ID de usuario no disponible")
      return NextResponse.json({ error: "ID de usuario no disponible" }, { status: 400 })
    }
    // Crear objeto con los datos a insertar, asegurándonos de que user_id esté presente
    const dataToInsert = {
      ...activityData,
      user_id: user.id,
    }
    // Eliminar cualquier user_id vacío que pudiera venir en los datos originales
    if (dataToInsert.user_id === "") {
      console.error("Se detectó un user_id vacío, usando el ID del usuario autenticado")
    }
    console.log("Datos a insertar:", dataToInsert)
    // Insertar la actividad en la base de datos
    const { data, error } = await supabase.from("recent_activities").insert(dataToInsert).select().single()
    if (error) {
      console.error("Error al crear actividad reciente:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ activity: data }, { status: 201 })
  } catch (error) {
    console.error("Error en POST /api/recent-activities:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
