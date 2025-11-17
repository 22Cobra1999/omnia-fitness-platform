/**
 * Script para poblar la tabla storage_usage con datos históricos
 * Calcula el storage de todos los coaches y lo inserta en la BD
 */

// Cargar variables de entorno manualmente
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
    console.log(`✅ Variables de entorno cargadas desde ${envPath}`)
    envLoaded = true
  } catch (e) {
    console.log(`⚠️ No se pudo cargar ${envPath}`)
  }
}

if (!envLoaded) {
  console.log('⚠️ No se pudo cargar ningún archivo .env')
}

const { createClient } = require('@supabase/supabase-js')

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY
const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID

console.log('🔍 Variables:', {
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_KEY,
  hasBunnyKey: !!BUNNY_API_KEY,
  hasLibraryId: !!BUNNY_LIBRARY_ID
})

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Obtiene el tamaño de un video desde Bunny
 */
async function getBunnyVideoSize(videoId) {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )

    if (!response.ok) {
      return 0
    }

    const data = await response.json()
    return data.storageSize || 0 // bytes
  } catch (error) {
    console.error(`Error obteniendo video ${videoId}:`, error.message)
    return 0
  }
}

/**
 * Obtiene el tamaño de archivos en Supabase Storage
 */
async function getSupabaseStorageSize(coachId, folder) {
  try {
    const { data: files, error } = await supabase.storage
      .from('product-media')
      .list(`coaches/${coachId}/${folder}`, { limit: 1000 })

    if (error) {
      console.error(`Error listando archivos de ${folder}:`, error)
      return 0
    }

    let totalBytes = 0
    for (const file of files || []) {
      if (file.name.includes('.keep') || file.name.includes('.empty')) continue
      
      const size = file.metadata?.size || file.size
      if (size) {
        totalBytes += parseInt(size)
      }
    }

    return totalBytes
  } catch (error) {
    console.error(`Error calculando storage de ${folder}:`, error.message)
    return 0
  }
}

/**
 * Calcula y guarda el storage para un coach
 */
