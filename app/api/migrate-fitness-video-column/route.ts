// ⚠️ ARCHIVO OBSOLETO - Usa tabla fitness_exercises que ya no existe
// Este endpoint ya no es necesario con el nuevo esquema modular
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Verificar que el usuario es coach
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (userProfile?.role !== "coach") {
      return NextResponse.json({ error: "Solo los coaches pueden ejecutar migraciones" }, { status: 403 })
    }
    // console.log('🔧 Iniciando migración para agregar columna video_url a fitness_exercises')
    // Verificar si la columna ya existe
    const { data: columns, error: checkError } = await supabase
      .rpc('get_table_columns', { table_name: 'fitness_exercises' })
    if (checkError) {
      console.log('⚠️ No se pudo verificar columnas existentes, procediendo con la migración')
    } else {
      const hasVideoUrl = columns?.some((col: any) => col.column_name === 'video_url')
      if (hasVideoUrl) {
        // console.log('✅ La columna video_url ya existe en fitness_exercises')
        return NextResponse.json({ 
          success: true, 
          message: 'La columna video_url ya existe' 
        })
      }
    }
    // Agregar la columna video_url
    console.log('➕ Agregando columna video_url a fitness_exercises')
    const { error: alterError } = await supabase
      .rpc('add_column_if_not_exists', {
        table_name: 'fitness_exercises',
        column_name: 'video_url',
        column_type: 'TEXT'
      })
    if (alterError) {
      console.error('❌ Error agregando columna video_url:', alterError)
      // Intentar con SQL directo como fallback
      // console.log('🔄 Intentando con SQL directo...')
      const { error: sqlError } = await supabase
        .rpc('execute_sql', {
          sql_query: 'ALTER TABLE fitness_exercises ADD COLUMN IF NOT EXISTS video_url TEXT;'
        })
      if (sqlError) {
        console.error('❌ Error con SQL directo:', sqlError)
        return NextResponse.json({ 
          error: "Error agregando columna video_url",
          details: alterError.message 
        }, { status: 500 })
      }
    }
    // Crear índice para mejorar consultas
    // // console.log('📊 Creando índice para video_url')
    const { error: indexError } = await supabase
      .rpc('execute_sql', {
        sql_query: 'CREATE INDEX IF NOT EXISTS idx_fitness_exercises_video_url ON fitness_exercises(video_url);'
      })
    if (indexError) {
      console.warn('⚠️ Error creando índice (puede que ya exista):', indexError)
    }
    // console.log('✅ Migración completada exitosamente')
    return NextResponse.json({
      success: true,
      message: 'Columna video_url agregada exitosamente a fitness_exercises'
    })
  } catch (error) {
    console.error("Error en migración:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
