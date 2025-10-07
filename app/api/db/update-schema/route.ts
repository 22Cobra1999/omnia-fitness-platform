import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export async function POST(request: Request) {
  try {
    // Crear cliente de Supabase con la clave de servicio
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Faltan las credenciales de Supabase" }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Intentar ejecutar SQL directamente (esto puede no funcionar dependiendo de los permisos)
    try {
      // Verificar si la columna existe
      const { data: columnExists, error: checkError } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "activities")
        .eq("column_name", "rich_description")
        .single()
      if (checkError) {
        console.error("Error al verificar la columna:", checkError)
      }
      // Si la columna no existe, intentar crearla
      if (!columnExists) {
        // Nota: Esto probablemente fallará sin permisos adecuados
        const { error: alterError } = await supabase.rpc("alter_table_add_column", {
          table_name: "activities",
          column_name: "rich_description",
          column_type: "TEXT",
        })
        if (alterError) {
          console.error("Error al crear la columna:", alterError)
          throw alterError
        }
      }
      return NextResponse.json({
        success: true,
        message: "Esquema de base de datos actualizado correctamente",
      })
    } catch (sqlError) {
      console.error("Error al ejecutar SQL directo:", sqlError)
      // Plan B: Sugerir al usuario que contacte al administrador
      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo actualizar el esquema automáticamente. Por favor, contacte al administrador para añadir la columna 'rich_description' a la tabla 'activities'.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error al actualizar el esquema:", error)
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
