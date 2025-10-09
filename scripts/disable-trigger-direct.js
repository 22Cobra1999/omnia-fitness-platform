const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qmvnbqzwhfqjvzjqyekf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdm5icXp3aGZxanZ6anF5ZWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTk4NzY5NiwiZXhwIjoyMDMxNTYzNjk2fQ.m3gq6w0yJQzJ4J4J4J4J4J4J4J4J4J4J4J4J4J4J4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function disableTriggerDirect() {
  try {
    console.log('🔍 Verificando triggers en activity_enrollments...')
    
    // Verificar si existe el trigger
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'activity_enrollments')
    
    if (triggerError) {
      console.log('⚠️ Error verificando triggers:', triggerError)
    } else {
      console.log('📋 Triggers encontrados:', triggers)
    }

    // Intentar deshabilitar el trigger usando diferentes métodos
    console.log('🛑 Intentando deshabilitar trigger...')
    
    // Método 1: Usar RPC para ejecutar SQL
    const { data: dropResult, error: dropError } = await supabase
      .rpc('exec_sql', {
        sql: 'DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;'
      })
    
    if (dropError) {
      console.log('⚠️ Error con exec_sql:', dropError)
      
      // Método 2: Usar una función personalizada
      const { data: dropResult2, error: dropError2 } = await supabase
        .rpc('drop_trigger', {
          trigger_name: 'generate_ejecuciones_ejercicio_trigger',
          table_name: 'activity_enrollments'
        })
      
      if (dropError2) {
        console.log('⚠️ Error con función personalizada:', dropError2)
      } else {
        console.log('✅ Trigger deshabilitado con función personalizada:', dropResult2)
      }
    } else {
      console.log('✅ Trigger deshabilitado con exec_sql:', dropResult)
    }

    // Verificar si se deshabilitó
    const { data: triggersAfter, error: triggerErrorAfter } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'activity_enrollments')
    
    if (triggerErrorAfter) {
      console.log('⚠️ Error verificando triggers después:', triggerErrorAfter)
    } else {
      console.log('📋 Triggers después del intento:', triggersAfter)
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

disableTriggerDirect()










