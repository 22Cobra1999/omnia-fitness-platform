/**
 * Script para verificar detalladamente el storage
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

async function detailedCheck() {
  try {
    const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
    
    console.log('📊 VERIFICACIÓN DETALLADA DE STORAGE\n')
    console.log('═'.repeat(70))

    // 1. Verificar imágenes en Storage
    const { data: imageFiles } = await supabase.storage
      .from('product-media')
      .list(`coaches/${coachId}/images`, { limit: 1000 })

    const validImages = (imageFiles || []).filter(
      f => !f.name.includes('.empty') && !f.name.includes('.keep')
    )

    console.log(`\n🖼️  IMÁGENES EN STORAGE: ${validImages.length}`)
    let totalImageBytes = 0
    validImages.forEach((img, i) => {
      const size = parseInt(img.metadata?.size || img.size || 0)
      totalImageBytes += size
      const sizeMb = (size / (1024 * 1024)).toFixed(2)
      console.log(`   ${i + 1}. ${img.name} (${sizeMb} MB)`)
    })
    const totalImageGb = totalImageBytes / (1024 * 1024 * 1024)
    console.log(`   📊 TOTAL: ${totalImageGb.toFixed(6)} GB (${totalImageBytes} bytes)`)

    // 2. Verificar storage_usage
    const { data: storage } = await supabase
      .from('storage_usage')
      .select('*')
      .eq('coach_id', coachId)

    console.log(`\n📋 STORAGE_USAGE REGISTRADO:`)
    storage?.forEach(s => {
      console.log(`   - ${s.concept}: ${s.gb_usage} GB`)
      console.log(`     file_name: ${s.file_name || 'NULL'}`)
      console.log(`     products: ${JSON.stringify(s.products)}`)
    })

    // 3. Comparar
    const storageImage = storage?.find(s => s.concept === 'image')
    if (storageImage) {
      const storageGb = parseFloat(storageImage.gb_usage)
      console.log(`\n🔍 COMPARACIÓN:`)
      console.log(`   Storage real: ${totalImageGb.toFixed(6)} GB`)
      console.log(`   storage_usage: ${storageGb.toFixed(6)} GB`)
      if (Math.abs(storageGb - totalImageGb) > 0.000001) {
        console.log(`   ⚠️  DISCREPANCIA: ${Math.abs(storageGb - totalImageGb).toFixed(6)} GB`)
      } else {
        console.log(`   ✅ Tamaño coincide`)
      }
      console.log(`\n   Archivos en Storage: ${validImages.length}`)
      console.log(`   file_name en storage_usage: ${storageImage.file_name}`)
      console.log(`   ⚠️  Solo muestra 1 archivo pero hay ${validImages.length}`)
    }

    // 4. Explicación
    console.log(`\n📝 EXPLICACIÓN:`)
    console.log(`   La tabla storage_usage tiene UNIQUE(coach_id, concept)`)
    console.log(`   Esto significa: 1 fila por concepto por coach`)
    console.log(`   Por eso hay ${storage?.length || 0} fila(s) aunque haya ${validImages.length} imágenes`)
    console.log(`   El gb_usage SÍ suma todos los archivos (${totalImageGb.toFixed(6)} GB)`)
    console.log(`   Pero file_name solo muestra el nombre de UN archivo representativo`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

detailedCheck()




























