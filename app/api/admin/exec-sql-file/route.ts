import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const { filename } = await request.json() as { filename?: string }
    if (!filename) {
      return NextResponse.json({ error: "filename requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Faltan credenciales de Supabase" }, { status: 500 })
    }

    const filePath = path.join(process.cwd(), "db", filename)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Archivo no encontrado: ${filename}` }, { status: 404 })
    }
    const sql = fs.readFileSync(filePath, "utf8")

    const supabase = createClient(supabaseUrl, serviceKey)

    // Intentar ejecutar función RPC exec_sql(sql_query text)
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Ejecutado ${filename}` })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 })
  }
}




























