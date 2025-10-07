import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET() {
  try {
    console.log("API debug/coaches: Iniciando diagnóstico")
    const supabase = createRouteHandlerClient({ cookies })
    // 1. Verificar la sesión
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError) {
      console.error("Error de sesión:", sessionError)
      return NextResponse.json(
        {
          status: "error",
          message: "Error al verificar la sesión",
          error: sessionError,
        },
        { status: 500 },
      )
    }
    const isAuthenticated = !!session
    // 2. Intentar obtener coaches (limitado a 3)
    const { data: coaches, error: coachesError } = await supabase
      .from("coaches")
      .select("id, specialization, experience_years")
      .limit(3)
    if (coachesError) {
      console.error("Error al obtener coaches:", coachesError)
      return NextResponse.json(
        {
          status: "error",
          message: "Error al obtener coaches",
          error: coachesError,
          isAuthenticated,
        },
        { status: 500 },
      )
    }
    // 3. Verificar políticas
    const { data: policies, error: policiesError } = await supabase.rpc("get_table_policies", { table_name: "coaches" })
    // 4. Verificar tablas
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .limit(10)
    return NextResponse.json({
      status: "success",
      isAuthenticated,
      userId: session?.user?.id || null,
      coaches: coaches || [],
      coachesCount: coaches?.length || 0,
      policies: policies || [],
      policiesError: policiesError || null,
      tables: tables || [],
      tablesError: tablesError || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en diagnóstico de coaches:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error interno en diagnóstico",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
