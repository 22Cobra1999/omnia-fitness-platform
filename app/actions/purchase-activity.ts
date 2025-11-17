import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function purchaseActivity(activityId: number, paymentMethod: string, notes: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated." }
  }

  const client_id = user.id

  // Permitir múltiples compras - eliminada validación de compra única
  try {
    // 1. Insert into activity_enrollments
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("activity_enrollments")
      .insert({
        activity_id: activityId,
        client_id: client_id,
        status: "pending", // Set to pending initially
        progress: 0,
        amount_paid: 0, // Assuming price will be handled by a payment gateway later
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (enrollmentError) {
      console.error("Error inserting enrollment:", enrollmentError)
      throw new Error(`Error al crear la inscripción: ${enrollmentError.message}`)
    }

    // 2. Duplicate program details if the activity is a program
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("type")
      .eq("id", activityId)
      .single()

    if (activityError) {
      console.error("Error fetching activity type:", activityError)
      throw new Error(`Error al obtener el tipo de actividad: ${activityError.message}`)
    }

    if (activity.type === "fitness_program" || activity.type === "nutrition_program") {
      const { data: duplicateResult, error: duplicateError } = await supabase.rpc(
        "duplicate_program_details_on_enrollment",
        {
          p_activity_id: activityId,
          p_client_id: client_id,
          p_enrollment_id: enrollment.id,
          p_program_type: activity.type,
        },
      )

      if (duplicateError) {
        console.error("Error duplicating program details:", duplicateError)
        throw new Error(`Error al duplicar detalles del programa: ${duplicateError.message}`)
      }
      console.log("Duplicate program details result:", duplicateResult)
    }

    revalidatePath("/activities")
    revalidatePath("/my-programs")
    revalidatePath(`/activities/${activityId}`)

    return {
      success: true,
      message: "Actividad comprada y registrada con éxito.",
      enrollment: enrollment,
      transactionId: enrollment.id, // Using enrollment ID as transaction ID for now
      invoiceNumber: `INV-${enrollment.id}-${Date.now()}`,
    }
  } catch (error: any) {
    console.error("Full purchase activity error:", error)
    return { success: false, error: error.message || "Error desconocido al procesar la compra." }
  }
}
