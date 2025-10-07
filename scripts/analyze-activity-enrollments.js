const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qmvnbqzwhfqjvzjqyekf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdm5icXp3aGZxanZ6anF5ZWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTk4NzY5NiwiZXhwIjoyMDMxNTYzNjk2fQ.m3gq6w0yJQzJ4J4J4J4J4J4J4J4J4J4J4J4J4J4J4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeActivityEnrollments() {
  try {
    console.log('🔍 ANALIZANDO TABLA ACTIVITY_ENROLLMENTS...')
    
    // 1. Verificar si la tabla existe
    console.log('\n1️⃣ VERIFICANDO EXISTENCIA DE LA TABLA...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'activity_enrollments')
    
    if (tableError) {
      console.log('⚠️ Error verificando tabla:', tableError)
    } else {
      console.log('📋 Tablas encontradas:', tables)
    }
    
    // 2. Obtener estructura de columnas
    console.log('\n2️⃣ ESTRUCTURA DE COLUMNAS...')
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'activity_enrollments')
      .order('ordinal_position')
    
    if (columnError) {
      console.log('⚠️ Error obteniendo columnas:', columnError)
    } else {
      console.log('📊 COLUMNAS DE ACTIVITY_ENROLLMENTS:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
        if (col.column_default) {
          console.log(`    Default: ${col.column_default}`)
        }
      })
    }
    
    // 3. Verificar datos existentes
    console.log('\n3️⃣ DATOS EXISTENTES...')
    const { data: existingData, error: dataError } = await supabase
      .from('activity_enrollments')
      .select('*')
      .limit(5)
    
    if (dataError) {
      console.log('⚠️ Error obteniendo datos:', dataError)
    } else {
      console.log('📋 Datos existentes:', existingData)
    }
    
    // 4. Probar inserción de prueba
    console.log('\n4️⃣ PROBANDO INSERCIÓN DE PRUEBA...')
    const testData = {
      activity_id: 78,
      client_id: '00dedc23-0b17-4e50-b84e-b2e8100dc93c',
      status: 'activa'
    }
    
    console.log('📋 Datos de prueba:', testData)
    
    const { data: insertResult, error: insertError } = await supabase
      .from('activity_enrollments')
      .insert([testData])
      .select()
    
    if (insertError) {
      console.log('❌ Error en inserción de prueba:', insertError)
      console.log('🔍 Código del error:', insertError.code)
      console.log('🔍 Mensaje del error:', insertError.message)
      console.log('🔍 Detalles del error:', insertError.details)
    } else {
      console.log('✅ Inserción de prueba exitosa:', insertResult)
    }
    
    // 5. Verificar triggers activos
    console.log('\n5️⃣ TRIGGERS ACTIVOS...')
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, event_object_table, action_statement')
      .eq('event_object_table', 'activity_enrollments')
    
    if (triggerError) {
      console.log('⚠️ Error obteniendo triggers:', triggerError)
    } else {
      console.log('🔧 TRIGGERS ACTIVOS:')
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation}`)
        console.log(`    Statement: ${trigger.action_statement}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

analyzeActivityEnrollments()




