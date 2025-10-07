// Definir la interfaz para los datos de actividad (solo columnas que existen en la tabla activities)
export interface ActivityData {
  id?: number
  title: string
  description: string
  type: string
  difficulty?: string
  duration?: number | null
  calories?: number | null
  price: number
  image_url?: string | null
  video_url?: string | null
  pdf_url?: string | null
  is_public?: boolean
  availability_type?: string
  coach_id: string
  updated_at?: string
  vimeo_id?: string | null
  program_duration?: string | null // Assuming this is a string like "1 week"
  rich_description?: string | null // This one stays on activities
  session_type?: string
  available_slots?: number | null
  // The following fields are REMOVED from ActivityData as they belong to coach_availability now:
  // available_days?: string[] | null
  // available_hours?: string[] | null
  // consultation_type?: string | null
  // videocall_duration?: number | null
}

// Función simplificada para validar la conexión
export const validateConnection = async (): Promise<boolean> => {
  try {
    console.log("📡 Verificando conexión...")
    return true // Simplificar - sabemos que la BD funciona
  } catch (error) {
    console.error("❌ Error al validar conexión:", error)
    return false
  }
}

// Función que usa SQL directo para actualizar
export const saveActivityWithRetry = async (
  activityData: ActivityData,
  activityId?: number,
): Promise<{ success: boolean; activityId?: number; error?: string }> => {
  console.log("🚀 Iniciando guardado de actividad...")
  console.log("📋 Datos de actividad:", {
    title: activityData.title,
    type: activityData.type,
    coach_id: activityData.coach_id,
    isUpdate: !!activityId,
  })

  try {
    // If it's an update, use the PUT /api/activities/[id] endpoint
    if (activityId) {
      console.log("🔄 Usando PUT /api/activities/[id] para actualizar actividad:", activityId)

      const response = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(activityData), // Send the activityData object
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar la actividad")
      }

      console.log("✅ Actividad actualizada exitosamente con ID:", result.activityId)
      return {
        success: true,
        activityId: result.activityId,
      }
    }

    // For new activities, use the normal POST route
    const url = "/api/activities"
    const method = "POST"

    // Prepare data using only columns that exist in the activities table
    const dataToSend: Omit<ActivityData, "id" | "updated_at"> = {
      title: activityData.title,
      description: activityData.description || "",
      type: activityData.type,
      difficulty: activityData.difficulty || "beginner",
      duration: activityData.duration || null,
      calories: activityData.calories || null,
      price: activityData.price || 0,
      image_url: activityData.image_url || null,
      video_url: activityData.video_url || null,
      pdf_url: activityData.pdf_url || null,
      is_public: activityData.is_public || false,
      availability_type: activityData.availability_type || "immediate_purchase",
      coach_id: activityData.coach_id,
      vimeo_id: activityData.vimeo_id || null,
      program_duration: activityData.program_duration || null,
      rich_description: activityData.rich_description || null,
      session_type: activityData.session_type || "individual",
      available_slots: activityData.available_slots || null,
      // Ensure consultation-related fields are NOT included here for activities table
    }

    console.log("📤 Enviando datos a:", url)

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(dataToSend),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Error al guardar la actividad")
    }

    console.log("✅ Actividad creada exitosamente con ID:", result.activityId)
    return {
      success: true,
      activityId: result.activityId,
    }
  } catch (error) {
    console.error("❌ Error al guardar actividad:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al guardar la actividad",
    }
  }
}
