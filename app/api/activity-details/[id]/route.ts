import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // console.log("🔍 API activity-details: Iniciando procesamiento")
    const resolvedParams = await params
    const activityId = resolvedParams.id
    // console.log("🔍 API activity-details: Activity ID recibido:", activityId)
    if (!activityId) {
      console.log("❌ API activity-details: Activity ID faltante")
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 })
    }
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // console.log("🔍 API activity-details: Cliente Supabase creado")
    // Consulta simplificada
    // console.log("🔍 API activity-details: Consultando actividad con ID:", activityId)
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single()
    // console.log("🔍 API activity-details: Resultado de consulta:", { activity, activityError })
    if (activityError) {
      console.error("❌ API activity-details: Error fetching activity:", activityError)
      console.error("❌ API activity-details: Detalles del error:", {
        message: activityError.message,
        details: activityError.details,
        hint: activityError.hint,
        code: activityError.code
      })
      return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
    }
    if (!activity) {
      console.log("❌ API activity-details: Activity no encontrada")
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }
    // Obtener ejercicios organizados - NUEVO ESQUEMA MODULAR
    // console.log("🔍 API activity-details: Consultando ejercicios organizados")
    const { data: organizedExercises, error: organizedError } = await supabase
      .from("organizacion_ejercicios")
      .select(`
        *,
        ejercicio:ejercicios_detalles!inner(*)
      `)
      .eq("activity_id", activityId)
    if (organizedError) {
      console.error("❌ API activity-details: Error fetching organized exercises:", organizedError)
    } else {
      // console.log("✅ API activity-details: Ejercicios organizados encontrados:", organizedExercises?.length || 0)
    }
    // Obtener media
    // console.log("🔍 API activity-details: Consultando media")
    const { data: media, error: mediaError } = await supabase
      .from("activity_media")
      .select("*")
      .eq("activity_id", activityId)
    if (mediaError) {
      console.error("❌ API activity-details: Error fetching media:", mediaError)
    } else {
      // console.log("✅ API activity-details: Media encontrado:", media?.length || 0)
    }
    // Obtener program info - NO EXISTE EN NUEVO ESQUEMA
    // Los campos de programa ahora están directamente en activities
    // console.log("🔍 API activity-details: Program info no existe en nuevo esquema")
    const programInfo = null
    // Procesar los datos
    const processedData = {
      activity_id: activity.id,
      title: activity.title,
      description: activity.description,
      type: activity.type,
      difficulty: activity.difficulty,
      price: activity.price,
      categoria: activity.categoria,
      is_public: activity.is_public,
      created_at: activity.created_at,
      coach_name: activity.coaches?.[0]?.full_name || null,
      instagram: activity.coaches?.[0]?.instagram || null,
      total_duration: programInfo?.duration || null,
      total_calories: programInfo?.calories || null,
      program_duration: programInfo?.program_duration || null,
      rich_description: programInfo?.rich_description || null,
      interactive_pauses: programInfo?.interactive_pauses || null,
      // Datos de ejercicios organizados - NUEVO ESQUEMA
      fitness_details: organizedExercises || [],
      // Media
      image_url: media?.[0]?.image_url || null,
      video_url: media?.[0]?.video_url || null
    }
    // console.log("✅ API activity-details: Datos procesados exitosamente")
    return NextResponse.json(processedData)
  } catch (error) {
    console.error("❌ API activity-details: Error general:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 