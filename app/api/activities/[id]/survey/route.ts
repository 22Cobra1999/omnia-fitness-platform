import { type NextRequest, NextResponse } from "next/server"
import { createClientWithCookies } from "../../../../../lib/supabase-server"
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const activityId = params.id
    // console.log("🔄 POST /api/activities/[id]/survey - Guardando encuesta:", activityId)
    const data = await request.json()
    const { difficulty_rating, coach_method_rating, would_repeat, comments } = data
    console.log("📋 Datos de encuesta recibidos:", data)
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);
    
    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log("🔐 Sesión obtenida:", session ? `${session.user.email} (${session.user.id})` : 'null')
    console.log("❌ Error de sesión:", sessionError)
    
    if (sessionError || !session) {
      console.error("❌ Error de autenticación:", sessionError?.message || "Sesión no encontrada")
      return NextResponse.json({ success: false, error: "Usuario no autenticado" }, { status: 401 })
    }
    
    const user = session.user;
    // Buscar enrollment para obtener el enrollment_id
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("activity_enrollments")
      .select("id")
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
    // Insertar o actualizar encuesta
    const surveyData = {
      activity_id: Number.parseInt(activityId),
      client_id: user.id,
      enrollment_id: enrollment.id,
      difficulty_rating: difficulty_rating || null,
      coach_method_rating: coach_method_rating || null,
      would_repeat: would_repeat !== null ? would_repeat : null,
      comments: comments || null,
      updated_at: new Date().toISOString(),
    }
    const { data: survey, error: surveyError } = await supabase
      .from("activity_surveys")
      .upsert(surveyData, {
        onConflict: "activity_id,client_id",
      })
      .select()
      .single()
    if (surveyError) {
      console.error("❌ Error guardando encuesta:", surveyError)
      return NextResponse.json(
        { success: false, error: `Error guardando encuesta: ${surveyError.message}` },
        { status: 500 },
      )
    }
    // console.log("✅ Encuesta guardada exitosamente:", survey.id)
    return NextResponse.json({
      success: true,
      message: "Encuesta guardada exitosamente",
      data: survey,
    })
  } catch (error) {
    console.error("💥 Error en POST /api/activities/[id]/survey:", error)
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
    // console.log("🔍 GET /api/activities/[id]/survey - Obteniendo encuestas:", activityId)
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);
    // Obtener estadísticas agregadas de la encuesta
    const { data: surveys, error: surveysError } = await supabase
      .from("activity_surveys")
      .select("*")
      .eq("activity_id", activityId)
    if (surveysError) {
      console.error("❌ Error obteniendo encuestas:", surveysError)
      return NextResponse.json(
        { success: false, error: `Error obteniendo encuestas: ${surveysError.message}` },
        { status: 500 },
      )
    }
    // Calcular estadísticas
    const totalSurveys = surveys.length
    const avgDifficulty =
      surveys.length > 0
        ? surveys.reduce((sum, s) => sum + (s.difficulty_rating || 0), 0) /
          surveys.filter((s) => s.difficulty_rating).length
        : 0
    const avgCoachMethod =
      surveys.length > 0
        ? surveys.reduce((sum, s) => sum + (s.coach_method_rating || 0), 0) /
          surveys.filter((s) => s.coach_method_rating).length
        : 0
    const wouldRepeatCount = surveys.filter((s) => s.would_repeat === true).length
    const wouldRepeatPercentage = totalSurveys > 0 ? (wouldRepeatCount / totalSurveys) * 100 : 0
    // console.log("✅ Estadísticas de encuesta calculadas")
    return NextResponse.json({
      success: true,
      data: {
        total_surveys: totalSurveys,
        avg_difficulty: Math.round(avgDifficulty * 10) / 10,
        avg_coach_method: Math.round(avgCoachMethod * 10) / 10,
        would_repeat_percentage: Math.round(wouldRepeatPercentage),
        would_repeat_count: wouldRepeatCount,
        surveys: surveys,
      },
    })
  } catch (error) {
    console.error("💥 Error en GET /api/activities/[id]/survey:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
