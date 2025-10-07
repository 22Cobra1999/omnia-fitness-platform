import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
// Crear un cliente Supabase con la clave de servicio para tener acceso completo
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
export async function GET(request: Request, { params }: { params: { coachId: string } }) {
  try {
    const coachId = params.coachId
    if (!coachId) {
      return NextResponse.json({ error: "ID del coach no proporcionado" }, { status: 400 })
    }
    // Usar la clave de servicio para obtener todas las actividades sin restricciones
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error al obtener actividades:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({
      coachId,
      count: activities?.length || 0,
      activities: activities || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error en la API de actividades directas:", error)
    return NextResponse.json({ error: error.message || "Error desconocido" }, { status: 500 })
  }
}
