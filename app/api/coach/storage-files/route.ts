import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient } from '@/lib/bunny'

interface StorageFile {
  fileId: string
  fileName: string
  concept: 'video' | 'image' | 'pdf'
  sizeBytes: number
  sizeGB: number
  usesCount: number
  activities: Array<{ id: number, name: string }>
  url?: string // URL pública del archivo
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const coachId = user.id

    // Obtener todas las actividades del coach para nombres
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title')
      .eq('coach_id', coachId)

    if (activitiesError) {
      console.error('Error obteniendo actividades:', activitiesError)
    }

    const activityMap = new Map<number, string>()
    activities?.forEach(a => {
      activityMap.set(a.id, a.title)
    })
    const activityIds = activities?.map(a => a.id) || []

    const files: StorageFile[] = []

    // ============================================
    // 1. VIDEOS: De activity_media y ejercicios_detalles
    // ============================================
    const videoMap = new Map<string, { 
      bunny_video_id: string
      fileName: string
      activities: Set<number>
      sizeBytes: number // Inicialmente 0, se actualiza cuando se obtiene de Bunny
    }>()

    // Videos de activity_media
    if (activityIds.length > 0) {
      const { data: activityMedia, error: mediaError } = await supabase
        .from('activity_media')
        .select('activity_id, bunny_video_id, video_file_name')
        .in('activity_id', activityIds)
        .not('bunny_video_id', 'is', null)
        .neq('bunny_video_id', '')

      if (!mediaError && activityMedia) {
        activityMedia.forEach((item: any) => {
          const bunnyId = item.bunny_video_id?.trim()
          if (bunnyId) {
            if (!videoMap.has(bunnyId)) {
              videoMap.set(bunnyId, {
                bunny_video_id: bunnyId,
                fileName: item.video_file_name || `video-${bunnyId.substring(0, 8)}`,
                activities: new Set(),
                sizeBytes: 0 // Inicializar en 0, se actualizará desde Bunny
              })
            }
            const video = videoMap.get(bunnyId)!
            if (item.activity_id) video.activities.add(item.activity_id)
          }
        })
      }
    }

