/**
 * Script de Migración: Reorganizar archivos por Coach
 * 
 * Este script migra archivos de la estructura antigua:
 *   images/products/{filename}
 *   videos/products/{filename}
 * 
 * A la nueva estructura organizada por coach:
 *   coaches/{coach_id}/images/{filename}
 *   coaches/{coach_id}/videos/{filename}
 * 
 * Fecha: 7 de Octubre, 2025
 */

import { createClient } from '@supabase/supabase-js'

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DRY_RUN = process.env.DRY_RUN === 'true' // Si es true, solo simula sin mover archivos

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  console.error('Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ActivityMedia {
  id: string
  activity_id: number
  image_url: string | null
  video_url: string | null
}

interface Activity {
  id: number
  coach_id: string
  title: string
}

async function migrateStorageToCoachFolders() {
  console.log('🚀 INICIANDO MIGRACIÓN DE STORAGE')
  console.log(`📋 Modo: ${DRY_RUN ? 'DRY RUN (simulación)' : 'PRODUCCIÓN (mover archivos)'}`)
  console.log('─'.repeat(80))

  try {
    // 1. Obtener todas las actividades con sus coaches
    console.log('\n📊 PASO 1: Obteniendo actividades...')
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, coach_id, title')
    
    if (activitiesError) {
      throw new Error(`Error obteniendo actividades: ${activitiesError.message}`)
    }
    
    console.log(`✅ ${activities.length} actividades encontradas`)

    // 2. Obtener toda la media
    console.log('\n📊 PASO 2: Obteniendo registros de media...')
    const { data: mediaRecords, error: mediaError } = await supabase
      .from('activity_media')
      .select('id, activity_id, image_url, video_url')
    
    if (mediaError) {
      throw new Error(`Error obteniendo media: ${mediaError.message}`)
    }
    
    console.log(`✅ ${mediaRecords.length} registros de media encontrados`)

    // 3. Mapear activity_id -> coach_id
    const activityToCoach = new Map<number, string>()
    activities.forEach(activity => {
      activityToCoach.set(activity.id, activity.coach_id)
    })

    // 4. Procesar cada registro de media
    console.log('\n📊 PASO 3: Procesando archivos...')
    
    const stats = {
      total: 0,
      images: { processed: 0, moved: 0, errors: 0, skipped: 0 },
      videos: { processed: 0, moved: 0, errors: 0, skipped: 0 }
    }

    for (const media of mediaRecords) {
      const coachId = activityToCoach.get(media.activity_id)
      
      if (!coachId) {
        console.warn(`⚠️ No se encontró coach para actividad ${media.activity_id}`)
        continue
      }

      // Procesar imagen
      if (media.image_url) {
        stats.images.processed++
        await processFile(media.image_url, coachId, 'image', media.id, stats.images)
      }

      // Procesar video
      if (media.video_url) {
        stats.videos.processed++
        await processFile(media.video_url, coachId, 'video', media.id, stats.videos)
      }

      stats.total++
    }

    // 5. Mostrar resumen
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMEN DE MIGRACIÓN')
    console.log('='.repeat(80))
    console.log(`Total de registros procesados: ${stats.total}`)
    console.log('\nImágenes:')
    console.log(`  - Procesadas: ${stats.images.processed}`)
    console.log(`  - Movidas: ${stats.images.moved}`)
    console.log(`  - Errores: ${stats.images.errors}`)
    console.log(`  - Omitidas: ${stats.images.skipped}`)
    console.log('\nVideos:')
    console.log(`  - Procesados: ${stats.videos.processed}`)
    console.log(`  - Movidos: ${stats.videos.moved}`)
    console.log(`  - Errores: ${stats.videos.errors}`)
    console.log(`  - Omitidos: ${stats.videos.skipped}`)
    console.log('='.repeat(80))
    
    if (DRY_RUN) {
      console.log('\n⚠️ SIMULACIÓN COMPLETADA - No se movieron archivos reales')
      console.log('Para ejecutar la migración real, ejecuta:')
      console.log('  DRY_RUN=false npx tsx scripts/migrate-storage-to-coach-folders.ts')
    } else {
      console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE')
    }

  } catch (error: any) {
    console.error('\n❌ ERROR EN MIGRACIÓN:', error.message)
    process.exit(1)
  }
}

async function processFile(
  fileUrl: string, 
  coachId: string, 
  mediaType: 'image' | 'video',
  mediaId: string,
  stats: { moved: number, errors: number, skipped: number }
) {
  try {
    // Extraer información del URL
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/')
    const bucket = pathParts[pathParts.indexOf('object') + 2] // Obtener nombre del bucket
    
    // Obtener la ruta actual del archivo
    const currentPath = pathParts.slice(pathParts.indexOf('object') + 3).join('/')
    
    // Verificar si ya está en la estructura nueva
    if (currentPath.startsWith('coaches/')) {
      console.log(`⏭️  Archivo ya migrado: ${currentPath}`)
      stats.skipped++
      return
    }
    
    // Extraer solo el nombre del archivo
    const fileName = pathParts[pathParts.length - 1]
    
    // Construir nueva ruta
    const newPath = mediaType === 'image' 
      ? `coaches/${coachId}/images/${fileName}`
      : `coaches/${coachId}/videos/${fileName}`
    
    console.log(`\n🔄 Procesando ${mediaType}:`)
    console.log(`   FROM: ${currentPath}`)
    console.log(`   TO:   ${newPath}`)
    console.log(`   Coach: ${coachId}`)
    
    if (DRY_RUN) {
      console.log('   ✅ [SIMULACIÓN] Archivo marcado para mover')
      stats.moved++
      return
    }

    // Mover archivo en Storage
    const { data: moveData, error: moveError } = await supabase.storage
      .from(bucket)
      .move(currentPath, newPath)
    
    if (moveError) {
      // Si el archivo ya existe en destino, podemos copiar y eliminar el original
      if (moveError.message.includes('already exists')) {
        console.log('   ⚠️  Archivo ya existe en destino, omitiendo...')
        stats.skipped++
      } else {
        console.error(`   ❌ Error moviendo archivo: ${moveError.message}`)
        stats.errors++
      }
      return
    }
    
    console.log('   ✅ Archivo movido exitosamente')
    
    // Actualizar URL en la base de datos
    const newUrl = fileUrl.replace(currentPath, newPath)
    
    const updateData: any = {}
    if (mediaType === 'image') {
      updateData.image_url = newUrl
    } else {
      updateData.video_url = newUrl
    }
    
    const { error: updateError } = await supabase
      .from('activity_media')
      .update(updateData)
      .eq('id', mediaId)
    
    if (updateError) {
      console.error(`   ⚠️ Error actualizando URL en BD: ${updateError.message}`)
    } else {
      console.log('   ✅ URL actualizada en base de datos')
    }
    
    stats.moved++

  } catch (error: any) {
    console.error(`   ❌ Error procesando archivo: ${error.message}`)
    stats.errors++
  }
}

// Ejecutar migración
console.log('\n' + '='.repeat(80))
console.log('🚀 MIGRACIÓN DE STORAGE A ESTRUCTURA POR COACH')
console.log('='.repeat(80))

migrateStorageToCoachFolders()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error)
    process.exit(1)
  })





