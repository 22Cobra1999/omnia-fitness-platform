import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // 1. Verificar la sesión actual
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json(
        {
          error: "No hay sesión activa",
          details: sessionError,
        },
        { status: 401 },
      )
    }
    const userId = session.user.id
    // 2. Intentar una inserción de prueba
    const testData = {
      activity_id: 1, // Usar un ID de actividad que exista
      client_id: userId,
      status: "test",
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data: insertTest, error: insertError } = await supabase
      .from("activity_enrollments")
      .insert(testData)
      .select()
    // 3. Intentar una consulta de prueba
    const { data: selectTest, error: selectError } = await supabase.from("activity_enrollments").select("*").limit(5)
    // 4. Verificar políticas de seguridad
    const { data: policiesData, error: policiesError } = await supabase
      .rpc("get_policies_info", { table_name: "activity_enrollments" })
      .catch(() => ({ data: null, error: { message: "Función RPC no disponible" } }))
    // 5. Devolver resultados de diagnóstico
    return NextResponse.json({
      session: {
        userId: userId,
        email: session.user.email,
        role: session.user.role,
      },
      insertTest: {
        success: !insertError,
        data: insertTest,
        error: insertError,
      },
      selectTest: {
        success: !selectError,
        count: selectTest?.length || 0,
        error: selectError,
      },
      policies: {
        success: !policiesError,
        data: policiesData,
        error: policiesError,
      },
      testData: testData,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error en diagnóstico de permisos",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
