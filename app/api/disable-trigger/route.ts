import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔍 Deshabilitando trigger problemático...')
    
    // Intentar deshabilitar el trigger
    const { data: result, error } = await supabase
      .rpc('exec_sql', {
        sql: 'DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;'
      })
    
    if (error) {
      console.log('⚠️ Error deshabilitando trigger:', error)
      
      // Intentar con método alternativo
      const { data: result2, error: error2 } = await supabase
        .rpc('execute_sql', {
          sql: 'DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;'
        })
      
      if (error2) {
        console.log('⚠️ También falló el método alternativo:', error2)
        return NextResponse.json({ 
          success: false, 
          error: 'No se pudo deshabilitar el trigger',
          details: error2 
        })
      } else {
        console.log('✅ Trigger deshabilitado con método alternativo')
        return NextResponse.json({ 
          success: true, 
          message: 'Trigger deshabilitado exitosamente',
          method: 'execute_sql'
        })
      }
    } else {
      console.log('✅ Trigger deshabilitado exitosamente')
      return NextResponse.json({ 
        success: true, 
        message: 'Trigger deshabilitado exitosamente',
        method: 'exec_sql'
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}




