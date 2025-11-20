/**
 * Script para verificar los datos de storage_usage
 */

const fs = require('fs')
const path = require('path')

// Leer .env y .env.local (ambos para obtener todas las variables)
const envPaths = ['.env', '.env.local']
let envLoaded = false

for (const envPath of envPaths) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', envPath), 'utf8')
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const [, key, value] = match
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
        }
      }
    })
    envLoaded = true
  } catch (e) {
    // Ignorar errores
  }
}

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function verificarStorage() {
  console.log('🔍 Verificando storage_usage...\n')
  
  const { data, error } = await supabase
    .from('storage_usage')
    .select('*')
    .order('concept')
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('📊 Datos en storage_usage:\n')
  
  for (const row of data || []) {
    console.log(`${row.concept.toUpperCase()}:`)
    console.log(`  Coach: ${row.coach_id}`)
    console.log(`  GB usado: ${row.gb_usage} (${(row.gb_usage * 1024).toFixed(2)} MB)`)
    console.log(`  Actividades: ${JSON.stringify(row.products)}`)
    console.log(`  Actualizado: ${new Date(row.updated_at).toLocaleString()}`)
    console.log('')
  }
  
  console.log(`✅ Total: ${data?.length || 0} registros`)
}

verificarStorage().catch(console.error)





























