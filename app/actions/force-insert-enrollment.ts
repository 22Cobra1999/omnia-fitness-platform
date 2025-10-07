"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface ForceInsertParams {
  activityId: number
}

export async function forceInsertEnrollment({ activityId }: ForceInsertParams) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // 1. Verificar si el usuario está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "No autorizado" }
    }

    const userId = user.id
    console.log("Forzando inserción para usuario:", userId, "actividad:", activityId)

    // 2. Verificar si la actividad existe
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, title")
      .eq("id", activityId)
      .single()

    if (activityError) {
      console.error("Error al verificar actividad:", activityError)
      return { success: false, error: "Actividad no encontrada" }
    }

    // 3. Intentar inserción directa con datos mínimos
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("activity_enrollments")
      .insert({
        activity_id: activityId,
        client_id: userId,
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select()

    if (enrollmentError) {
      console.error("Error en inserción forzada:", enrollmentError)

      // 4. Intentar con SQL directo como último recurso
      try {
        // Esto es un último recurso y solo debe usarse para diagnóstico
        const { data: rawResult, error: rawError } = await supabase
          .rpc("execute_sql", {
            sql_query: `
              INSERT INTO activity_enrollments (activity_id, client_id, status, created_at)
              VALUES (${activityId}, '${userId}', 'active', NOW())
              RETURNING id;
            `,
          })
          .catch((err) => ({ data: null, error: err }))

        if (rawError) {
          console.error("Error en SQL directo:", rawError)
          return {
            success: false,
            error: "Falló la inserción forzada y el SQL directo",
            details: {
              enrollmentError,
              rawError,
            },
          }
        }

        return {
          success: true,
          message: "Inserción con SQL directo exitosa",
          data: rawResult,
        }
      } catch (sqlError) {
        console.error("Error en ejecución SQL:", sqlError)
        return {
          success: false,
          error: "Error en ejecución SQL directa",
          details: sqlError instanceof Error ? sqlError.message : String(sqlError),
        }
      }
    }

    return {
      success: true,
      message: "Inserción forzada exitosa",
      data: enrollment,
    }
  } catch (error) {
    console.error("Error en forceInsertEnrollment:", error)
    return {
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
