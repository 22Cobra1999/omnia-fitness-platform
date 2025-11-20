#!/usr/bin/env tsx

/**
 * Script para verificar los tamaños reales de archivos en Bunny.net y Supabase Storage
 * Compara los tamaños reales con los que se están mostrando en la aplicación
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY!
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Función para obtener información de un video desde Bunny
async function getBunnyVideoInfo(videoId: string) {
  try {
    const url = `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`
    const response = await fetch(url, {
      headers: {
        'AccessKey': BUNNY_STREAM_API_KEY,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false, error: 'Video no encontrado (404)' }
      }
      const errorText = await response.text()
      return { exists: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    const videoInfo = await response.json()
    return {
      exists: true,
      info: videoInfo,
      storageSize: videoInfo.storageSize || 0,
      title: videoInfo.title,
      status: videoInfo.status,
      length: videoInfo.length,
    }
  } catch (error: any) {
    return { exists: false, error: error.message || 'Error desconocido' }
  }
}

// Función para obtener tamaños de archivos en Supabase Storage
async function getSupabaseFileSizes(coachId: string, folder: 'images' | 'pdfs') {
  try {
    const { data: files, error } = await supabase.storage
      .from('product-media')
      .list(`coaches/${coachId}/${folder}`, { limit: 1000 })

    if (error) {
      console.error(`Error listando archivos de ${folder}:`, error)
      return []
    }

    const validFiles = (files || []).filter(
      f => !f.name.includes('.empty') && !f.name.includes('.keep')
    )

    return validFiles.map(file => ({
      name: file.name,
      sizeBytes: parseInt(file.metadata?.size || (file as any).size || '0'),
      updated: file.updated_at || file.created_at,
    }))
  } catch (error: any) {
    console.error(`Error obteniendo archivos de ${folder}:`, error)
    return []
  }
}

async function checkCoachFiles(coachId: string) {
  console.log(`\n📊 Verificando archivos del coach: ${coachId}\n`)
  console.log('=' .repeat(80))

  // 1. Obtener videos de la base de datos
  console.log('\n🎥 VIDEOS EN LA BASE DE DATOS:\n')
  
  const { data: activities } = await supabase
    .from('activities')
    .select('id, title')
    .eq('coach_id', coachId)

  const activityIds = activities?.map(a => a.id) || []
  console.log(`📋 Actividades encontradas: ${activityIds.length}`)

  // Videos de activity_media
  const videoIds = new Set<string>()
  const videoMetadata = new Map<string, { source: string, activityId: number, fileName?: string }>()

  if (activityIds.length > 0) {
    const { data: activityMedia } = await supabase
      .from('activity_media')
      .select('activity_id, bunny_video_id, video_file_name')
      .in('activity_id', activityIds)
      .not('bunny_video_id', 'is', null)
      .neq('bunny_video_id', '')

    activityMedia?.forEach((item: any) => {
      if (item.bunny_video_id) {
        videoIds.add(item.bunny_video_id)
        videoMetadata.set(item.bunny_video_id, {
          source: 'activity_media',
          activityId: item.activity_id,
          fileName: item.video_file_name
        })
      }
    })
  }

  // Videos de ejercicios_detalles
  const { data: ejercicios } = await supabase
    .from('ejercicios_detalles')
    .select('activity_id, bunny_video_id, video_file_name, nombre_ejercicio')
    .eq('coach_id', coachId)
    .not('bunny_video_id', 'is', null)
    .neq('bunny_video_id', '')

  ejercicios?.forEach((item: any) => {
    if (item.bunny_video_id) {
      videoIds.add(item.bunny_video_id)
      if (!videoMetadata.has(item.bunny_video_id)) {
        videoMetadata.set(item.bunny_video_id, {
          source: 'ejercicios_detalles',
          activityId: item.activity_id,
          fileName: item.video_file_name || item.nombre_ejercicio
        })
      }
    }
  })

  // Videos de nutrition_program_details
  if (activityIds.length > 0) {
    const { data: nutritionVideos } = await supabase
      .from('nutrition_program_details')
      .select('activity_id, bunny_video_id')
      .in('activity_id', activityIds)
      .not('bunny_video_id', 'is', null)
      .neq('bunny_video_id', '')

    nutritionVideos?.forEach((item: any) => {
      if (item.bunny_video_id) {
        videoIds.add(item.bunny_video_id)
        if (!videoMetadata.has(item.bunny_video_id)) {
          videoMetadata.set(item.bunny_video_id, {
            source: 'nutrition_program_details',
            activityId: item.activity_id
          })
        }
      }
    })
  }

  console.log(`\n📹 Total de videos únicos en BD: ${videoIds.size}`)

  // Consultar Bunny para cada video
  let totalVideoBytes = 0
  let videosWithSize = 0
  let videosWithoutSize = 0
  let videosNotFound = 0

  console.log('\n📡 Consultando Bunny.net...\n')

  for (const videoId of videoIds) {
    const metadata = videoMetadata.get(videoId)
    const result = await getBunnyVideoInfo(videoId)

    if (!result.exists) {
      console.log(`❌ ${videoId.substring(0, 12)}... | NO ENCONTRADO | ${result.error}`)
      videosNotFound++
      continue
    }

    const sizeBytes = result.storageSize || 0
    const sizeMB = sizeBytes / (1024 * 1024)
    const sizeGB = sizeBytes / (1024 * 1024 * 1024)

    if (sizeBytes > 0) {
      totalVideoBytes += sizeBytes
      videosWithSize++
      console.log(`✅ ${videoId.substring(0, 12)}... | ${sizeMB.toFixed(2)} MB (${sizeGB.toFixed(3)} GB) | ${result.title || metadata?.fileName || 'Sin título'} | Estado: ${result.status}`)
    } else {
      videosWithoutSize++
      console.log(`⚠️  ${videoId.substring(0, 12)}... | 0 MB | ${result.title || metadata?.fileName || 'Sin título'} | Estado: ${result.status} | ⚠️ SIN TAMAÑO`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n📊 RESUMEN DE VIDEOS:')
  console.log(`   ✅ Con tamaño: ${videosWithSize}`)
  console.log(`   ⚠️  Sin tamaño (0 bytes): ${videosWithoutSize}`)
  console.log(`   ❌ No encontrados: ${videosNotFound}`)
  console.log(`   📦 Total almacenamiento videos: ${(totalVideoBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`)

  // 2. Obtener imágenes de Supabase Storage
  console.log('\n\n🖼️  IMÁGENES EN SUPABASE STORAGE:\n')
  
  const images = await getSupabaseFileSizes(coachId, 'images')
  let totalImageBytes = 0

  if (images.length > 0) {
    images.forEach(img => {
      totalImageBytes += img.sizeBytes
      const sizeMB = img.sizeBytes / (1024 * 1024)
      console.log(`   ${img.name} | ${sizeMB.toFixed(2)} MB`)
    })
  } else {
    console.log('   No hay imágenes')
  }

  console.log(`\n📦 Total almacenamiento imágenes: ${(totalImageBytes / (1024 * 1024 * 1024)).toFixed(3)} GB (${images.length} archivos)`)

  // 3. Obtener PDFs de Supabase Storage
  console.log('\n\n📄 PDFs EN SUPABASE STORAGE:\n')
  
  const pdfs = await getSupabaseFileSizes(coachId, 'pdfs')
  let totalPdfBytes = 0

  if (pdfs.length > 0) {
    pdfs.forEach(pdf => {
      totalPdfBytes += pdf.sizeBytes
      const sizeMB = pdf.sizeBytes / (1024 * 1024)
      console.log(`   ${pdf.name} | ${sizeMB.toFixed(2)} MB`)
    })
  } else {
    console.log('   No hay PDFs')
  }

  console.log(`\n📦 Total almacenamiento PDFs: ${(totalPdfBytes / (1024 * 1024 * 1024)).toFixed(3)} GB (${pdfs.length} archivos)`)

  // Resumen final
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 RESUMEN TOTAL:')
  console.log(`   🎥 Videos: ${(totalVideoBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`)
  console.log(`   🖼️  Imágenes: ${(totalImageBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`)
  console.log(`   📄 PDFs: ${(totalPdfBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`)
  const totalGB = (totalVideoBytes + totalImageBytes + totalPdfBytes) / (1024 * 1024 * 1024)
  console.log(`   📦 TOTAL: ${totalGB.toFixed(3)} GB`)
  console.log('\n' + '='.repeat(80))
}

// Obtener el coach_id desde argumentos o usar un ID por defecto
const coachId = process.argv[2]

if (!coachId) {
  console.error('❌ Por favor proporciona el coach_id como argumento:')
  console.error('   tsx scripts/check-real-file-sizes.ts <coach_id>')
  process.exit(1)
}

checkCoachFiles(coachId)
  .then(() => {
    console.log('\n✅ Verificación completada\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

