import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
// Función para crear el cliente de Supabase
const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    return null
  }
  return createClient(supabaseUrl, supabaseKey)
}
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: "No se pudo conectar a la base de datos" }, { status: 500 })
    }
    const resolvedParams = await params
    const activityId = Number.parseInt(resolvedParams.id)
    if (isNaN(activityId)) {
      return NextResponse.json({ error: "ID de actividad inválido" }, { status: 400 })
    }
    console.log(`Obteniendo datos del programa para actividad ${activityId}`)
    // Obtener datos de ejercicios organizados - NUEVO ESQUEMA MODULAR
    const { data: fitnessData, error: fitnessError } = await supabase
      .from("organizacion_ejercicios")
      .select(`
        *,
        ejercicio:ejercicios_detalles!inner(*)
      `)
      .eq("activity_id", activityId)
      .order("semana", { ascending: true })
      .order("dia", { ascending: true })
    // Obtener datos de nutrición
    const { data: nutritionData, error: nutritionError } = await supabase
      .from("nutrition_program_details")
      .select("*")
      .eq("activity_id", activityId)
      .order("semana", { ascending: true })
      .order("día", { ascending: true })
    if (fitnessError) {
      console.error("Error al obtener datos de fitness:", fitnessError)
    }
    if (nutritionError) {
      console.error("Error al obtener datos de nutrición:", nutritionError)
    }
    return NextResponse.json({
      success: true,
      data: {
        fitness: fitnessData || [],
        nutrition: nutritionData || [],
      },
      activityId,
      recordsCount: {
        fitness: fitnessData?.length || 0,
        nutrition: nutritionData?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error en GET /api/program-data/[id]:", error)
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
