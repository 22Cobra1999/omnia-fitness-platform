/**
 * Script para verificar el estado de la migración file_name
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
const envPaths = ['.env', '.env.local']
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
  } catch (e) {
    // Ignorar
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkStatus() {
  try {
    console.log('🔍 Verificando estado de la migración...\n')

    // Verificar si la columna existe
    const { data: allData, error } = await supabase
      .from('storage_usage')
      .select('*')
      .not('gb_usage', 'eq', 0)
      .limit(100)

    if (error) {
      console.error('❌ Error consultando:', error.message)
      return
    }

    if (!allData || allData.length === 0) {
      console.log('ℹ️  No hay filas con uso de almacenamiento')
      return
    }

    console.log(`📊 Total de filas con uso: ${allData.length}\n`)

    // Verificar cuántas tienen file_name
    const withFileName = allData.filter(row => row.file_name && row.file_name.trim() !== '')
    const withoutFileName = allData.filter(row => !row.file_name || row.file_name.trim() === '')

    console.log(`✅ Filas CON file_name: ${withFileName.length}`)
    console.log(`❌ Filas SIN file_name: ${withoutFileName.length}\n`)

    if (withFileName.length > 0) {
      console.log('📝 Ejemplos de filas CON file_name:')
      withFileName.slice(0, 5).forEach(row => {
        console.log(`   - ${row.concept}: "${row.file_name}" (${row.gb_usage} GB)`)
      })
    }

    if (withoutFileName.length > 0) {
      console.log('\n⚠️  Filas que necesitan migración:')
      withoutFileName.slice(0, 5).forEach(row => {
        console.log(`   - ${row.concept}: sin file_name (${row.gb_usage} GB)`)
      })
    }

    // Verificar estructura
    const firstRow = allData[0]
    const hasFileNameColumn = 'file_name' in firstRow
    console.log(`\n🔍 Estructura:`)
    console.log(`   - Columna file_name existe: ${hasFileNameColumn ? '✅' : '❌'}`)

    if (withoutFileName.length > 0) {
      console.log(`\n⚠️  Necesitas ejecutar la migración para ${withoutFileName.length} filas`)
    } else if (withFileName.length === allData.length) {
      console.log(`\n✅ Todas las filas tienen file_name - migración completada`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkStatus()




























