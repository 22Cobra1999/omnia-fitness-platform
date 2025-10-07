"use server"

import { getServerSupabaseClient } from "@/lib/supabase"

export async function getCurrentUser() {
  const supabase = getServerSupabaseClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { user: null }
    }

    // Obtener datos del perfil
    const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", session.user.id).single()

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || "Usuario OMNIA",
        profile: profile || null,
        role: session.user.user_metadata?.role || profile?.preferences?.role || "client",
      },
    }
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return { user: null }
  }
}

export async function signOut() {
  const supabase = getServerSupabaseClient()

  try {
    await supabase.auth.signOut()
    return { success: true }
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    return { success: false, error: "Error al cerrar sesión" }
  }
}

export async function createUserProfile(userId: string, data: any) {
  const supabase = getServerSupabaseClient()

  try {
    const { error } = await supabase.from("user_profiles").insert([
      {
        user_id: userId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error al crear perfil de usuario:", error)
    return { success: false, error: "Error al crear perfil de usuario" }
  }
}
