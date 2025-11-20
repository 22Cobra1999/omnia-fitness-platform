import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient } from '@/lib/bunny/index'

/**
 * Endpoint para verificar los tamaños reales de archivos en Bunny.net y Supabase Storage
 * Compara los tamaños reales con los que se están mostrando en la aplicación
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const coachId = user.id

    // 1. Obtener videos de la base de datos
    const { data: activities } = await supabase
      .from('activities')
      .select('id, title')
      .eq('coach_id', coachId)

    const activityIds = activities?.map(a => a.id) || []

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

    // Consultar Bunny para cada video
    const videosInfo: Array<{
      videoId: string
      exists: boolean
      storageSize?: number
      title?: string
      status?: number
      error?: string
    }> = []

    for (const videoId of videoIds) {
      try {
        const videoInfo = await bunnyClient.getVideoInfo(videoId)
        if (videoInfo) {
          videosInfo.push({
            videoId,
            exists: true,
            storageSize: videoInfo.storageSize || 0,
            title: videoInfo.title,
            status: videoInfo.status,
          })
        } else {
          videosInfo.push({
            videoId,
            exists: false,
            error: 'No se pudo obtener información del video'
          })
        }
      } catch (error: any) {
        videosInfo.push({
          videoId,
          exists: false,
          error: error.message || 'Error desconocido'
        })
      }
    }

    // 2. Obtener imágenes de Supabase Storage
    let images: Array<{ name: string, sizeBytes: number }> = []
    try {
      const { data: imageFiles, error: imagesError } = await supabase.storage
        .from('product-media')
        .list(`coaches/${coachId}/images`, { limit: 1000 })

      if (!imagesError && imageFiles) {
        const validImages = imageFiles.filter(
          f => !f.name.includes('.empty') && !f.name.includes('.keep')
        )

        images = validImages.map(file => ({
          name: file.name,
          sizeBytes: parseInt(file.metadata?.size || (file as any).size || '0'),
        }))
      }
    } catch (error: any) {
      console.error('Error obteniendo imágenes:', error)
    }

    // 3. Obtener PDFs de Supabase Storage
    let pdfs: Array<{ name: string, sizeBytes: number }> = []
    try {
      const { data: pdfFiles, error: pdfsError } = await supabase.storage
        .from('product-media')
        .list(`coaches/${coachId}/pdfs`, { limit: 1000 })

      if (!pdfsError && pdfFiles) {
        const validPdfs = pdfFiles.filter(
          f => !f.name.includes('.empty') && !f.name.includes('.keep')
        )

        pdfs = validPdfs.map(file => ({
          name: file.name,
          sizeBytes: parseInt(file.metadata?.size || (file as any).size || '0'),
        }))
      }
    } catch (error: any) {
      console.error('Error obteniendo PDFs:', error)
    }

    // Calcular totales
    const totalVideoBytes = videosInfo.reduce((sum, v) => sum + (v.storageSize || 0), 0)
    const totalImageBytes = images.reduce((sum, img) => sum + img.sizeBytes, 0)
    const totalPdfBytes = pdfs.reduce((sum, pdf) => sum + pdf.sizeBytes, 0)

    return NextResponse.json({
      success: true,
      videos: {
        total: videosInfo.length,
        withSize: videosInfo.filter(v => v.exists && (v.storageSize || 0) > 0).length,
        withoutSize: videosInfo.filter(v => v.exists && (v.storageSize || 0) === 0).length,
        notFound: videosInfo.filter(v => !v.exists).length,
        totalBytes: totalVideoBytes,
        totalGB: totalVideoBytes / (1024 * 1024 * 1024),
        details: videosInfo.map(v => ({
          videoId: v.videoId,
          exists: v.exists,
          storageSize: v.storageSize || 0,
          storageSizeMB: (v.storageSize || 0) / (1024 * 1024),
          title: v.title,
          status: v.status,
          error: v.error,
        }))
      },
      images: {
        total: images.length,
        totalBytes: totalImageBytes,
        totalGB: totalImageBytes / (1024 * 1024 * 1024),
        details: images.map(img => ({
          name: img.name,
          sizeBytes: img.sizeBytes,
          sizeMB: img.sizeBytes / (1024 * 1024),
        }))
      },
      pdfs: {
        total: pdfs.length,
        totalBytes: totalPdfBytes,
        totalGB: totalPdfBytes / (1024 * 1024 * 1024),
        details: pdfs.map(pdf => ({
          name: pdf.name,
          sizeBytes: pdf.sizeBytes,
          sizeMB: pdf.sizeBytes / (1024 * 1024),
        }))
      },
      summary: {
        totalGB: (totalVideoBytes + totalImageBytes + totalPdfBytes) / (1024 * 1024 * 1024),
        videosGB: totalVideoBytes / (1024 * 1024 * 1024),
        imagesGB: totalImageBytes / (1024 * 1024 * 1024),
        pdfsGB: totalPdfBytes / (1024 * 1024 * 1024),
      }
    })
  } catch (error: any) {
    console.error('Error en /api/coach/check-real-sizes:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
}

