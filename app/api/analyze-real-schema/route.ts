import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔍 ANALYZE REAL SCHEMA: Analizando esquema real de la base de datos')

    try {
      // Intentar obtener todas las tablas usando información del esquema
      const allTables: { [key: string]: any } = {}

      // Lista más exhaustiva de tablas posibles
      const possibleTables = [
        // Tablas principales del sistema
        'activities', 'users', 'coaches', 'clients', 'profiles',
        
        // Tablas de autenticación y usuarios
        'auth.users', 'auth.sessions', 'auth.identities',
        'user_profiles', 'user_settings', 'user_preferences',
        
        // Tablas de compras y transacciones
        'purchases', 'orders', 'order_items', 'transactions', 'payments',
        'subscriptions', 'user_subscriptions', 'subscription_plans',
        'billing', 'invoices', 'receipts',
        
        // Tablas de actividades y ejercicios
        'ejercicios_detalles', 'planificacion_ejercicios', 'periodos',
        'activity_media', 'activity_files', 'activity_documents',
        'fitness_exercises', 'exercises', 'workouts', 'sessions',
        'activity_sessions', 'user_sessions', 'coach_sessions',
        
        // Tablas de relaciones usuario-actividad
        'user_activities', 'user_purchases', 'client_activities',
        'activity_enrollments', 'activity_participants',
        'user_activity_progress', 'activity_progress', 'user_progress',
        
        // Tablas de contenido y media
        'media', 'files', 'uploads', 'documents', 'images', 'videos',
        'activity_images', 'activity_videos', 'activity_pdfs',
        
        // Tablas de categorías y tags
        'categories', 'activity_categories', 'exercise_categories',
        'tags', 'activity_tags', 'exercise_tags', 'user_tags',
        
        // Tablas de reviews y feedback
        'reviews', 'activity_reviews', 'coach_reviews', 'user_reviews',
        'ratings', 'activity_ratings', 'coach_ratings',
        'feedback', 'activity_feedback', 'user_feedback',
        'likes', 'activity_likes', 'user_likes',
        'comments', 'activity_comments', 'user_comments',
        
        // Tablas de notificaciones
        'notifications', 'user_notifications', 'activity_notifications',
        'system_notifications', 'email_notifications',
        
        // Tablas de analytics y tracking
        'analytics', 'activity_analytics', 'user_analytics',
        'activity_views', 'user_activity_views', 'page_views',
        'activity_stats', 'user_stats', 'coach_stats',
        'tracking', 'activity_tracking', 'user_tracking', 'progress_tracking',
        
        // Tablas de configuración
        'settings', 'user_settings', 'activity_settings', 'coach_settings',
        'system_settings', 'app_settings', 'feature_flags',
        
        // Tablas de horarios y disponibilidad
        'schedules', 'availability', 'time_slots', 'appointments',
        'coach_availability', 'client_availability',
        
        // Tablas de mensajería
        'messages', 'conversations', 'chat_messages', 'direct_messages',
        'group_messages', 'message_attachments',
        
        // Tablas de seguimiento y progreso
        'progress', 'milestones', 'achievements', 'badges',
        'user_achievements', 'activity_milestones',
        
        // Tablas de pagos y facturación
        'payment_methods', 'payment_history', 'refunds',
        'coupons', 'discounts', 'promotions',
        
        // Tablas de eventos y calendario
        'events', 'calendar_events', 'activity_events',
        'reminders', 'notifications_schedule',
        
        // Tablas de reportes
        'reports', 'activity_reports', 'user_reports', 'coach_reports',
        'financial_reports', 'usage_reports',
        
        // Tablas de logs y auditoría
        'logs', 'activity_logs', 'user_logs', 'system_logs',
        'audit_trail', 'error_logs', 'access_logs',
        
        // Tablas de integraciones
        'integrations', 'api_keys', 'webhooks', 'external_services',
        
        // Tablas de geolocalización
        'locations', 'addresses', 'coordinates', 'regions',
        
        // Tablas de idiomas y localización
        'languages', 'translations', 'localization',
        
        // Tablas de permisos y roles
        'roles', 'permissions', 'user_roles', 'role_permissions',
        
        // Tablas de versiones
        'versions', 'migrations', 'schema_versions',
        
        // Tablas de cache
        'cache', 'sessions_cache', 'data_cache',
        
        // Tablas de backup
        'backups', 'data_backups', 'restore_points'
      ]

      console.log('🔄 ANALYZE REAL SCHEMA: Verificando existencia de tablas...')

      for (const table of possibleTables) {
        try {
          // Intentar hacer un select para ver si la tabla existe
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

          if (error) {
            if (error.message.includes('does not exist') || 
                error.message.includes('relation') ||
                error.message.includes('permission denied')) {
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
      console.log('🔄 ANALYZE REAL SCHEMA: Verificando datos de la actividad 60...')
      
      const activity60Data: { [key: string]: any } = {}
      const existingTables = Object.keys(allTables).filter(t => allTables[t].exists)
      
      for (const table of existingTables) {
        try {
          // Intentar diferentes nombres de columna que podrían referenciar activity_id
          const possibleColumns = [
            'activity_id', 'actividad_id', 'activityId', 'actividadId',
            'id', 'activity', 'actividad', 'product_id', 'productId'
          ]
          
          let foundData = false
          
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
                foundData = true
                break
              }
            } catch (err) {
              // Columna no existe, continuar con la siguiente
            }
          }
          
          // Si no se encontraron datos, marcar como sin impacto
          if (!foundData) {
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

      console.log('✅ ANALYZE REAL SCHEMA: Análisis completado')

      // Clasificar tablas por impacto
      const highImpactTables = Object.keys(activity60Data).filter(t => 
        activity60Data[t].impact === 'ALTO - Datos relacionados encontrados'
      )
      
      const lowImpactTables = Object.keys(activity60Data).filter(t => 
        activity60Data[t].impact === 'BAJO - Sin datos relacionados'
      )

      const unknownImpactTables = Object.keys(activity60Data).filter(t => 
        activity60Data[t].impact === 'DESCONOCIDO - Error al verificar'
      )

      return NextResponse.json({
        success: true,
        message: 'Análisis completo del esquema real',
        totalTablesChecked: possibleTables.length,
        existingTables: existingTables.length,
        nonExistingTables: possibleTables.length - existingTables.length,
        tables: allTables,
        activity60Data: activity60Data,
        impactAnalysis: {
          highImpact: highImpactTables,
          lowImpact: lowImpactTables,
          unknownImpact: unknownImpactTables
        },
        existingTablesList: existingTables,
        recommendation: highImpactTables.length > 0 
          ? 'NO ELIMINAR - Hay datos relacionados que se perderían'
          : 'SEGURO ELIMINAR - No hay datos relacionados'
      })

    } catch (error) {
      console.error('❌ ANALYZE REAL SCHEMA: Error general:', error)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ ANALYZE REAL SCHEMA: Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico del servidor'
    }, { status: 500 })
  }
}
















