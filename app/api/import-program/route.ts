import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { parse } from "papaparse"
function convertDayToNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") {
    return null
  }
  // Convertir a string y normalizar
  const dayString = String(value)
    .toLowerCase()
    .trim()
    // Quitar tildes y acentos
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g)
  // Mapeo de días a números
  const dayMap: { [key: string]: number } = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    domingo: 7,
    // También soportar versiones en inglés
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
    // Versiones abreviadas
    lun: 1,
    mar: 2,
    mie: 3,
    jue: 4,
    vie: 5,
    sab: 6,
    dom: 7,
  }
  // Buscar coincidencia exacta
  if (dayMap[dayString]) {
    return dayMap[dayString]
  }
  // Si no es un día, intentar convertir como número
  const numValue = Number.parseInt(String(value))
  return isNaN(numValue) ? null : numValue
}
function normalizeIntensityLevelImport(value: any): string | null {
  if (!value || value === "") return null
  const intensity = String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g)
  // Mapear variaciones a los valores estándar
  const intensityMap: { [key: string]: string } = {
    bajo: "Bajo",
    low: "Bajo",
    baja: "Bajo",
    moderado: "Moderado",
    moderate: "Moderado",
    medio: "Moderado",
    alto: "Alto",
    high: "Alto",
    alta: "Alto",
    intenso: "Alto",
    intense: "Alto",
  }
  return intensityMap[intensity] || value
}
export async function POST(request: NextRequest) {
  // console.log("🚀 API Route: import-program iniciado")
  console.log("📍 URL:", request.url)
  console.log("📍 Method:", request.method)
  console.log("📍 Headers:", Object.fromEntries(request.headers.entries()))
  try {
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    console.log("🔐 Auth check - User:", user?.id, "Error:", authError)
    if (authError || !user) {
      console.error("❌ Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // console.log("✅ Usuario autenticado:", user.id)
    const formData = await request.formData()
    const file = formData.get("file") as File
    const activityId = formData.get("activityId") as string
    const coachId = formData.get("coachId") as string
    const programType = formData.get("programType") as string
    console.log("📝 Datos recibidos:", {
      fileName: file?.name,
      fileSize: file?.size,
      activityId,
      coachId,
      programType,
    })
    if (!file || !activityId || !coachId || !programType) {
      console.error("❌ Datos faltantes")
      return NextResponse.json(
        { error: "Archivo, ID de actividad, ID de coach y tipo de programa son requeridos" },
        { status: 400 },
      )
    }
    // Verificar tipo de archivo
    if (!file.name.endsWith(".csv")) {
      console.error("❌ Tipo de archivo incorrecto:", file.name)
      return NextResponse.json({ error: "Solo se permiten archivos CSV" }, { status: 400 })
    }
    const fileContent = await file.text()
    console.log("📄 Contenido del archivo leído, tamaño:", fileContent.length)
    // Parsear CSV
    const { data, errors } = parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    })
    // console.log("🔍 Resultado del parsing:", { filas: data.length, errores: errors.length })
    if (errors.length > 0) {
      console.error("❌ Errores en el parsing:", errors)
      return NextResponse.json({ error: "Error al parsear el archivo CSV", details: errors }, { status: 400 })
    }
    if (data.length === 0) {
      console.error("❌ Archivo CSV vacío")
      return NextResponse.json({ error: "El archivo CSV está vacío" }, { status: 400 })
    }
    // Procesar según el tipo de programa
    if (programType === "nutrition") {
      console.log("🥗 Procesando programa de nutrición...")
      return await processNutritionProgram(supabase, data, activityId, coachId)
    } else if (programType === "fitness") {
      console.log("🏋️ Procesando programa de fitness...")
      return await processFitnessProgram(supabase, data, activityId, coachId)
    } else {
      console.error("❌ Tipo de programa no válido:", programType)
      return NextResponse.json(
        { error: 'Tipo de programa no válido. Debe ser "fitness" o "nutrition"' },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("💥 Error crítico en API route:", error)
    console.error("💥 Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
async function processNutritionProgram(supabase: any, data: any[], activityId: string, coachId: string) {
  try {
    console.log("🥗 Iniciando procesamiento de nutrition program...")
    console.log("🥗 Datos a procesar:", data.length, "filas")
    // Mapear datos del CSV a la estructura de la tabla nutrition_program_details
    const nutritionDetails = data.map((row, index) => {
      console.log(`📝 Procesando fila ${index + 1}:`, row)
      return {
        día: convertDayToNumber(row["Día"]) || null,
        semana: row["Semana"] ? Number.parseInt(row["Semana"]) : null,
        comida: row["Comida"] || null,
        nombre: row["Nombre"] || null,
        calorías: row["Calorías"] ? Number.parseInt(row["Calorías"]) : null,
        proteínas: row["Proteínas (g)"] ? Number.parseFloat(row["Proteínas (g)"]) : null,
        carbohidratos: row["Carbohidratos (g)"] ? Number.parseFloat(row["Carbohidratos (g)"]) : null,
        peso_cantidad: row["Peso/Cantidad"] ? Number.parseFloat(row["Peso/Cantidad"]) : null,
        receta_notas: row["Receta/Notas"] || null,
        video: row["Video"] || row["Video URL"] || row["Vimeo"] || null,
        coach_id: coachId,
        activity_id: Number.parseInt(activityId),
      }
    })
    console.log("💾 Insertando datos en nutrition_program_details...")
    console.log("💾 Primer registro de ejemplo:", nutritionDetails[0])
    // Insertar datos en la tabla
    const { data: insertedData, error } = await supabase
      .from("nutrition_program_details")
      .insert(nutritionDetails)
      .select()
    if (error) {
      console.error("❌ Error al insertar datos de nutrición:", error)
      return NextResponse.json(
        { error: "Error al insertar datos en la base de datos", details: error },
        { status: 500 },
      )
    }
    // console.log("✅ Datos de nutrición insertados correctamente:", insertedData.length)
    return NextResponse.json({
      success: true,
      message: `Se importaron ${insertedData.length} registros de nutrición correctamente`,
      data: insertedData,
    })
  } catch (error) {
    console.error("💥 Error en processNutritionProgram:", error)
    return NextResponse.json(
      {
        error: "Error al procesar el programa de nutrición",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
async function processFitnessProgram(supabase: any, data: any[], activityId: string, coachId: string) {
  try {
    console.log("🏋️ Iniciando procesamiento de fitness program...")
    // Mapear datos del CSV a la estructura de la tabla fitness_program_details
    const fitnessDetails = data.map((row, index) => {
      console.log(`📝 Procesando fila ${index + 1}:`, row)
      return {
        día: convertDayToNumber(row["Día"]) || null,
        semana: row["Semana"] ? Number.parseInt(row["Semana"]) : null,
        nombre_actividad: row["Nombre de la Actividad"] || row["Actividad"] || row["Ejercicio"] || null,
        descripción: row["Descripción"] || row["Description"] || null,
        duración: row["Duración (min)"] ? Number.parseInt(row["Duración (min)"]) : null,
        tipo_ejercicio: row["Tipo de Ejercicio"] || row["Tipo"] || null,
        repeticiones: row["Repeticiones"] || row["Reps"] || null,
        series: row["Serie"] ? Number.parseInt(row["Serie"]) : null,
        intervalos: row["Intervalos"] || row["Interval"] || null,
        intervalos_secs: row["Intervalo"] ? Number.parseInt(row["Intervalo"]) : null,
        descanso: row["Descanso"] || row["Rest"] || null,
        peso: row["Peso"] || row["Weight"] || null,
        nivel_intensidad: normalizeIntensityLevelImport(
          row["Nivel de Intensidad"] || row["Intensidad"] || row["Intensity"],
        ),
        equipo_necesario: row["Equipo Necesario"] || row["Equipo"] || row["Equipment"] || null,
        rm: row["1RM"] || row["RM"] || null,
        video: row["Video"] || row["Video URL"] || row["Vimeo"] || null,
        coach_id: coachId,
        activity_id: Number.parseInt(activityId),
      }
    })
    console.log("💾 Insertando datos en fitness_program_details...")
    // Insertar datos en la tabla
    const { data: insertedData, error } = await supabase.from("fitness_program_details").insert(fitnessDetails).select()
    if (error) {
      console.error("❌ Error al insertar datos de fitness:", error)
      return NextResponse.json(
        { error: "Error al insertar datos en la base de datos", details: error },
        { status: 500 },
      )
    }
    // console.log("✅ Datos de fitness insertados correctamente:", insertedData.length)
    return NextResponse.json({
      success: true,
      message: `Se importaron ${insertedData.length} registros de fitness correctamente`,
      data: insertedData,
    })
  } catch (error) {
    console.error("💥 Error en processFitnessProgram:", error)
    return NextResponse.json(
      {
        error: "Error al procesar el programa de fitness",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
