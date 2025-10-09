const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qmvnbqzwhfqjvzjqyekf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdm5icXp3aGZxanZ6anF5ZWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTk4NzY5NiwiZXhwIjoyMDMxNTYzNjk2fQ.m3gq6w0yJQzJ4J4J4J4J4J4J4J4J4J4J4J4J4J4J4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function disableTrigger() {
  try {
    console.log('🔍 Verificando triggers activos...')
    
    // Verificar triggers existentes
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT trigger_name, event_manipulation, event_object_table 
          FROM information_schema.triggers 
          WHERE event_object_table = 'activity_enrollments'
        `
      })
    
    if (triggerError) {
      console.log('⚠️ Error verificando triggers:', triggerError)
    } else {
      console.log('📋 Triggers encontrados:', triggers)
    }

    // Deshabilitar el trigger problemático
    console.log('🛑 Deshabilitando trigger...')
    const { data: disableResult, error: disableError } = await supabase
      .rpc('exec_sql', {
        sql: 'DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;'
      })
    
    if (disableError) {
      console.log('⚠️ Error deshabilitando trigger:', disableError)
    } else {
      console.log('✅ Trigger deshabilitado:', disableResult)
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

disableTrigger()










