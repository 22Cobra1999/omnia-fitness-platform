import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // 1. Verificar la estructura de la tabla
    const { data: tableInfo, error: tableError } = await supabase
      .rpc("get_table_info", { table_name: "activity_enrollments" })
      .catch(() => {
        // Si la función RPC no existe, hacemos una consulta simple
        return supabase.from("activity_enrollments").select("*").limit(0)
      })
    // 2. Verificar las políticas de seguridad
    const { data: policiesInfo, error: policiesError } = await supabase
      .rpc("get_policies_info", { table_name: "activity_enrollments" })
      .catch(() => ({ data: null, error: { message: "No se pudo obtener información de políticas" } }))
    // 3. Verificar restricciones y triggers
    const { data: constraintsInfo, error: constraintsError } = await supabase
      .rpc("get_constraints_info", { table_name: "activity_enrollments" })
      .catch(() => ({ data: null, error: { message: "No se pudo obtener información de restricciones" } }))
    // 4. Verificar permisos del usuario actual
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    let userPermissions = null
    let userId = null
    if (session) {
      userId = session.user.id
      // Intentar una operación simple para verificar permisos
      const { error: selectError } = await supabase.from("activity_enrollments").select("id").limit(1)
      const { error: insertError } = await supabase
        .from("activity_enrollments")
        .insert({ activity_id: 1, client_id: userId, status: "test_permission" })
        .select()
        .then((res) => {
          // Si la inserción fue exitosa, eliminar el registro de prueba
          if (!res.error && res.data && res.data.length > 0) {
            supabase
              .from("activity_enrollments")
              .delete()
              .eq("id", res.data[0].id)
              .then(() => console.log("Registro de prueba eliminado"))
          }
          return res
        })
      userPermissions = {
        canSelect: !selectError,
        canInsert: !insertError,
        selectError: selectError ? selectError.message : null,
        insertError: insertError ? insertError.message : null,
      }
    }
    return NextResponse.json({
      tableExists: !tableError,
      tableInfo: tableInfo,
      policies: policiesInfo,
      constraints: constraintsInfo,
      user: {
        isAuthenticated: !!session,
        userId: userId,
        permissions: userPermissions,
      },
      errors: {
        tableError: tableError ? tableError.message : null,
        policiesError: policiesError ? policiesError.message : null,
        constraintsError: constraintsError ? constraintsError.message : null,
        sessionError: sessionError ? sessionError.message : null,
      },
    })
  } catch (error) {
    console.error("Error en check-table:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar la tabla",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
