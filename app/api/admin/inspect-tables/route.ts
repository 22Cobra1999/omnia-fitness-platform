import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('[inspect-tables] Inspeccionando estructura real de las tablas')

    const tables = ['user_injuries', 'user_biometrics', 'user_exercise_objectives']
    const results = {}

    for (const table of tables) {
      try {
        // Obtener una muestra de datos para ver las columnas reales
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          results[table] = {
            exists: false,
            error: error.message
          }
        } else {
          // Si hay datos, mostrar la estructura
          const sampleRecord = data && data.length > 0 ? data[0] : null
          const columns = sampleRecord ? Object.keys(sampleRecord) : []
          
          results[table] = {
            exists: true,
            columns: columns,
            sample_data: sampleRecord,
            error: null
          }
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
    console.error('[inspect-tables] Error general:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
































