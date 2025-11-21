/**
 * Script para verificar archivos en Supabase Storage vs storage_usage
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

async function checkStorageFiles() {
  try {
    console.log('🔍 Verificando archivos en Supabase Storage...\n')

    // Obtener todos los coaches
    const { data: storageUsage } = await supabase
      .from('storage_usage')
      .select('coach_id')
      .limit(100)

    const { data: activities } = await supabase
      .from('activities')
      .select('coach_id')
      .limit(100)

    const coachIds = new Set()
    storageUsage?.forEach(s => coachIds.add(s.coach_id))
    activities?.forEach(a => coachIds.add(a.coach_id))

    console.log(`📊 Coaches encontrados: ${coachIds.size}\n`)

    for (const coachId of coachIds) {
      console.log(`\n👤 Coach: ${coachId}`)
      console.log('═'.repeat(70))

      // 1. Verificar imágenes en Storage
      const { data: imageFiles, error: imgError } = await supabase.storage
        .from('product-media')
        .list(`coaches/${coachId}/images`, { limit: 1000 })

      const validImages = (imageFiles || []).filter(
        f => !f.name.includes('.empty') && !f.name.includes('.keep')
      )

      console.log(`\n🖼️  IMÁGENES en Supabase Storage: ${validImages.length}`)
      if (validImages.length > 0) {
        validImages.forEach((img, i) => {
          const size = img.metadata?.size || img.size || 0
          const sizeMb = (size / (1024 * 1024)).toFixed(2)
          console.log(`   ${i + 1}. ${img.name} (${sizeMb} MB)`)
        })
      }

      // 2. Verificar PDFs en Storage
      const { data: pdfFiles, error: pdfError } = await supabase.storage
        .from('product-media')
        .list(`coaches/${coachId}/pdfs`, { limit: 1000 })

      const validPdfs = (pdfFiles || []).filter(
        f => !f.name.includes('.empty') && !f.name.includes('.keep')
      )

      console.log(`\n📄 PDFs en Supabase Storage: ${validPdfs.length}`)
      if (validPdfs.length > 0) {
        validPdfs.forEach((pdf, i) => {
          const size = pdf.metadata?.size || pdf.size || 0
          const sizeMb = (size / (1024 * 1024)).toFixed(2)
          console.log(`   ${i + 1}. ${pdf.name} (${sizeMb} MB)`)
        })
      }

      // 3. Verificar imágenes en activity_media (referencias en BD)
      const { data: coachActivities } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', coachId)

      const activityIds = coachActivities?.map(a => a.id) || []
      
      let imageReferences = []
      if (activityIds.length > 0) {
        for (const actId of activityIds) {
          const { data } = await supabase
            .from('activity_media')
            .select('id, image_url, pdf_url')
            .eq('activity_id', actId)
          if (data) imageReferences.push(...data)
        }
      }

      const imageUrls = imageReferences.filter(r => r.image_url).map(r => {
        const url = r.image_url
        const match = url.match(/images\/([^/?]+)/)
        return match ? match[1] : null
      }).filter(Boolean)

      const pdfUrls = imageReferences.filter(r => r.pdf_url).map(r => {
        const url = r.pdf_url
        const match = url.match(/pdfs\/([^/?]+)/)
        return match ? match[1] : null
      }).filter(Boolean)

      console.log(`\n📊 COMPARACIÓN:`)
      console.log(`   Imágenes en Storage: ${validImages.length}`)
      console.log(`   Imágenes referenciadas en BD: ${imageUrls.length}`)
      if (validImages.length !== imageUrls.length) {
        console.log(`   ⚠️  DISCREPANCIA: ${Math.abs(validImages.length - imageUrls.length)} archivos sin referenciar`)
        
        const storageNames = validImages.map(i => i.name)
        const missingRefs = storageNames.filter(name => !imageUrls.includes(name))
        if (missingRefs.length > 0) {
          console.log(`   📝 Archivos sin referencia en BD:`)
          missingRefs.forEach(name => console.log(`      - ${name}`))
        }
      }

      console.log(`   PDFs en Storage: ${validPdfs.length}`)
      console.log(`   PDFs referenciados en BD: ${pdfUrls.length}`)
      if (validPdfs.length !== pdfUrls.length) {
        console.log(`   ⚠️  DISCREPANCIA: ${Math.abs(validPdfs.length - pdfUrls.length)} archivos sin referenciar`)
        
        const storageNames = validPdfs.map(p => p.name)
        const missingRefs = storageNames.filter(name => !pdfUrls.includes(name))
        if (missingRefs.length > 0) {
          console.log(`   📝 Archivos sin referencia en BD:`)
          missingRefs.forEach(name => console.log(`      - ${name}`))
        }
      }

      // 4. Verificar storage_usage
      const { data: storage } = await supabase
        .from('storage_usage')
        .select('*')
        .eq('coach_id', coachId)

      console.log(`\n📊 Storage Usage registrado:`)
      storage?.forEach(s => {
        console.log(`   - ${s.concept}: ${s.gb_usage} GB (${s.file_name || 'sin nombre'})`)
      })

      // Calcular tamaño real
      const totalImageBytes = validImages.reduce((sum, img) => {
        return sum + (parseInt(img.metadata?.size || img.size || 0))
      }, 0)
      const totalPdfBytes = validPdfs.reduce((sum, pdf) => {
        return sum + (parseInt(pdf.metadata?.size || pdf.size || 0))
      }, 0)

      const totalImageGb = totalImageBytes / (1024 * 1024 * 1024)
      const totalPdfGb = totalPdfBytes / (1024 * 1024 * 1024)

      console.log(`\n📊 Tamaños calculados:`)
      console.log(`   Imágenes: ${totalImageGb.toFixed(6)} GB (${validImages.length} archivos)`)
      console.log(`   PDFs: ${totalPdfGb.toFixed(6)} GB (${validPdfs.length} archivos)`)

      const storageImage = storage?.find(s => s.concept === 'image')
      const storagePdf = storage?.find(s => s.concept === 'pdf')

      if (storageImage && Math.abs(parseFloat(storageImage.gb_usage) - totalImageGb) > 0.000001) {
        console.log(`   ⚠️  DISCREPANCIA en imágenes: Storage dice ${storageImage.gb_usage} GB pero Storage tiene ${totalImageGb.toFixed(6)} GB`)
      }

      if (storagePdf && Math.abs(parseFloat(storagePdf.gb_usage) - totalPdfGb) > 0.000001) {
        console.log(`   ⚠️  DISCREPANCIA en PDFs: Storage dice ${storagePdf.gb_usage} GB pero Storage tiene ${totalPdfGb.toFixed(6)} GB`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

checkStorageFiles()





























