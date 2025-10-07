import { NextResponse } from "next/server"
export async function GET() {
  try {
    // Simplemente devolver éxito para validar que la API está funcionando
    // console.log("🚀 GET request a /api/program-data/validate")
    return NextResponse.json({
      success: true,
      message: "API funcionando correctamente",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error en validate endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
export async function POST(request: Request) {
  // console.log("🚀 POST request a /api/program-data/validate")
  try {
    const body = await request.json()
    console.log("📋 Datos recibidos:", body)
    const { programType, headers, sampleData } = body
    if (!programType || !headers || !sampleData) {
      return NextResponse.json(
        { error: "Se requiere el tipo de programa, encabezados y datos de muestra" },
        { status: 400 },
      )
    }
    // Verificar que el tipo de programa sea válido
    if (programType !== "fitness" && programType !== "nutrition") {
      return NextResponse.json({ error: "El tipo de programa debe ser 'fitness' o 'nutrition'" }, { status: 400 })
    }
    // Columnas esperadas para cada tipo de programa
    const EXPECTED_FITNESS_COLUMNS = [
      "día",
      "semana",
      "nombre_actividad",
      "descripción",
      "duración",
      "tipo_ejercicio",
      "repeticiones",
      "intervalos",
      "descanso",
      "peso",
      "nivel_intensidad",
      "equipo_necesario",
      "rm",
    ]
    const EXPECTED_NUTRITION_COLUMNS = [
      "día",
      "semana",
      "comida",
      "nombre",
      "calorías",
      "proteínas",
      "carbohidratos",
      "grasas",
      "fibra",
      "azúcares",
      "sodio",
    ]
    // Obtener las columnas esperadas según el tipo de programa
    const expectedColumns = programType === "fitness" ? EXPECTED_FITNESS_COLUMNS : EXPECTED_NUTRITION_COLUMNS
    // Verificar que las columnas del CSV coincidan con las esperadas
    const missingColumns = expectedColumns.filter((col) => !headers.includes(col))
    const extraColumns = headers.filter((col) => !expectedColumns.includes(col))
    // Verificar que los tipos de datos sean compatibles
    const dataTypeIssues = []
    for (const row of sampleData) {
      for (const col of expectedColumns) {
        if (row[col] !== undefined) {
          // Verificar tipos de datos numéricos
          if (
            ["calorías", "proteínas", "carbohidratos", "grasas", "fibra", "azúcares", "sodio", "duración"].includes(col)
          ) {
            if (isNaN(Number(row[col])) && row[col] !== "" && row[col] !== null) {
              dataTypeIssues.push(
                `La columna '${col}' debe contener valores numéricos. Valor encontrado: '${row[col]}'`,
              )
            }
          }
          // Verificar tipos de datos enteros
          if (["día", "semana"].includes(col)) {
            if (isNaN(Number.parseInt(row[col])) && row[col] !== "" && row[col] !== null) {
              dataTypeIssues.push(`La columna '${col}' debe contener valores enteros. Valor encontrado: '${row[col]}'`)
            }
          }
        }
      }
    }
    return NextResponse.json({
      valid: missingColumns.length === 0 && dataTypeIssues.length === 0,
      programType,
      missingColumns,
      extraColumns,
      dataTypeIssues,
      sampleDataCount: sampleData.length,
      message:
        missingColumns.length === 0 && dataTypeIssues.length === 0
          ? "Los datos del CSV son válidos para el tipo de programa seleccionado"
          : "Los datos del CSV no son compatibles con el tipo de programa seleccionado",
    })
  } catch (error) {
    console.error("❌ Error al validar los datos del CSV:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
