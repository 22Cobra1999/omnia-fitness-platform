import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🧪 TEST DELETE 60: Probando eliminación directa de actividad 60')

    try {
      // Intentar eliminar la actividad 60 directamente
      console.log('🗑️ TEST DELETE 60: Eliminando actividad 60...')
      
      const { data: deleteResult, error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', '60')
        .select()

      if (!deleteError) {
        console.log('✅ TEST DELETE 60: Eliminación exitosa:', deleteResult)
        return NextResponse.json({
          success: true,
          message: 'Actividad 60 eliminada exitosamente',
          deletedActivity: deleteResult
        })
      }

      console.log('⚠️ TEST DELETE 60: Error en eliminación:', deleteError.message)

      // Si el error es por fitness_exercises, dar instrucciones
      if (deleteError.message.includes('fitness_exercises')) {
        return NextResponse.json({
          success: false,
          error: 'Error por trigger con tabla vieja',
          details: deleteError.message,
          solution: 'Eliminar el trigger problemático en Supabase',
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

      return NextResponse.json({
        success: false,
        error: 'Error eliminando actividad 60',
        details: deleteError.message
      }, { status: 500 })

    } catch (error) {
      console.error('❌ TEST DELETE 60: Error general:', error)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ TEST DELETE 60: Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico del servidor'
    }, { status: 500 })
  }
}
















