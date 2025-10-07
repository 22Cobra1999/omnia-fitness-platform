"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

/**
 * Asegura que el usuario actual tenga un registro en la tabla clients
 * @returns El ID del cliente (igual al ID del usuario)
 */
export async function ensureClientRecord() {
  const supabase = createServerComponentClient({ cookies })

  try {
    // 1. Obtener el usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error al obtener usuario:", authError)
      throw new Error("Usuario no autenticado")
    }

    const userId = user.id

    // 2. Verificar si ya existe un registro en la tabla clients
    const { data: existingClient, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (clientError) {
      console.error("Error al verificar cliente existente:", clientError)
      throw new Error("Error al verificar cliente existente")
    }

    // 3. Si ya existe, retornar el ID
    if (existingClient) {
      console.log("Cliente ya existe:", existingClient.id)
      return userId
    }

    // 4. Si no existe, crear un nuevo registro
    console.log("Creando nuevo registro de cliente para usuario:", userId)

    // Obtener datos del perfil de usuario si existen
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .maybeSingle()

    // Crear el registro en la tabla clients
    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        id: userId,
        full_name: userProfile?.full_name || user.user_metadata?.name || "Cliente",
        email: userProfile?.email || user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error al crear cliente:", insertError)
      throw new Error("Error al crear registro de cliente")
    }

    console.log("Cliente creado exitosamente:", newClient.id)
    return userId
  } catch (error) {
    console.error("Error en ensureClientRecord:", error)
    throw error
  }
}
