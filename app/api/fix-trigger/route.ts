import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔧 DESHABILITANDO TRIGGER PROBLEMÁTICO...')
    
    // Intentar deshabilitar el trigger usando diferentes métodos
    const dropTriggerSQL = `
      DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;
    `
    
    console.log('🛑 Ejecutando SQL para deshabilitar trigger...')
    console.log('SQL:', dropTriggerSQL)
    
    // Método 1: Usar rpc con exec_sql si existe
    try {
      const { data: result1, error: error1 } = await supabase
        .rpc('exec_sql', { sql: dropTriggerSQL })
      
      if (!error1) {
        console.log('✅ Trigger deshabilitado con exec_sql:', result1)
        return NextResponse.json({ 
          success: true, 
          message: 'Trigger deshabilitado exitosamente',
          method: 'exec_sql'
        })
      } else {
        console.log('⚠️ exec_sql no disponible:', error1)
      }
    } catch (e) {
      console.log('⚠️ Error con exec_sql:', e)
    }
    
    // Método 2: Usar rpc con execute_sql si existe
    try {
      const { data: result2, error: error2 } = await supabase
        .rpc('execute_sql', { sql: dropTriggerSQL })
      
      if (!error2) {
        console.log('✅ Trigger deshabilitado con execute_sql:', result2)
        return NextResponse.json({ 
          success: true, 
          message: 'Trigger deshabilitado exitosamente',
          method: 'execute_sql'
        })
      } else {
        console.log('⚠️ execute_sql no disponible:', error2)
      }
    } catch (e) {
      console.log('⚠️ Error con execute_sql:', e)
    }
    
    // Método 3: Crear función temporal para deshabilitar trigger
    try {
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION disable_problematic_trigger()
        RETURNS TEXT AS $$
        BEGIN
          DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;
          RETURN 'Trigger disabled successfully';
        END;
        $$ LANGUAGE plpgsql;
      `
      
      const { data: funcResult, error: funcError } = await supabase
        .rpc('exec_sql', { sql: createFunctionSQL })
      
      if (!funcError) {
        console.log('✅ Función creada, ejecutándola...')
        
        const { data: execResult, error: execError } = await supabase
          .rpc('disable_problematic_trigger')
        
        if (!execError) {
          console.log('✅ Trigger deshabilitado con función temporal:', execResult)
          return NextResponse.json({ 
            success: true, 
            message: 'Trigger deshabilitado exitosamente',
            method: 'temporary_function'
          })
        } else {
          console.log('⚠️ Error ejecutando función temporal:', execError)
        }
      } else {
        console.log('⚠️ Error creando función temporal:', funcError)
      }
    } catch (e) {
      console.log('⚠️ Error con función temporal:', e)
    }
    
    console.log('❌ No se pudo deshabilitar el trigger con ningún método')
    return NextResponse.json({ 
      success: false, 
      error: 'No se pudo deshabilitar el trigger',
      message: 'Todos los métodos fallaron'
    }, { status: 500 })
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}