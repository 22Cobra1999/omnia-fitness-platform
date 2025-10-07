import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // 1. Obtener datos de la solicitud
    const { userId, fullName, email } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "Se requiere el ID de usuario" }, { status: 400 })
    }
    // 2. Verificar si el usuario está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // 3. Verificar si el cliente ya existe
    const { data: existingClient } = await supabase.from("clients").select("id").eq("id", userId).maybeSingle()
    if (existingClient) {
      return NextResponse.json({
        message: "El cliente ya existe",
        clientId: existingClient.id,
      })
    }
    // 4. Crear el registro de cliente
    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        id: userId,
        full_name: fullName || "Cliente",
        email: email || user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (insertError) {
      return NextResponse.json({ error: "Error al crear cliente: " + insertError.message }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      message: "Cliente creado exitosamente",
      client: newClient,
    })
  } catch (error) {
    console.error("Error en create-client:", error)
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
