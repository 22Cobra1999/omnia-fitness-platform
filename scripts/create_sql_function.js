const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createFunction() {
  try {
    console.log('🔥 Creando función SQL para actualizar ejecuciones...')
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('./sql/fix_execution_completion.sql', 'utf8')
    
    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    })
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error)
      return
    }
    
    console.log('✅ Función SQL creada exitosamente:', data)
    
  } catch (error) {
    console.error('❌ Error creando función:', error)
  }
}

createFunction()
