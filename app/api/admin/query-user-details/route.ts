import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('[query-user-details] Iniciando consulta de estructura de tablas')

    // 1. Verificar estructura de user_injuries
    const { data: injuriesSchema, error: injuriesError } = await supabase
      .rpc('get_table_schema', { table_name: 'user_injuries' })

    if (injuriesError) {
      console.log('[query-user-details] Error en user_injuries:', injuriesError)
    }

    // 2. Verificar estructura de user_biometrics
    const { data: biometricsSchema, error: biometricsError } = await supabase
      .rpc('get_table_schema', { table_name: 'user_biometrics' })

    if (biometricsError) {
      console.log('[query-user-details] Error en user_biometrics:', biometricsError)
    }

    // 3. Verificar estructura de user_exercise_objectives
    const { data: objectivesSchema, error: objectivesError } = await supabase
      .rpc('get_table_schema', { table_name: 'user_exercise_objectives' })

    if (objectivesError) {
      console.log('[query-user-details] Error en user_exercise_objectives:', objectivesError)
    }

    // 4. Consulta directa usando SQL
    const { data: directQuery, error: directError } = await supabase
      .from('user_injuries')
      .select('*')
      .limit(1)

    if (directError) {
      console.log('[query-user-details] Error en consulta directa:', directError)
    }

    // 5. Obtener datos de ejemplo de cada tabla
    const { data: injuriesData } = await supabase
      .from('user_injuries')
      .select('*')
      .limit(3)

    const { data: biometricsData } = await supabase
      .from('user_biometrics')
      .select('*')
      .limit(3)

    const { data: objectivesData } = await supabase
      .from('user_exercise_objectives')
      .select('*')
      .limit(3)

    return NextResponse.json({
      success: true,
      data: {
        injuries: {
          schema: injuriesSchema,
          sample_data: injuriesData,
          error: injuriesError
        },
        biometrics: {
          schema: biometricsSchema,
          sample_data: biometricsData,
          error: biometricsError
        },
        objectives: {
          schema: objectivesSchema,
          sample_data: objectivesData,
          error: objectivesError
        },
        direct_query: {
          data: directQuery,
          error: directError
        }
      }
    })

  } catch (error) {
    console.error('[query-user-details] Error general:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
