    // Videos de ejercicios_detalles
    const { data: ejerciciosDetalles, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('activity_id, bunny_video_id, video_file_name, nombre_ejercicio')
      .eq('coach_id', coachId)
      .not('bunny_video_id', 'is', null)
      .neq('bunny_video_id', '')

    if (!ejerciciosError && ejerciciosDetalles) {
      ejerciciosDetalles.forEach((item: any) => {
        const bunnyId = item.bunny_video_id?.trim()
        if (bunnyId) {
          if (!videoMap.has(bunnyId)) {
            videoMap.set(bunnyId, {
              bunny_video_id: bunnyId,
              fileName: item.video_file_name || item.nombre_ejercicio || `video-${bunnyId.substring(0, 8)}`,
              activities: new Set(),
              sizeBytes: 0 // Inicializar en 0, se actualizará desde Bunny
            })
          }
          const video = videoMap.get(bunnyId)!
          if (item.activity_id) video.activities.add(item.activity_id)
        }
      })
    }

    // Videos de nutrition_program_details (si tienen bunny_video_id)
    // Nota: nutrition_program_details puede tener video_url pero no necesariamente bunny_video_id
    // Solo incluimos los que tengan bunny_video_id para ser consistentes
    if (activityIds.length > 0) {
      const { data: nutritionVideos, error: nutritionError } = await supabase
        .from('nutrition_program_details')
        .select('activity_id, bunny_video_id, video_url')
        .in('activity_id', activityIds)
        .not('bunny_video_id', 'is', null)
        .neq('bunny_video_id', '')

      if (!nutritionError && nutritionVideos) {
        nutritionVideos.forEach((item: any) => {
          const bunnyId = item.bunny_video_id?.trim()
          if (bunnyId) {
            if (!videoMap.has(bunnyId)) {
              // Extraer nombre del video_url si está disponible
              let fileName = `video-${bunnyId.substring(0, 8)}`
              if (item.video_url) {
                const urlParts = item.video_url.split('/')
                const lastPart = urlParts[urlParts.length - 1]
                if (lastPart && lastPart.includes('.')) {
                  fileName = lastPart.split('?')[0]
                }
              }
              
              videoMap.set(bunnyId, {
                bunny_video_id: bunnyId,
                fileName,
                activities: new Set(),
                sizeBytes: 0 // Inicializar en 0, se actualizará desde Bunny
              })
            }
            const video = videoMap.get(bunnyId)!
            if (item.activity_id) video.activities.add(item.activity_id)
          }
        })
      }
    }

    // Obtener tamaños de videos de Bunny
    for (const [bunnyId, video] of videoMap.entries()) {
      try {
        const videoInfo = await bunnyClient.getVideoInfo(bunnyId)
        if (videoInfo) {
          // El storageSize puede venir en bytes
          // Bunny API puede devolverlo como storageSize, storage_size, o en metadata
          const sizeBytes = videoInfo.storageSize || 
                           (videoInfo as any).storage_size || 
                           (videoInfo as any).sizeBytes ||
                           (videoInfo as any).metadata?.storageSize ||
                           0
          
          if (sizeBytes > 0) {
            video.sizeBytes = sizeBytes
          } else {
            console.warn(`⚠️ Video ${bunnyId} tiene tamaño 0 o no disponible. Info:`, {
              hasStorageSize: !!videoInfo.storageSize,
              keys: Object.keys(videoInfo),
              status: (videoInfo as any).status
            })
            // Si el video existe pero no tiene tamaño, asignar 0 (será visible pero con 0KB)
            video.sizeBytes = 0
          }
        } else {
          console.warn(`⚠️ No se pudo obtener información del video ${bunnyId} desde Bunny`)
          video.sizeBytes = 0
        }
      } catch (error: any) {
        console.error(`❌ Error obteniendo tamaño de video ${bunnyId}:`, error?.message || error)
        video.sizeBytes = 0
      }
    }

    // Convertir videos a StorageFile
    videoMap.forEach((video, bunnyId) => {
      const activityList = Array.from(video.activities).map(id => ({
        id,
        name: activityMap.get(id) || `Actividad ${id}`
      }))
      
      files.push({
        fileId: bunnyId,
        fileName: video.fileName,
        concept: 'video',
        sizeBytes: video.sizeBytes || 0,
        sizeGB: (video.sizeBytes || 0) / (1024 * 1024 * 1024),
        usesCount: video.activities.size,
        activities: activityList
      })
    })

    // ============================================
    // 2. IMÁGENES: De activity_media y Supabase Storage
    // ============================================
    const imageMap = new Map<string, {
      fileName: string
      activities: Set<number>
      sizeBytes: number
    }>()

    // Imágenes de activity_media - mantener también las URLs originales
    const imageUrlMap = new Map<string, string>() // fileName -> URL original de activity_media
    if (activityIds.length > 0) {
      const { data: activityMediaImages, error: imagesError } = await supabase
        .from('activity_media')
        .select('activity_id, image_url')
        .in('activity_id', activityIds)
        .not('image_url', 'is', null)
        .neq('image_url', '')

      if (!imagesError && activityMediaImages) {
        activityMediaImages.forEach((item: any) => {
          if (item.image_url) {
            // Extraer nombre de archivo de la URL
            const urlParts = item.image_url.split('/')
            const fileName = urlParts[urlParts.length - 1].split('?')[0]
            
            // Guardar la URL original de activity_media
            imageUrlMap.set(fileName, item.image_url)
            
            if (!imageMap.has(fileName)) {
              imageMap.set(fileName, {
                fileName,
                activities: new Set(),
                sizeBytes: 0
              })
            }
            const image = imageMap.get(fileName)!
            if (item.activity_id) image.activities.add(item.activity_id)
          }
        })
      }
    }

    // Obtener avatares de user_profiles solo para identificarlos y EXCLUIRLOS
    // No queremos mostrar fotos de perfil en la tabla de almacenamiento
    const avatarFileNames = new Set<string>()
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, avatar_url')
      .not('avatar_url', 'is', null)
      .neq('avatar_url', '')

    if (!profilesError && userProfiles) {
      userProfiles.forEach((profile: any) => {
        if (profile.avatar_url) {
          // Extraer nombre de archivo de la URL del avatar
          const urlParts = profile.avatar_url.split('/')
          const fileName = urlParts[urlParts.length - 1].split('?')[0]
          
          // Identificar TODOS los avatares para excluirlos después
          // Los avatares pueden estar en:
          // - /avatars/{user_id}.{ext}
          // - coaches/{coach_id}/images/{fileName}
          // Si está en user_profiles.avatar_url, es un avatar (foto de perfil)
          // Si además está en activity_media, también se excluirá porque ya lo marcamos como avatar
          avatarFileNames.add(fileName)
        }
      })
    }

    // Imágenes de Supabase Storage
    try {
      const { data: storageImages, error: storageError } = await supabase.storage
        .from('product-media')
        .list(`coaches/${coachId}/images`, { limit: 1000 })

      if (!storageError && storageImages) {
        const validImages = storageImages.filter(
          f => !f.name.includes('.empty') && !f.name.includes('.keep')
        )

        validImages.forEach((file) => {
          const fileName = file.name
          
          // Excluir avatares (archivos que están identificados como avatares en user_profiles)
          if (avatarFileNames.has(fileName)) {
            return // Excluir esta imagen, es un avatar
          }
          
          const sizeBytes = parseInt(file.metadata?.size || (file as any).size || '0')

          if (!imageMap.has(fileName)) {
            imageMap.set(fileName, {
              fileName,
              activities: new Set(),
              sizeBytes
            })
          } else {
            const image = imageMap.get(fileName)!
            // Si no tenía tamaño, actualizar con el tamaño del storage
            if (image.sizeBytes === 0 && sizeBytes > 0) {
              image.sizeBytes = sizeBytes
            }
          }
        })
      }
    } catch (error) {
      console.error('Error obteniendo imágenes de storage:', error)
    }

    // Convertir imágenes a StorageFile
    // EXCLUIR avatares (fotos de perfil de user_profiles)
    imageMap.forEach((image, fileName) => {
      // Excluir si es un avatar (está en la carpeta /avatars/ o no está asociado a ninguna actividad)
      // Solo mostrar imágenes que estén asociadas a actividades (ejercicios, portadas de nutrición/fitness)
      if (avatarFileNames.has(fileName)) {
        return // Excluir esta imagen, es un avatar
      }

      // Si no tiene actividades asociadas y no es de activity_media, podría ser un avatar
      // Solo incluir si tiene al menos una actividad asociada (imagen de ejercicio/portada)
      if (image.activities.size === 0 && !imageUrlMap.has(fileName)) {
        // Si no está en activity_media ni tiene actividades, probablemente es un avatar o imagen huérfana
        // Excluirla también
        return
      }

      const activityList = Array.from(image.activities).map(id => ({
        id,
        name: activityMap.get(id) || `Actividad ${id}`
      }))

      // Si no tiene actividades asociadas pero existe en activity_media, tiene usesCount = 1
      const usesCount = image.activities.size > 0 ? image.activities.size : 1

      // Obtener URL pública de la imagen
      // Solo de activity_media (ya no incluimos user_profiles)
      let imageUrl: string | undefined = imageUrlMap.get(fileName)
      
      // Si no se encontró, construir URL pública desde Storage
      if (!imageUrl) {
        const { data: urlData } = supabase.storage
          .from('product-media')
          .getPublicUrl(`coaches/${coachId}/images/${fileName}`)
        imageUrl = urlData.publicUrl
      }

      files.push({
        fileId: `image-${fileName}`,
        fileName,
        concept: 'image',
        sizeBytes: image.sizeBytes,
        sizeGB: image.sizeBytes / (1024 * 1024 * 1024),
        usesCount,
        activities: activityList,
        url: imageUrl // Agregar URL pública
      })
    })

    // ============================================
    // 3. PDFs: De activity_media y Supabase Storage
    // ============================================
    const pdfMap = new Map<string, {
      fileName: string
      activities: Set<number>
      sizeBytes: number
    }>()

    // PDFs de activity_media
    if (activityIds.length > 0) {
      const { data: activityMediaPdfs, error: pdfsError } = await supabase
        .from('activity_media')
        .select('activity_id, pdf_url')
        .in('activity_id', activityIds)
        .not('pdf_url', 'is', null)
        .neq('pdf_url', '')

      if (!pdfsError && activityMediaPdfs) {
        activityMediaPdfs.forEach((item: any) => {
          if (item.pdf_url) {
            // Extraer nombre de archivo de la URL
            const urlParts = item.pdf_url.split('/')
            const fileName = urlParts[urlParts.length - 1].split('?')[0]
            
            if (!pdfMap.has(fileName)) {
              pdfMap.set(fileName, {
                fileName,
                activities: new Set(),
                sizeBytes: 0
              })
            }
            const pdf = pdfMap.get(fileName)!
            if (item.activity_id) pdf.activities.add(item.activity_id)
          }
        })
      }
    }

    // PDFs de Supabase Storage
    try {
      const { data: storagePdfs, error: storageError } = await supabase.storage
        .from('product-media')
        .list(`coaches/${coachId}/pdfs`, { limit: 1000 })

      if (!storageError && storagePdfs) {
        const validPdfs = storagePdfs.filter(
          f => !f.name.includes('.empty') && !f.name.includes('.keep')
        )

        validPdfs.forEach((file) => {
          const fileName = file.name
          const sizeBytes = parseInt(file.metadata?.size || (file as any).size || '0')

          if (!pdfMap.has(fileName)) {
            pdfMap.set(fileName, {
              fileName,
              activities: new Set(),
              sizeBytes
            })
          } else {
            const pdf = pdfMap.get(fileName)!
            // Si no tenía tamaño, actualizar con el tamaño del storage
            if (pdf.sizeBytes === 0 && sizeBytes > 0) {
              pdf.sizeBytes = sizeBytes
            }
          }
        })
      }
    } catch (error) {
      console.error('Error obteniendo PDFs de storage:', error)
    }

    // Convertir PDFs a StorageFile
    pdfMap.forEach((pdf, fileName) => {
      const activityList = Array.from(pdf.activities).map(id => ({
        id,
        name: activityMap.get(id) || `Actividad ${id}`
      }))

      // Si no tiene actividades asociadas pero existe en storage, tiene usesCount = 1
      const usesCount = pdf.activities.size > 0 ? pdf.activities.size : 1

      files.push({
        fileId: `pdf-${fileName}`,
        fileName,
        concept: 'pdf',
        sizeBytes: pdf.sizeBytes,
        sizeGB: pdf.sizeBytes / (1024 * 1024 * 1024),
        usesCount,
        activities: activityList
      })
    })

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error('Error en GET /api/coach/storage-files:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}