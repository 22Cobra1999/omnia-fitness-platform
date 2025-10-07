import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔍 ANALYZE ALL TABLES: Analizando TODAS las tablas de Supabase')

    try {
      const allTables: { [key: string]: any } = {}

      // Lista completa de tablas que podrían existir en la app
      const possibleTables = [
        // Tablas principales
        'activities',
        'users',
        'coaches',
        'clients',
        
        // Tablas de compras y transacciones
        'purchases',
        'orders',
        'transactions',
        'payments',
        'subscriptions',
        'user_subscriptions',
        
        // Tablas de ejercicios y actividades
        'ejercicios_detalles',
        'planificacion_ejercicios',
        'periodos',
        'activity_media',
        'fitness_exercises',
        'exercises',
        'workouts',
        'sessions',
        
        // Tablas de usuarios y actividades
        'user_activities',
        'user_purchases',
        'client_activities',
        'activity_sessions',
        'user_sessions',
        'activity_progress',
        'user_progress',
        
        // Tablas de reviews y feedback
        'activity_reviews',
        'reviews',
        'ratings',
        'feedback',
        'activity_likes',
        'likes',
        'activity_comments',
        'comments',
        
        // Tablas de notificaciones
        'notifications',
        'user_notifications',
        'activity_notifications',
        
        // Tablas de analytics
        'activity_views',
        'user_activity_views',
        'analytics',
        'activity_stats',
        'user_stats',
        
        // Tablas de configuración
        'settings',
        'user_settings',
        'activity_settings',
        'coach_settings',
        
        // Tablas de archivos
        'files',
        'uploads',
        'documents',
        'media',
        
        // Tablas de categorías
        'categories',
        'activity_categories',
        'exercise_categories',
        
        // Tablas de tags
        'tags',
        'activity_tags',
        'exercise_tags',
        
        // Tablas de horarios
        'schedules',
        'availability',
        'time_slots',
        
        // Tablas de mensajes
        'messages',
        'conversations',
        'chat_messages',
        
        // Tablas de seguimiento
        'tracking',
        'activity_tracking',
        'user_tracking',
        'progress_tracking'
      ]

      console.log('🔄 ANALYZE ALL TABLES: Verificando existencia de tablas...')

      for (const table of possibleTables) {
        try {
          // Intentar hacer un select para ver si la tabla existe
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

          if (error) {
            if (error.message.includes('does not exist')) {
              allTables[table] = { exists: false, error: 'Tabla no existe' }
            } else {
              allTables[table] = { exists: true, error: error.message }
            }
          } else {
            allTables[table] = { 
              exists: true, 
              count: data.length, 
              sample: data[0],
              columns: data.length > 0 ? Object.keys(data[0]) : []
            }
          }
        } catch (err) {
          allTables[table] = { exists: false, error: err.message }
        }
      }

      // Verificar específicamente la actividad 60 en todas las tablas existentes
      console.log('🔄 ANALYZE ALL TABLES: Verificando datos de la actividad 60...')
      
      const activity60Data: { [key: string]: any } = {}
      const existingTables = Object.keys(allTables).filter(t => allTables[t].exists)
      
      for (const table of existingTables) {
        try {
          // Intentar diferentes nombres de columna que podrían referenciar activity_id
          const possibleColumns = ['activity_id', 'actividad_id', 'activityId', 'actividadId']
          
          for (const column of possibleColumns) {
            try {
              const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq(column, '60')

              if (!error && data.length > 0) {
                activity60Data[table] = { 
                  column: column,
                  count: data.length, 
                  data: data,
                  impact: 'ALTO - Datos relacionados encontrados'
                }
                break
              }
            } catch (err) {
              // Columna no existe, continuar con la siguiente
            }
          }
          
          // Si no se encontraron datos, marcar como sin impacto
          if (!activity60Data[table]) {
            activity60Data[table] = { 
              count: 0, 
              impact: 'BAJO - Sin datos relacionados' 
            }
          }
        } catch (err) {
          activity60Data[table] = { 
            count: 0, 
            error: err.message,
            impact: 'DESCONOCIDO - Error al verificar'
          }
        }
      }

      console.log('✅ ANALYZE ALL TABLES: Análisis completado')

      // Clasificar tablas por impacto
      const highImpactTables = Object.keys(activity60Data).filter(t => 
        activity60Data[t].impact === 'ALTO - Datos relacionados encontrados'
      )
      
      const lowImpactTables = Object.keys(activity60Data).filter(t => 
        activity60Data[t].impact === 'BAJO - Sin datos relacionados'
      )

      return NextResponse.json({
        success: true,
        message: 'Análisis completo de todas las tablas',
        totalTables: possibleTables.length,
        existingTables: existingTables.length,
        nonExistingTables: possibleTables.length - existingTables.length,
        tables: allTables,
        activity60Data: activity60Data,
        impactAnalysis: {
          highImpact: highImpactTables,
          lowImpact: lowImpactTables,
          unknownImpact: Object.keys(activity60Data).filter(t => 
            activity60Data[t].impact === 'DESCONOCIDO - Error al verificar'
          )
        },
        recommendation: highImpactTables.length > 0 
          ? 'NO ELIMINAR - Hay datos relacionados que se perderían'
          : 'SEGURO ELIMINAR - No hay datos relacionados'
      })

    } catch (error) {
      console.error('❌ ANALYZE ALL TABLES: Error general:', error)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ ANALYZE ALL TABLES: Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico del servidor'
    }, { status: 500 })
  }
}
















