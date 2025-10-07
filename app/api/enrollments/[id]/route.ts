import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const enrollmentId = params.id
    if (!enrollmentId) {
      return NextResponse.json({ error: "Se requiere ID de inscripción" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("activity_enrollments")
      .select(`
        id, 
        status, 
        progress, 
        amount_paid, 
        payment_status, 
        payment_method,
        transaction_id,
        invoice_number,
        created_at,
        activities (
          id,
          title,
          description,
          image_url,
          price,
          coach_id
        )
      `)
      .eq("id", enrollmentId)
      .single()
    if (error) {
      console.error("Error al obtener inscripción:", error)
      return NextResponse.json({ error: "Error al obtener inscripción" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      enrollment: data,
    })
  } catch (error) {
    console.error("Error en GET /api/enrollments/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
