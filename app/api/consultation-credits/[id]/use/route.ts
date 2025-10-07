import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const creditId = Number.parseInt(params.id)
    // Obtener el crédito actual
    const { data: credit, error: fetchError } = await supabase
      .from("client_consultation_credits")
      .select("*")
      .eq("id", creditId)
      .single()
    if (fetchError || !credit) {
      return NextResponse.json({ error: "Crédito no encontrado" }, { status: 404 })
    }
    // Verificar que el usuario tiene permisos (es el cliente o el coach)
    if (credit.client_id !== user.id && credit.coach_id !== user.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }
    // Verificar que quedan sesiones disponibles
    if (credit.remaining_sessions <= 0) {
      return NextResponse.json({ error: "No quedan sesiones disponibles" }, { status: 400 })
    }
    // Incrementar sesiones usadas
    const { data: updatedCredit, error: updateError } = await supabase
      .from("client_consultation_credits")
      .update({
        used_sessions: credit.used_sessions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditId)
      .select()
      .single()
    if (updateError) {
      console.error("Error updating consultation credit:", updateError)
      return NextResponse.json({ error: "Error al actualizar crédito" }, { status: 500 })
    }
    return NextResponse.json(updatedCredit)
  } catch (error) {
    console.error("Error in use consultation credit API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
