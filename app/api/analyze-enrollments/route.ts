import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔍 ANALIZANDO TABLA ACTIVITY_ENROLLMENTS...')
    
    const results = {
      tableExists: false,
      columns: [],
      existingData: [],
      testInsert: null,
      triggers: [],
      errors: []
    }
    
    // 1. Verificar si la tabla existe
    console.log('\n1️⃣ VERIFICANDO EXISTENCIA DE LA TABLA...')
    try {
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'activity_enrollments')
      
      if (tableError) {
        results.errors.push(`Error verificando tabla: ${tableError.message}`)
      } else {
        results.tableExists = tables && tables.length > 0
        console.log('📋 Tabla existe:', results.tableExists)
      }
    } catch (e) {
      results.errors.push(`Error en verificación de tabla: ${e}`)
    }
    
    // 2. Obtener estructura de columnas
    console.log('\n2️⃣ ESTRUCTURA DE COLUMNAS...')
    try {
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'activity_enrollments')
        .order('ordinal_position')
      
      if (columnError) {
        results.errors.push(`Error obteniendo columnas: ${columnError.message}`)
      } else {
        results.columns = columns || []
        console.log('📊 COLUMNAS ENCONTRADAS:', results.columns.length)
        results.columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
        })
      }
    } catch (e) {
      results.errors.push(`Error en estructura de columnas: ${e}`)
    }
    
    // 3. Verificar datos existentes
    console.log('\n3️⃣ DATOS EXISTENTES...')
    try {
      const { data: existingData, error: dataError } = await supabase
        .from('activity_enrollments')
        .select('*')
        .limit(5)
      
      if (dataError) {
        results.errors.push(`Error obteniendo datos: ${dataError.message}`)
      } else {
        results.existingData = existingData || []
        console.log('📋 Datos existentes:', results.existingData.length, 'registros')
      }
    } catch (e) {
      results.errors.push(`Error en datos existentes: ${e}`)
    }
    
    // 4. Probar inserción de prueba
    console.log('\n4️⃣ PROBANDO INSERCIÓN DE PRUEBA...')
    const testData = {
      activity_id: 78,
      client_id: '00dedc23-0b17-4e50-b84e-b2e8100dc93c',
      status: 'activa'
    }
    
    console.log('📋 Datos de prueba:', testData)
    
    try {
      const { data: insertResult, error: insertError } = await supabase
        .from('activity_enrollments')
        .insert([testData])
        .select()
      
      if (insertError) {
        results.testInsert = {
          success: false,
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        }
        console.log('❌ Error en inserción de prueba:', insertError)
      } else {
        results.testInsert = {
          success: true,
          result: insertResult
        }
        console.log('✅ Inserción de prueba exitosa:', insertResult)
      }
    } catch (e) {
      results.testInsert = {
        success: false,
        error: e
      }
      results.errors.push(`Error en inserción de prueba: ${e}`)
    }
    
    // 5. Verificar triggers activos
    console.log('\n5️⃣ TRIGGERS ACTIVOS...')
    try {
      const { data: triggers, error: triggerError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation, event_object_table, action_statement')
        .eq('event_object_table', 'activity_enrollments')
      
      if (triggerError) {
        results.errors.push(`Error obteniendo triggers: ${triggerError.message}`)
      } else {
        results.triggers = triggers || []
        console.log('🔧 TRIGGERS ACTIVOS:', results.triggers.length)
        results.triggers.forEach(trigger => {
          console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation}`)
        })
      }
    } catch (e) {
      results.errors.push(`Error en triggers: ${e}`)
    }
    
    console.log('\n📊 RESUMEN DEL ANÁLISIS:')
    console.log('- Tabla existe:', results.tableExists)
    console.log('- Columnas encontradas:', results.columns.length)
    console.log('- Datos existentes:', results.existingData.length)
    console.log('- Inserción de prueba:', results.testInsert?.success ? 'ÉXITO' : 'FALLO')
    console.log('- Triggers activos:', results.triggers.length)
    console.log('- Errores:', results.errors.length)
    
    return NextResponse.json({ 
      success: true, 
      analysis: results,
      message: 'Análisis completado'
    })
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}










