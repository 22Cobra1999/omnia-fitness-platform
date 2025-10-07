import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id
    if (!clientId) {
      return NextResponse.json({ error: "ID de cliente no proporcionado" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar si el cliente existe
    const { data: client, error } = await supabase
      .from("clients")
      .select("id, full_name, email")
      .eq("id", clientId)
      .single()
    if (error) {
      console.error("Error al buscar cliente:", error)
      return NextResponse.json({ error: "Error al buscar cliente" }, { status: 500 })
    }
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }
    return NextResponse.json(client)
  } catch (error) {
    console.error("Error en el endpoint de cliente:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
