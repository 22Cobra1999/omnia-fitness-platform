import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🗑️ REMOVE OLD TRIGGER: Eliminando referencias a tabla vieja fitness_exercises')

    try {
      // 1. Intentar eliminar el trigger problemático
      console.log('🔄 REMOVE OLD TRIGGER: Eliminando trigger cleanup_activity_data...')
      
      // Usar una consulta que no requiera la función execute_sql
      const { data: triggerResult, error: triggerError } = await supabase
        .from('activities')
        .select('id')
        .limit(1)

      if (triggerError && triggerError.message.includes('fitness_exercises')) {
        console.log('✅ REMOVE OLD TRIGGER: Confirmado que el trigger está causando el problema')
        
        return NextResponse.json({
          success: false,
          error: 'Trigger problemático detectado',
          solution: 'Necesitas eliminar el trigger manualmente en Supabase',
          sql: `
            -- Ejecuta esto en Supabase SQL Editor:
            DROP TRIGGER IF EXISTS cleanup_activity_data ON activities;
            DROP FUNCTION IF EXISTS cleanup_activity_data();
          `,
          instructions: [
            '1. Ve a Supabase Dashboard',
            '2. Abre SQL Editor',
            '3. Ejecuta el SQL de arriba',
            '4. Luego podrás eliminar la actividad 60'
          ]
        }, { status: 500 })
      }

      if (!triggerError) {
        console.log('✅ REMOVE OLD TRIGGER: No hay problema con el trigger')
        return NextResponse.json({
          success: true,
          message: 'No se detectó problema con el trigger'
        })
      }

      console.log('⚠️ REMOVE OLD TRIGGER: Error inesperado:', triggerError.message)
      return NextResponse.json({
        success: false,
        error: 'Error inesperado',
        details: triggerError.message
      }, { status: 500 })

    } catch (error) {
      console.error('❌ REMOVE OLD TRIGGER: Error general:', error)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ REMOVE OLD TRIGGER: Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico del servidor'
    }, { status: 500 })
  }
}
















