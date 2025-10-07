import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔍 ANALYZE DEPENDENCIES: Analizando dependencias de la tabla activities')

    try {
      const dependencies: { [key: string]: any } = {}

      // Tablas que podrían tener referencias a activities
      const relatedTables = [
        'ejercicios_detalles',
        'planificacion_ejercicios', 
        'periodos',
        'activity_media',
        'purchases',
        'fitness_exercises',
        'user_activities',
        'activity_sessions',
        'activity_reviews',
        'activity_likes',
        'activity_comments'
      ]

      console.log('🔄 ANALYZE DEPENDENCIES: Verificando tablas relacionadas...')

      for (const table of relatedTables) {
        try {
          // Intentar hacer un select para ver si la tabla existe
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

          if (error) {
            if (error.message.includes('does not exist')) {
              dependencies[table] = { exists: false, error: 'Tabla no existe' }
            } else {
              dependencies[table] = { exists: true, error: error.message }
            }
          } else {
            dependencies[table] = { exists: true, count: data.length, sample: data[0] }
          }
        } catch (err) {
          dependencies[table] = { exists: false, error: err.message }
        }
      }

      // Verificar específicamente la actividad 60
      console.log('🔄 ANALYZE DEPENDENCIES: Verificando datos de la actividad 60...')
      
      const activity60Data: { [key: string]: any } = {}
      
      for (const table of relatedTables) {
        if (dependencies[table].exists) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .eq('activity_id', '60')

            if (!error) {
              activity60Data[table] = { count: data.length, data: data }
            } else {
              activity60Data[table] = { count: 0, error: error.message }
            }
          } catch (err) {
            activity60Data[table] = { count: 0, error: err.message }
          }
        }
      }

      console.log('✅ ANALYZE DEPENDENCIES: Análisis completado')

      return NextResponse.json({
        success: true,
        message: 'Análisis de dependencias completado',
        tables: dependencies,
        activity60Data: activity60Data,
        summary: {
          existingTables: Object.keys(dependencies).filter(t => dependencies[t].exists),
          nonExistingTables: Object.keys(dependencies).filter(t => !dependencies[t].exists),
          tablesWithActivity60Data: Object.keys(activity60Data).filter(t => activity60Data[t].count > 0)
        }
      })

    } catch (error) {
      console.error('❌ ANALYZE DEPENDENCIES: Error general:', error)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ ANALYZE DEPENDENCIES: Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico del servidor'
    }, { status: 500 })
  }
}

















