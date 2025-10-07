import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const coachId = params.id
    if (!coachId) {
      return NextResponse.json({ error: "ID del coach no proporcionado" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Método 1: Consulta estándar
    const standardQueryResult = await getActivitiesStandard(supabase, coachId)
    // Método 2: Función RPC (si existe)
    const rpcQueryResult = await getActivitiesRPC(supabase, coachId)
    // Método 3: Obtener todas las actividades y filtrar manualmente
    const allActivitiesResult = await getAllActivitiesAndFilter(supabase, coachId)
    return NextResponse.json({
      coachId,
      standardQuery: standardQueryResult,
      rpcQuery: rpcQueryResult,
      allActivitiesQuery: allActivitiesResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error en la API de diagnóstico:", error)
    return NextResponse.json({ error: error.message || "Error desconocido" }, { status: 500 })
  }
}
async function getActivitiesStandard(supabase: any, coachId: string) {
  try {
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
    return {
      activities: activities || [],
      error: error ? error.message : null,
    }
  } catch (error: any) {
    return {
      activities: [],
      error: error.message || "Error desconocido",
    }
  }
}
async function getActivitiesRPC(supabase: any, coachId: string) {
  try {
    // Intentar usar la función RPC si existe
    const { data: activities, error } = await supabase.rpc("get_coach_activities_v2", { coach_id_param: coachId })
    return {
      activities: activities || [],
      error: error ? error.message : null,
    }
  } catch (error: any) {
    return {
      activities: [],
      error: error.message || "Error desconocido (la función RPC podría no existir)",
    }
  }
}
async function getAllActivitiesAndFilter(supabase: any, coachId: string) {
  try {
    // Obtener todas las actividades
    const { data: allActivities, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      throw error
    }
    // Filtrar manualmente por coach_id
    const filteredActivities = allActivities.filter((activity: any) => activity.coach_id === coachId)
    return {
      total: allActivities.length,
      filtered: filteredActivities,
      error: null,
    }
  } catch (error: any) {
    return {
      total: 0,
      filtered: [],
      error: error.message || "Error desconocido",
    }
  }
}
