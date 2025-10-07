import { getSupabaseClient } from "@/lib/supabase"

// Tipos para la disponibilidad
export interface ActivityAvailability {
  available_days: string[]
  available_hours: string[]
  consultation_type: string | string[]
  consultation_duration?: number
}

export interface CoachAvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

// Función para obtener la disponibilidad de una actividad específica
export async function getActivityAvailability(activityId: number): Promise<ActivityAvailability | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("activities")
      .select("available_days, available_hours, consultation_type, consultation_duration")
      .eq("id", activityId)
      .single()

    if (error) {
      console.error("Error al obtener disponibilidad de actividad:", error)
      return null
    }

    return {
      available_days: data.available_days || [],
      available_hours: data.available_hours || [],
      consultation_type: data.consultation_type || "",
      consultation_duration: data.consultation_duration || 30,
    }
  } catch (error) {
    console.error("Error en getActivityAvailability:", error)
    return null
  }
}

// Función para actualizar la disponibilidad de una actividad
export async function updateActivityAvailability(
  activityId: number,
  coachId: string,
  availability: ActivityAvailability,
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from("activities")
      .update({
        available_days: availability.available_days,
        available_hours: availability.available_hours,
        consultation_type: availability.consultation_type,
        consultation_duration: availability.consultation_duration,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .eq("coach_id", coachId)

    if (error) {
      console.error("Error al actualizar disponibilidad:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error en updateActivityAvailability:", error)
    return false
  }
}

// Función para convertir la disponibilidad general a slots específicos
export function convertAvailabilityToTimeSlots(
  availableDays: string[],
  availableHours: string[],
): { day: string; slots: string[] }[] {
  // Mapeo de franjas horarias a rangos de horas
  const hourRanges: Record<string, string[]> = {
    madrugada: ["02:00", "03:00", "04:00", "05:00", "06:00", "07:00"],
    mañana: ["08:00", "09:00", "10:00", "11:00"],
    tarde: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    noche: ["18:00", "19:00", "20:00", "21:00"],
    trasnoche: ["22:00", "23:00", "00:00", "01:00"],
  }

  // Mapeo de días abreviados a nombres completos
  const dayMapping: Record<string, string> = {
    lun: "Lunes",
    mar: "Martes",
    mié: "Miércoles",
    jue: "Jueves",
    vie: "Viernes",
    sáb: "Sábado",
    dom: "Domingo",
  }

  // Crear slots para cada día disponible
  return availableDays.map((day) => {
    // Obtener todos los slots de hora para las franjas seleccionadas
    const slots = availableHours.flatMap((hour) => hourRanges[hour] || [])

    return {
      day: dayMapping[day] || day,
      slots,
    }
  })
}
