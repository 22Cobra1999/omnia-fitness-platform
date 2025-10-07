import { NextResponse } from "next/server"
import { createClientWithCookies } from "@/lib/supabase-server"
import { cookies } from "next/headers"

// Función para convertir número de día a nombre
function getDayNameFromNumber(dayNumber: number): string {
  const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  return dayNames[dayNumber] || 'Lunes'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get("activity_id")
    const semana = searchParams.get("semana")
    const dia = searchParams.get("dia")
    const exerciseId = searchParams.get("exercise_id")

    if (!activityId) {
      return NextResponse.json({ error: "activity_id es requerido" }, { status: 400 })
    }

    // Usar service role key para debugging
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from("organizacion_ejercicios")
      .select(`
        *,
        ejercicio:ejercicios_detalles!inner(*)
      `)
      .eq("activity_id", activityId)

    if (exerciseId) {
      query = query.eq("id", exerciseId)
    }

    const { data, error } = await query.order("semana", { ascending: true }).order("dia", { ascending: true })

    if (error) {
      console.error("Error fetching fitness exercise details:", error)
      return NextResponse.json({ error: "Error obteniendo detalles del ejercicio" }, { status: 500 })
    }

    // Transformar los datos al formato esperado por el componente
    const transformedData = (data || []).map((item: any) => ({
      id: item.id,
      activity_id: item.activity_id,
      semana: item.semana,
      día: getDayNameFromNumber(item.dia), // Convertir número a nombre de día
      nombre_actividad: item.ejercicio?.nombre_ejercicio || '',
      descripción: item.ejercicio?.descripcion || '',
      duracion_min: item.ejercicio?.duracion_min || 0,
      tipo_ejercicio: item.ejercicio?.tipo || '',
      nivel_intensidad: item.ejercicio?.nivel_intensidad || '',
      equipo_necesario: item.ejercicio?.equipo || '',
      bloque: item.bloque,
      body_parts: item.ejercicio?.body_parts || '',
      one_rm: item.ejercicio?.one_rm || null,
      detalle_series: item.ejercicio?.detalle_series || '',
      calorias: item.ejercicio?.calorias || null,
      video_url: item.ejercicio?.video_url || '',
      created_at: item.created_at
    }))

    return NextResponse.json({ exercises: transformedData })
  } catch (error) {
    console.error("Error in fitness exercise details API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      activity_id, 
      semana, 
      día, 
      nombre_actividad,
      descripción,
      duracion_min, 
      one_rm, 
      tipo_ejercicio,
      nivel_intensidad,
      equipo_necesario,
      detalle_series,
      video_url
    } = body

    // Validaciones
    if (!activity_id || !semana || !día || !nombre_actividad) {
      return NextResponse.json({ 
        error: "activity_id, semana, día y nombre_actividad son requeridos" 
      }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Crear el ejercicio
    const { data: exercise, error: exerciseError } = await supabase
      .from("fitness_exercises")
      .insert({
        activity_id,
        nombre_actividad,
        descripción,
        duracion_min,
        one_rm,
        tipo_ejercicio,
        nivel_intensidad,
        equipo_necesario,
        detalle_series,
        video_url,
        coach_id: user.id
      })
      .select()
      .single()

    if (exerciseError) {
      console.error("Error creating fitness exercise:", exerciseError)
      return NextResponse.json({ error: "Error creando ejercicio" }, { status: 500 })
    }

    // Crear entrada en activity_calendar
    const { data: calendarEntry, error: calendarError } = await supabase
      .from("activity_calendar")
      .insert({
        activity_id,
        fitness_exercise_id: exercise.id,
        week_number: semana,
        month_number: 1, // Por defecto mes 1, se puede calcular después
        day_name: día,
        calculated_date: null, // Se calculará después
        is_replicated: false
      })
      .select()
      .single()

    if (calendarError) {
      console.error("Error creating calendar entry:", calendarError)
      // No fallar si no se puede crear la entrada del calendario
    }

    return NextResponse.json(exercise)
  } catch (error) {
    console.error("Error in fitness exercise POST:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { 
      id,
      duracion_min, 
      one_rm, 
      nombre_actividad,
      descripción,
      tipo_ejercicio,
      nivel_intensidad,
      equipo_necesario,
      detalle_series,
      video_url
    } = body

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const updateData: any = {}
    if (duracion_min !== undefined) updateData.duracion_min = duracion_min
    if (one_rm !== undefined) updateData.one_rm = one_rm
    if (nombre_actividad !== undefined) updateData.nombre_actividad = nombre_actividad
    if (descripción !== undefined) updateData.descripción = descripción
    if (tipo_ejercicio !== undefined) updateData.tipo_ejercicio = tipo_ejercicio
    if (nivel_intensidad !== undefined) updateData.nivel_intensidad = nivel_intensidad
    if (equipo_necesario !== undefined) updateData.equipo_necesario = equipo_necesario
    if (detalle_series !== undefined) updateData.detalle_series = detalle_series
    if (video_url !== undefined) updateData.video_url = video_url

    const { data, error } = await supabase
      .from("fitness_exercises")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating fitness exercise:", error)
      return NextResponse.json({ error: "Error actualizando ejercicio" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in fitness exercise PUT:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { error } = await supabase
      .from("fitness_exercises")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting fitness exercise:", error)
      return NextResponse.json({ error: "Error eliminando ejercicio" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in fitness exercise DELETE:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}




