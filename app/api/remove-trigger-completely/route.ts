import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔧 ELIMINANDO TRIGGER COMPLETAMENTE...')
    
    // Lista de SQL commands para eliminar el trigger
    const sqlCommands = [
      // 1. Eliminar el trigger
      'DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;',
      
      // 2. Eliminar la función del trigger
      'DROP FUNCTION IF EXISTS generate_ejecuciones_ejercicio();',
      
      // 3. Verificar que se eliminó
      `SELECT trigger_name, event_manipulation, event_object_table 
       FROM information_schema.triggers 
       WHERE event_object_table = 'activity_enrollments';`
    ]
    
    const results = []
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`\n📝 Ejecutando comando ${i + 1}/${sqlCommands.length}:`)
      console.log(`SQL: ${sql}`)
      
      try {
        // Intentar con diferentes métodos de ejecución SQL
        let success = false
        
        // Método 1: exec_sql
        try {
          const { data: result1, error: error1 } = await supabase
            .rpc('exec_sql', { sql })
          
          if (!error1) {
            console.log(`✅ Comando ${i + 1} exitoso con exec_sql:`, result1)
            results.push({ command: i + 1, success: true, method: 'exec_sql', result: result1 })
            success = true
          }
        } catch (e) {
          console.log(`⚠️ Error con exec_sql en comando ${i + 1}:`, e)
        }
        
        // Método 2: execute_sql
        if (!success) {
          try {
            const { data: result2, error: error2 } = await supabase
              .rpc('execute_sql', { sql })
            
            if (!error2) {
              console.log(`✅ Comando ${i + 1} exitoso con execute_sql:`, result2)
              results.push({ command: i + 1, success: true, method: 'execute_sql', result: result2 })
              success = true
            }
          } catch (e) {
            console.log(`⚠️ Error con execute_sql en comando ${i + 1}:`, e)
          }
        }
        
        // Método 3: Intentar con SQL directo usando una función personalizada
        if (!success && i < 2) { // Solo para los primeros 2 comandos (eliminación)
          try {
            // Crear función temporal para ejecutar SQL
            const createFunctionSQL = `
              CREATE OR REPLACE FUNCTION temp_execute_sql(sql_text TEXT)
              RETURNS TEXT AS $$
              BEGIN
                EXECUTE sql_text;
                RETURN 'Success';
              EXCEPTION WHEN OTHERS THEN
                RETURN 'Error: ' || SQLERRM;
              END;
              $$ LANGUAGE plpgsql;
            `
            
            const { error: createError } = await supabase
              .rpc('exec_sql', { sql: createFunctionSQL })
            
            if (!createError) {
              const { data: execResult, error: execError } = await supabase
                .rpc('temp_execute_sql', { sql_text: sql })
              
              if (!execError && execResult !== 'Error') {
                console.log(`✅ Comando ${i + 1} exitoso con función temporal:`, execResult)
                results.push({ command: i + 1, success: true, method: 'temp_function', result: execResult })
                success = true
              }
            }
          } catch (e) {
            console.log(`⚠️ Error con función temporal en comando ${i + 1}:`, e)
          }
        }
        
        if (!success) {
          console.log(`❌ Comando ${i + 1} falló con todos los métodos`)
          results.push({ command: i + 1, success: false, sql: sql })
        }
        
      } catch (e) {
        console.log(`❌ Error ejecutando comando ${i + 1}:`, e)
        results.push({ command: i + 1, success: false, error: e, sql: sql })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    console.log(`\n📊 RESUMEN: ${successCount} exitosos, ${failureCount} fallidos`)
    
    // Probar inserción después de eliminar el trigger
    console.log('\n🧪 PROBANDO INSERCIÓN DESPUÉS DE ELIMINAR TRIGGER...')
    
    const testData = {
      activity_id: 78,
      client_id: '00dedc23-0b17-4e50-b84e-b2e8100dc93c',
      status: 'activa'
    }
    
    console.log('📋 Datos de prueba:', testData)
    
    const { data: testResult, error: testError } = await supabase
      .from('activity_enrollments')
      .insert([testData])
      .select()
    
    if (testError) {
      console.log('❌ Error en inserción de prueba:', testError)
      return NextResponse.json({ 
        success: false, 
        error: 'Trigger no se pudo eliminar completamente',
        triggerRemoval: results,
        testInsert: { success: false, error: testError }
      })
    } else {
      console.log('✅ Inserción de prueba exitosa:', testResult)
      return NextResponse.json({ 
        success: true, 
        message: 'Trigger eliminado y inserción funciona',
        triggerRemoval: results,
        testInsert: { success: true, result: testResult }
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