async function calculateAndSaveCoachStorage(coachId) {
  console.log(`\n📊 Calculando storage para coach: ${coachId}`)

  // 1. Obtener IDs de videos únicos del coach
  const videoIdsSet = new Set()

  // Videos de activity_media
  const { data: activityMedia } = await supabase
    .from('activity_media')
    .select('bunny_video_id, activity_id')

  if (activityMedia) {
    const coachActivities = new Set()
    const { data: activities } = await supabase
      .from('activities')
      .select('id')
      .eq('coach_id', coachId)
    
    if (activities) {
      activities.forEach(a => coachActivities.add(a.id))
    }

    for (const media of activityMedia) {
      if (media.bunny_video_id && coachActivities.has(media.activity_id)) {
        videoIdsSet.add(media.bunny_video_id)
      }
    }
  }

  // Videos de ejercicios_detalles
  const { data: ejercicios } = await supabase
    .from('ejercicios_detalles')
    .select('bunny_video_id, activity_id')
    .eq('coach_id', coachId)

  if (ejercicios) {
    for (const ejercicio of ejercicios) {
      if (ejercicio.bunny_video_id) {
        videoIdsSet.add(ejercicio.bunny_video_id)
      }
    }
  }

  // Videos de nutrition_program_details
  // Nota: nutrition_program_details NO tiene bunny_video_id, solo video_url
  // Por ahora no se calculan videos de nutrition en el storage ya que usan video_url de Supabase
  // TODO: Si se migran a Bunny, agregar soporte aquí

  // Calcular tamaño de videos
  console.log(`  📹 Calculando ${videoIdsSet.size} videos...`)
  let videoSizeBytes = 0
  for (const videoId of videoIdsSet) {
    videoSizeBytes += await getBunnyVideoSize(videoId)
  }
  const videoGb = videoSizeBytes / (1024 * 1024 * 1024)

  // Calcular tamaño de imágenes
  console.log(`  🖼️ Calculando imágenes...`)
  const imageSizeBytes = await getSupabaseStorageSize(coachId, 'images')
  const imageGb = imageSizeBytes / (1024 * 1024 * 1024)

  // Calcular tamaño de PDFs
  console.log(`  📄 Calculando PDFs...`)
  const pdfSizeBytes = await getSupabaseStorageSize(coachId, 'pdfs')
  const pdfGb = pdfSizeBytes / (1024 * 1024 * 1024)

  console.log(`  ✅ Resultados:`)
  console.log(`     Video: ${videoGb.toFixed(4)} GB (${videoSizeBytes} bytes)`)
  console.log(`     Imagen: ${imageGb.toFixed(4)} GB (${imageSizeBytes} bytes)`)
  console.log(`     PDF: ${pdfGb.toFixed(4)} GB (${pdfSizeBytes} bytes)`)
  console.log(`     Total: ${(videoGb + imageGb + pdfGb).toFixed(4)} GB`)

  // Guardar en storage_usage
  const storageData = []

  // Guardar todo (incluso si es 0.000001 GB para poder ver el uso real)
  if (videoSizeBytes > 0) {
    // Obtener SOLO actividades que tienen videos con títulos
    const videoActivitySet = new Set()
    const videoActivityNames = []
    
    // Videos de activity_media - obtener todas las activities del coach primero
    const { data: coachActivities } = await supabase
      .from('activities')
      .select('id, title')
      .eq('coach_id', coachId)
    const coachActivityIds = (coachActivities || []).map(a => a.id)
    const activityNamesMap = new Map((coachActivities || []).map(a => [a.id, a.title]))
    
    if (coachActivityIds.length > 0) {
      const { data: amVideos } = await supabase
        .from('activity_media')
        .select('activity_id')
        .not('video_url', 'is', null)
        .in('activity_id', coachActivityIds)
      
      if (amVideos) {
        amVideos.forEach(m => {
          videoActivitySet.add(m.activity_id)
          if (activityNamesMap.has(m.activity_id)) {
            videoActivityNames.push(activityNamesMap.get(m.activity_id))
          }
        })
      }
    }
    
    // Videos de ejercicios_detalles - extraer nombres de archivos
    const { data: ejVideos } = await supabase
      .from('ejercicios_detalles')
      .select('activity_id, video_url, bunny_video_id, nombre_ejercicio, id')
      .eq('coach_id', coachId)
      .not('video_url', 'is', null)
      .neq('video_url', '')
      .order('id', { ascending: true })
      .limit(1)
    
    let videoFileName = null
    if (ejVideos && ejVideos.length > 0) {
      const video = ejVideos[0]
      if (video.nombre_ejercicio && video.nombre_ejercicio.trim() !== '') {
        videoFileName = video.nombre_ejercicio + '.mp4'
      } else if (video.bunny_video_id) {
        videoFileName = 'video_' + video.bunny_video_id.substring(0, 12) + '.mp4'
      } else if (video.video_url) {
        // Extraer nombre de archivo de la URL
        const urlMatch = video.video_url.match(/\/([^/?#]+\.(mp4|mov|avi|webm))$/) || 
                        video.video_url.match(/\/([^/?#]+)$/)
        videoFileName = urlMatch ? urlMatch[1] : ('video_' + video.id + '.mp4')
      }
      ejVideos.forEach(e => videoActivitySet.add(e.activity_id))
    }
    
    // Si no hay video en ejercicios_detalles, buscar en activity_media
    if (!videoFileName) {
      const { data: amVideos } = await supabase
        .from('activity_media')
        .select('id, video_url, bunny_video_id, activity_id')
        .in('activity_id', Array.from(videoActivitySet))
        .not('video_url', 'is', null)
        .neq('video_url', '')
        .order('id', { ascending: true })
        .limit(1)
      
      if (amVideos && amVideos.length > 0) {
        const video = amVideos[0]
        if (video.bunny_video_id) {
          videoFileName = 'video_' + video.bunny_video_id.substring(0, 12) + '.mp4'
        } else if (video.video_url) {
          const urlMatch = video.video_url.match(/\/([^/?#]+\.(mp4|mov|avi|webm))$/) || 
                          video.video_url.match(/\/([^/?#]+)$/)
          videoFileName = urlMatch ? urlMatch[1] : ('video_' + video.id + '.mp4')
        }
      }
    }
    
    // Videos de nutrition_program_details
    const { data: nutVideos } = await supabase
      .from('nutrition_program_details')
      .select('activity_id')
      .eq('coach_id', coachId)
      .not('video_url', 'is', null)
    
    if (nutVideos) {
      nutVideos.forEach(n => videoActivitySet.add(n.activity_id))
    }
    
    const videoActivityIds = Array.from(videoActivitySet)
    if (!videoFileName) {
      videoFileName = 'video.mp4'
    }
    
    storageData.push({
      coach_id: coachId,
      concept: 'video',
      gb_usage: parseFloat(videoGb.toFixed(6)),
      products: videoActivityIds,
      file_name: videoFileName
    })
  }

  if (imageSizeBytes > 0) {
    // Obtener actividades del coach
    const { data: coachActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('coach_id', coachId)
    const coachActivityIds = (coachActivities || []).map(a => a.id)
    
    // Obtener primera imagen para extraer nombre de archivo
    const { data: firstImage } = await supabase
      .from('activity_media')
      .select('id, image_url, activity_id')
      .in('activity_id', coachActivityIds.length > 0 ? coachActivityIds : [0])
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('id', { ascending: true })
      .limit(1)
    
    let imageFileName = null
    if (firstImage && firstImage.length > 0) {
      const img = firstImage[0]
      if (img.image_url) {
        // Extraer nombre de archivo de la URL
        const urlMatch = img.image_url.match(/\/([^/?#]+)$/) || 
                        img.image_url.match(/\/([^/?#]+)\?/)
        imageFileName = urlMatch ? urlMatch[1] : ('imagen_' + img.id + '.jpg')
      }
    }
    
    // Obtener todas las actividades con imágenes para el array products
    const { data: imageActivities } = await supabase
      .from('activity_media')
      .select('activity_id')
      .not('image_url', 'is', null)
      .in('activity_id', coachActivityIds.length > 0 ? coachActivityIds : [0])
    
    const imageActivityIds = [...new Set((imageActivities || []).map(a => a.activity_id))]
    
    if (!imageFileName) {
      imageFileName = 'imagen.jpg'
    }
    
    storageData.push({
      coach_id: coachId,
      concept: 'image',
      gb_usage: parseFloat(imageGb.toFixed(6)),
      products: imageActivityIds,
      file_name: imageFileName
    })
  }

  if (pdfSizeBytes > 0) {
    // Obtener actividades del coach
    const { data: coachActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('coach_id', coachId)
    const coachActivityIds = (coachActivities || []).map(a => a.id)
    
    // Obtener primer PDF para extraer nombre de archivo
    const { data: firstPdf } = await supabase
      .from('activity_media')
      .select('id, pdf_url, activity_id')
      .in('activity_id', coachActivityIds.length > 0 ? coachActivityIds : [0])
      .not('pdf_url', 'is', null)
      .neq('pdf_url', '')
      .order('id', { ascending: true })
      .limit(1)
    
    let pdfFileName = null
    if (firstPdf && firstPdf.length > 0) {
      const pdf = firstPdf[0]
      if (pdf.pdf_url) {
        // Extraer nombre de archivo de la URL
        const urlMatch = pdf.pdf_url.match(/\/([^/?#]+)$/) || 
                        pdf.pdf_url.match(/\/([^/?#]+)\?/)
        pdfFileName = urlMatch ? urlMatch[1] : ('pdf_' + pdf.id + '.pdf')
      }
    }
    
    // Obtener todas las actividades con PDFs para el array products
    const { data: pdfActivities } = await supabase
      .from('activity_media')
      .select('activity_id')
      .not('pdf_url', 'is', null)
      .in('activity_id', coachActivityIds.length > 0 ? coachActivityIds : [0])
    
    const pdfActivityIds = [...new Set((pdfActivities || []).map(a => a.activity_id))]
    
    if (!pdfFileName) {
      pdfFileName = 'archivo.pdf'
    }
    
    storageData.push({
      coach_id: coachId,
      concept: 'pdf',
      gb_usage: parseFloat(pdfGb.toFixed(6)),
      products: pdfActivityIds,
      file_name: pdfFileName
    })
  }

  // Upsert todos los conceptos
  if (storageData.length > 0) {
    for (const data of storageData) {
      const { error } = await supabase
        .from('storage_usage')
        .upsert(data, { onConflict: 'coach_id,concept' })

      if (error) {
        console.error(`  ❌ Error guardando ${data.concept}:`, error)
      } else {
        console.log(`  ✅ Guardado ${data.concept}: ${data.gb_usage} GB`)
      }
    }
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando población de storage_usage...')

  // Obtener todos los coaches
  const { data: coaches, error } = await supabase
    .from('activities')
    .select('coach_id')
    .not('coach_id', 'is', null)

  if (error) {
    console.error('❌ Error obteniendo coaches:', error)
    process.exit(1)
  }

  // Obtener IDs únicos de coaches
  const uniqueCoachIds = [...new Set((coaches || []).map(c => c.coach_id))]
  console.log(`📋 Encontrados ${uniqueCoachIds.length} coaches con actividades`)

  // Calcular storage para cada coach
  for (const coachId of uniqueCoachIds) {
    await calculateAndSaveCoachStorage(coachId)
  }

  console.log('\n✨ ¡Proceso completado!')
}

// Ejecutar
main().catch(console.error)

