import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const activityId = params.id
    // console.log("🔄 POST /api/activities/[id]/rating - Actualizando rating:", activityId)
    const data = await request.json()
    const { rating } = data // 'like', 'dislike', or null
    console.log("📋 Rating recibido:", rating)
    const supabase = createRouteHandlerClient({ cookies })
    // Obtener usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Usuario no autenticado" }, { status: 401 })
    }
    // Buscar enrollment existente
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("activity_enrollments")
      .select("id, metadata")
      .eq("activity_id", activityId)
      .eq("client_id", user.id)
      .maybeSingle()
    if (enrollmentError) {
      console.error("❌ Error buscando enrollment:", enrollmentError)
      return NextResponse.json(
        { success: false, error: `Error buscando enrollment: ${enrollmentError.message}` },
        { status: 500 },
      )
    }
    if (!enrollment) {
      return NextResponse.json({ success: false, error: "No estás inscrito en esta actividad" }, { status: 404 })
    }
    // Actualizar metadata con el nuevo rating
    const currentMetadata = enrollment.metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      user_rating: rating, // null para remover rating
      rating_updated_at: new Date().toISOString(),
    }
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from("activity_enrollments")
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollment.id)
      .select()
      .single()
    if (updateError) {
      console.error("❌ Error actualizando rating:", updateError)
      return NextResponse.json(
        { success: false, error: `Error actualizando rating: ${updateError.message}` },
        { status: 500 },
      )
    }
    // Obtener contadores actualizados de la actividad
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("total_likes, total_dislikes")
      .eq("id", activityId)
      .single()
    if (activityError) {
      console.error("❌ Error obteniendo contadores:", activityError)
    }
    // console.log("✅ Rating actualizado exitosamente")
    return NextResponse.json({
      success: true,
      message: rating ? `Rating actualizado a ${rating}` : "Rating eliminado",
      data: {
        user_rating: rating,
        total_likes: activity?.total_likes || 0,
        total_dislikes: activity?.total_dislikes || 0,
      },
    })
  } catch (error) {
    console.error("💥 Error en POST /api/activities/[id]/rating:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const activityId = params.id
    // console.log("🔍 GET /api/activities/[id]/rating - Obteniendo ratings:", activityId)
    const supabase = createRouteHandlerClient({ cookies })
    // Obtener contadores de la actividad
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("total_likes, total_dislikes")
      .eq("id", activityId)
      .single()
    if (activityError) {
      console.error("❌ Error obteniendo actividad:", activityError)
      return NextResponse.json(
        { success: false, error: `Error obteniendo actividad: ${activityError.message}` },
        { status: 500 },
      )
    }
    // Obtener rating del usuario actual (si está autenticado)
    let userRating = null
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: enrollment } = await supabase
        .from("activity_enrollments")
        .select("metadata")
        .eq("activity_id", activityId)
        .eq("client_id", user.id)
        .maybeSingle()
      if (enrollment?.metadata?.user_rating) {
        userRating = enrollment.metadata.user_rating
      }
    }
    // console.log("✅ Ratings obtenidos exitosamente")
    return NextResponse.json({
      success: true,
      data: {
        total_likes: activity.total_likes || 0,
        total_dislikes: activity.total_dislikes || 0,
        user_rating: userRating,
        rating_percentage:
          activity.total_likes + activity.total_dislikes > 0
            ? Math.round((activity.total_likes / (activity.total_likes + activity.total_dislikes)) * 100)
            : 0,
      },
    })
  } catch (error) {
    console.error("💥 Error en GET /api/activities/[id]/rating:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
