/**
 * Script para verificar que todos los archivos estén en storage_usage
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

async function verifyStorage() {
  try {
    console.log('🔍 Verificando completitud de storage_usage...\n')

    // 1. Obtener todos los coaches desde storage_usage y activities
    const { data: storageCoaches } = await supabase
      .from('storage_usage')
      .select('coach_id')
      .limit(100)

    const { data: activityCoaches } = await supabase
      .from('activities')
      .select('coach_id')
      .limit(100)

    // Combinar y obtener unique coach IDs
    const coachIds = new Set()
    storageCoaches?.forEach(s => coachIds.add(s.coach_id))
    activityCoaches?.forEach(a => coachIds.add(a.coach_id))

    const uniqueCoachIds = Array.from(coachIds)

    console.log(`📊 Coaches únicos encontrados: ${uniqueCoachIds.length}\n`)

    // 2. Para cada coach, verificar sus archivos
    for (const coachId of uniqueCoachIds) {
      console.log(`\n👤 Coach: ${coachId}`)
      console.log('─'.repeat(60))

      // Obtener actividades del coach
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', coachId)

      const activityIds = activities?.map(a => a.id) || []

      if (activityIds.length > 0) {
        // Videos en ejercicios_detalles - usar RPC o query directa
        let videosEj = []
        for (const actId of activityIds.slice(0, 10)) { // Limitar para no sobrecargar
          const { data } = await supabase
            .from('ejercicios_detalles')
            .select('id, video_url, bunny_video_id, nombre_ejercicio, activity_id')
            .contains('activity_id', { [actId]: {} })
            .not('video_url', 'is', null)
            .neq('video_url', '')
          if (data) videosEj.push(...data)
        }

        // Media - usar RPC o query directa
        let videosMedia = []
        for (const actId of activityIds.slice(0, 10)) {
          const { data } = await supabase
            .from('activity_media')
            .select('id, video_url, bunny_video_id, image_url, pdf_url, activity_id')
            .eq('activity_id', actId)
          if (data) videosMedia.push(...data)
        }

        // Contar archivos reales
        const videosCount = (videosEj?.filter(v => v.video_url)?.length || 0) + 
                           (videosMedia?.filter(v => v.video_url)?.length || 0)
        const imagesCount = videosMedia?.filter(v => v.image_url)?.length || 0
        const pdfsCount = videosMedia?.filter(v => v.pdf_url)?.length || 0

        // Verificar storage_usage
        const { data: storageUsage, error: suError } = await supabase
          .from('storage_usage')
          .select('*')
          .eq('coach_id', coachId)

        console.log(`   📹 Videos encontrados: ${videosCount}`)
        console.log(`   🖼️  Imágenes encontradas: ${imagesCount}`)
        console.log(`   📄 PDFs encontrados: ${pdfsCount}`)
        console.log(`   📊 Filas en storage_usage: ${storageUsage?.length || 0}`)

        if (storageUsage && storageUsage.length > 0) {
          storageUsage.forEach(row => {
            console.log(`      - ${row.concept}: ${row.gb_usage} GB (file_name: ${row.file_name || 'NULL'})`)
          })
        } else {
          console.log(`      ⚠️  No hay filas en storage_usage para este coach`)
        }

        // Verificar si faltan conceptos
        const conceptsInStorage = storageUsage?.map(s => s.concept) || []
        if (videosCount > 0 && !conceptsInStorage.includes('video')) {
          console.log(`      ⚠️  FALTA: concepto 'video' en storage_usage`)
        }
        if (imagesCount > 0 && !conceptsInStorage.includes('image')) {
          console.log(`      ⚠️  FALTA: concepto 'image' en storage_usage`)
        }
        if (pdfsCount > 0 && !conceptsInStorage.includes('pdf')) {
          console.log(`      ⚠️  FALTA: concepto 'pdf' en storage_usage`)
        }
      } else {
        console.log(`   ℹ️  No tiene actividades`)
      }
    }

    // 3. Resumen global
    console.log(`\n\n📊 RESUMEN GLOBAL`)
    console.log('═'.repeat(60))

    // Videos de todas las fuentes
    const { data: allVideosEj } = await supabase
      .from('ejercicios_detalles')
      .select('id, video_url, activity_id')
      .not('video_url', 'is', null)
      .neq('video_url', '')

    const { data: allVideosNut } = await supabase
      .from('nutrition_program_details')
      .select('id, video_url, activity_id')
      .not('video_url', 'is', null)
      .neq('video_url', '')

    const { data: allMedia } = await supabase
      .from('activity_media')
      .select('id, video_url, image_url, pdf_url, activity_id')

    const { data: allStorage } = await supabase
      .from('storage_usage')
      .select('*')
      .not('gb_usage', 'eq', 0)

    const totalVideos = (allVideosEj?.length || 0) + 
                       (allMedia?.filter(m => m.video_url)?.length || 0) +
                       (allVideosNut?.length || 0)
    const totalImages = allMedia?.filter(m => m.image_url)?.length || 0
    const totalPdfs = allMedia?.filter(m => m.pdf_url)?.length || 0

    console.log(`\n📹 Total videos en BD:`)
    console.log(`   - ejercicios_detalles: ${allVideosEj?.length || 0}`)
    console.log(`   - activity_media: ${allMedia?.filter(m => m.video_url)?.length || 0}`)
    console.log(`   - nutrition_program_details: ${allVideosNut?.length || 0}`)
    console.log(`   - TOTAL: ${totalVideos}`)
    console.log(`🖼️  Total imágenes en BD: ${totalImages}`)
    console.log(`📄 Total PDFs en BD: ${totalPdfs}`)
    console.log(`\n📊 Filas en storage_usage (con uso > 0): ${allStorage?.length || 0}`)

    if (allStorage && allStorage.length > 0) {
      const byConcept = {}
      allStorage.forEach(row => {
        if (!byConcept[row.concept]) {
          byConcept[row.concept] = { count: 0, totalGb: 0 }
        }
        byConcept[row.concept].count++
        byConcept[row.concept].totalGb += parseFloat(row.gb_usage || 0)
      })

      console.log(`\n   Por concepto:`)
      Object.entries(byConcept).forEach(([concept, data]) => {
        console.log(`   - ${concept}: ${data.count} fila(s), ${data.totalGb.toFixed(6)} GB total`)
      })
    }

    // Verificar discrepancias
    const videosInStorage = allStorage?.filter(s => s.concept === 'video').length || 0
    const imagesInStorage = allStorage?.filter(s => s.concept === 'image').length || 0
    const pdfsInStorage = allStorage?.filter(s => s.concept === 'pdf').length || 0

    console.log(`\n⚠️  DISCREPANCIAS:`)
    if (totalVideos > 0 && videosInStorage === 0) {
      console.log(`   ❌ Hay ${totalVideos} videos pero 0 filas en storage_usage`)
    } else if (totalVideos > 0 && videosInStorage > 0) {
      console.log(`   ✅ Videos: ${totalVideos} archivos → ${videosInStorage} fila(s) en storage_usage`)
    }

    if (totalImages > 0 && imagesInStorage === 0) {
      console.log(`   ❌ Hay ${totalImages} imágenes pero 0 filas en storage_usage`)
    } else if (totalImages > 0 && imagesInStorage > 0) {
      console.log(`   ✅ Imágenes: ${totalImages} archivos → ${imagesInStorage} fila(s) en storage_usage`)
    }

    if (totalPdfs > 0 && pdfsInStorage === 0) {
      console.log(`   ❌ Hay ${totalPdfs} PDFs pero 0 filas en storage_usage`)
    } else if (totalPdfs > 0 && pdfsInStorage > 0) {
      console.log(`   ✅ PDFs: ${totalPdfs} archivos → ${pdfsInStorage} fila(s) en storage_usage`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

verifyStorage()

