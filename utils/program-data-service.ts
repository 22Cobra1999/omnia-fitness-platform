import Papa from "papaparse"

export async function processAndSaveProgramCSV(
  file: File,
  programType: "fitness" | "nutrition",
  activityId: number,
  coachId: string,
  uploadMode: "replace" | "append" = "replace",
): Promise<{ success: boolean; message?: string; recordsCount?: number }> {
  try {
    console.log(`🚀 Procesando archivo CSV para ${programType}, actividad ${activityId}, modo: ${uploadMode}`)

    // Verificar que el archivo no esté vacío
    if (!file || file.size === 0) {
      return { success: false, message: "El archivo está vacío o no es válido" }
    }

    // Procesar el CSV con Papa Parse usando encabezados
    const parsePromise = new Promise<any[]>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado durante el parsing del CSV"))
      }, 15000)

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          clearTimeout(timeoutId)
          console.log("Papa Parse completado, filas encontradas:", results.data?.length || 0)

          if (results.data && results.data.length > 0) {
            resolve(results.data)
          } else {
            console.error("El archivo CSV no contiene datos válidos", results)
            reject(new Error("El archivo CSV no contiene datos válidos"))
          }
        },
        error: (error) => {
          clearTimeout(timeoutId)
          console.error("Error en Papa Parse:", error)
          reject(error)
        },
      })
    })

    const rawData = await parsePromise

    if (!rawData || rawData.length === 0) {
      return { success: false, message: "No se encontraron datos válidos en el archivo" }
    }

    // Mapear los datos según el tipo de programa
    const processedData = rawData.map((row: any) => {
      if (programType === "nutrition") {
        return {
          día: convertDayToNumber(row["día"] || row["day"] || row["dia"]) || 1,
          semana: convertToNumber(row["semana"] || row["week"]) || 1,
          comida: row["comida"] || row["meal"] || "",
          nombre: row["nombre"] || row["name"] || row["alimento"] || row["food"] || "",
          calorías: convertToNumber(row["calorías"] || row["calories"] || row["calorias"] || row["kcal"]),
          proteínas: convertToNumber(row["proteínas"] || row["protein"] || row["proteinas"]),
          carbohidratos: convertToNumber(row["carbohidratos"] || row["carbs"] || row["carbohydrates"]),
          peso: convertToNumber(row["peso"] || row["cantidad"] || row["weight"] || row["amount"]),
          receta: row["receta"] || row["recipe"] || "",
          video: row["video"] || row["video_url"] || row["vimeo"] || "",
        }
      } else {
        return {
          día: convertDayToNumber(row["día"] || row["day"] || row["dia"]) || 1,
          semana: convertToNumber(row["semana"] || row["week"]) || 1,
          nombre_actividad:
            row["nombre_actividad"] || row["nombre de la actividad"] || row["actividad"] || row["ejercicio"] || "",
          descripción: row["descripción"] || row["description"] || row["descripcion"] || "",
          duración: convertToNumber(
            row["duración (min)"] || row["duracion (min)"] || row["duración"] || row["duration"] || row["tiempo"],
          ),
          tipo_ejercicio:
            row["tipo de ejercicio"] || row["tipo_ejercicio"] || row["tipo"] || row["exercise_type"] || "",
          repeticiones: row["repeticiones"] || row["reps"] || "",
          series: convertToNumber(row["serie"] || row["series"] || row["sets"]),
          intervalos: row["intervalos"] || row["interval"] || "",
          intervalos_secs: convertToNumber(row["intervalo"] || row["interval_secs"] || row["rest_seconds"]),
          descanso: row["descanso"] || row["rest"] || "",
          peso: row["peso"] || row["weight"] || "",
          nivel_intensidad: normalizeIntensityLevel(
            row["nivel de intensidad"] || row["nivel_intensidad"] || row["intensity"] || row["intensidad"],
          ),
          equipo_necesario:
            row["equipo necesario"] || row["equipo_necesario"] || row["equipment"] || row["equipo"] || "",
          rm: row["1rm"] || row["rm"] || "",
          video: row["video"] || row["video_url"] || row["vimeo"] || "",
        }
      }
    })

    console.log(`📊 Datos procesados: ${processedData.length} filas`)

    // Si es modo replace, primero eliminar datos existentes
    if (uploadMode === "replace") {
      console.log(`🗑️ Modo replace: eliminando datos existentes de ${programType}`)

      try {
        const deleteResponse = await fetch("/api/program-data/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activityId,
            programType,
            coachId,
          }),
        })

        if (!deleteResponse.ok) {
          console.error("Error al eliminar datos existentes:", deleteResponse.status)
          // Continuar con la inserción aunque falle la eliminación
        } else {
          const deleteResult = await deleteResponse.json()
          console.log("✅ Datos existentes eliminados:", deleteResult)
        }
      } catch (deleteError) {
        console.error("Error al eliminar datos existentes:", deleteError)
        // Continuar con la inserción aunque falle la eliminación
      }
    }

    // Enviar los datos al servidor
    console.log(`💾 Guardando ${processedData.length} registros en la base de datos`)

    const response = await fetch("/api/program-data/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        programType,
        activityId,
        programData: processedData,
        coachId,
        uploadMode: "append", // Siempre usar append aquí porque ya eliminamos los datos si era replace
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        message: result.error || "Error al guardar los datos del programa",
      }
    }

    console.log("✅ Datos guardados exitosamente")

    return {
      success: true,
      message:
        uploadMode === "replace"
          ? `Datos reemplazados correctamente. Se guardaron ${result.recordsCount || processedData.length} registros`
          : `Datos agregados correctamente. Se guardaron ${result.recordsCount || processedData.length} registros`,
      recordsCount: result.recordsCount || processedData.length,
    }
  } catch (error) {
    console.error("💥 Error en processAndSaveProgramCSV:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido al procesar el archivo",
    }
  }
}

// Función auxiliar para convertir valores a números
function convertToNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") {
    return null
  }

  if (typeof value === "string") {
    const cleanValue = value.replace(/[^\d.-]/g, "")
    const num = Number.parseFloat(cleanValue)
    return isNaN(num) ? null : num
  }

  if (typeof value === "number") {
    return value
  }

  return null
}

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
    .replace(/[\u0300-\u036f]/g, "")

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
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 7,
  }

  // Buscar coincidencia exacta
  if (dayMap[dayString]) {
    return dayMap[dayString]
  }

  // Si no es un día, intentar convertir como número
  return convertToNumber(value)
}

function normalizeIntensityLevel(value: any): string {
  if (!value || value === "") return ""

  const intensity = String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

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
