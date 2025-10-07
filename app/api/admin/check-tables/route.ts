import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('[check-tables] Verificando estructura de tablas de usuario')

    // Consulta simple para verificar si las tablas existen y obtener datos de ejemplo
    const tables = ['user_injuries', 'user_biometrics', 'user_exercise_objectives']
    const results = {}

    for (const table of tables) {
      try {
        // Intentar obtener datos de ejemplo
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(2)

        results[table] = {
          exists: true,
          sample_data: data,
          error: error
        }
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      tables: results
    })

  } catch (error) {
    console.error('[check-tables] Error general:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


























