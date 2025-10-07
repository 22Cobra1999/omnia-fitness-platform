import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Obtener el rol del usuario
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("preferences")
      .eq("user_id", user.id)
      .single()
    const role = userProfile?.preferences?.role
    // Solo permitir a administradores ejecutar migraciones
    if (role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }
    // Obtener el archivo de migración del cuerpo de la solicitud
    const { migrationFile } = await request.json()
    if (!migrationFile) {
      return NextResponse.json({ error: "Archivo de migración no especificado" }, { status: 400 })
    }
    // Construir la ruta al archivo de migración
    const dbDir = path.join(process.cwd(), "db")
    const migrationPath = path.join(dbDir, migrationFile)
    // Verificar que el archivo existe
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({ error: `Archivo de migración no encontrado: ${migrationFile}` }, { status: 404 })
    }
    // Leer el contenido del archivo
    const sqlContent = fs.readFileSync(migrationPath, "utf8")
    // Ejecutar la migración
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql_query: sqlContent })
    if (migrationError) {
      console.error("Error al ejecutar la migración:", migrationError)
      return NextResponse.json({ error: migrationError.message }, { status: 500 })
    }
    // Actualizar la caché del esquema
    await supabase.rpc("reload_schema_cache")
    return NextResponse.json({ success: true, message: "Migración ejecutada correctamente" })
  } catch (error) {
    console.error("Error en la ruta de migración:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
