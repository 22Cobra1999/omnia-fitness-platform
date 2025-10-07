"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function processActivityPurchase(activityId: number, clientId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Obtener detalles de la actividad
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single()

    if (activityError || !activity) {
      throw new Error("Actividad no encontrada")
    }

    // Verificar si la actividad incluye consultas
    const includesConsultations = activity.description?.includes("[CONSULTAS_INCLUIDAS]")

    if (includesConsultations && activity.consultation_details) {
      // Procesar los detalles de consulta desde el JSON
      const consultationDetails = activity.consultation_details

      // Crear créditos de consulta para videollamadas
      if (consultationDetails.videocall_sessions > 0) {
        await supabase.from("client_consultation_credits").upsert(
          {
            client_id: clientId,
            activity_id: activityId,
            coach_id: activity.coach_id,
            consultation_type: "videocall",
            total_sessions: consultationDetails.videocall_sessions,
            used_sessions: 0,
            expires_at: consultationDetails.expires_at || null,
          },
          {
            onConflict: "client_id,activity_id,consultation_type",
          },
        )
      }

      // Crear créditos de consulta para mensajes
      if (consultationDetails.message_days > 0) {
        await supabase.from("client_consultation_credits").upsert(
          {
            client_id: clientId,
            activity_id: activityId,
            coach_id: activity.coach_id,
            consultation_type: "message",
            total_sessions: consultationDetails.message_days,
            used_sessions: 0,
            expires_at: consultationDetails.expires_at || null,
          },
          {
            onConflict: "client_id,activity_id,consultation_type",
          },
        )
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error processing activity purchase:", error)
    throw error
  }
}
