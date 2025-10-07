"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function startActivity(activityId: number) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("Usuario no autenticado")
    }

    // 2. Get enrollment for this user and activity
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("activity_enrollments")
      .select("id, status, start_date")
      .eq("activity_id", activityId)
      .eq("client_id", user.id)
      .single()

    if (enrollmentError) {
      throw new Error(`Error al obtener la inscripción: ${enrollmentError.message}`)
    }

    if (!enrollment) {
      throw new Error("No se encontró inscripción para esta actividad")
    }

    if (enrollment.status === "active" && enrollment.start_date) {
      return { success: true, message: "La actividad ya está iniciada." }
    }

    // 3. Update enrollment status to 'active' and set start_date
    const { data: updatedEnrollment, error: updateEnrollmentError } = await supabase
      .from("activity_enrollments")
      .update({ status: "active", start_date: new Date().toISOString() })
      .eq("id", enrollment.id)
      .eq("activity_id", activityId)
      .eq("client_id", user.id)
      .select()
      .single()

    if (updateEnrollmentError) {
      console.error("Error updating enrollment status:", updateEnrollmentError)
      throw new Error(`Error al actualizar el estado de la inscripción: ${updateEnrollmentError.message}`)
    }

    // 2. Get activity type to determine which program details table to update
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("type")
      .eq("id", activityId)
      .single()

    if (activityError) {
      console.error("Error fetching activity type:", activityError)
      throw new Error(`Error al obtener el tipo de actividad: ${activityError.message}`)
    }

    const programType = activity.type

    // 3. Call RPC function to update scheduled_date for program details
    let updateDetailsResult
    if (programType === "fitness_program") {
      const { data, error } = await supabase.rpc("update_fitness_program_scheduled_dates", {
        p_enrollment_id: enrollment.id,
        p_client_id: user.id,
      })
      updateDetailsResult = { data, error }
    } else if (programType === "nutrition_program") {
      const { data, error } = await supabase.rpc("update_nutrition_program_scheduled_dates", {
        p_enrollment_id: enrollment.id,
        p_client_id: user.id,
      })
      updateDetailsResult = { data, error }
    } else {
      // For other activity types, no program details update is needed
      updateDetailsResult = { data: null, error: null }
    }

    if (updateDetailsResult.error) {
      console.error("Error updating program scheduled dates:", updateDetailsResult.error)
      throw new Error(`Error al programar las fechas de las actividades: ${updateDetailsResult.error.message}`)
    }

    revalidatePath("/activities")
    revalidatePath("/my-programs")
    revalidatePath(`/activities/${activityId}`)
    revalidatePath(`/program-tracker/${activityId}`)

    return { success: true, message: "¡Programa iniciado! Hoy es el Día 1, Semana 1." }
  } catch (error: any) {
    console.error("Full start activity error:", error)
    return { success: false, message: error.message || "Error desconocido al iniciar la actividad." }
  }
}
