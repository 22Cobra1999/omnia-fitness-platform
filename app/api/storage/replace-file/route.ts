import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient } from '@/lib/bunny'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const oldFileId = formData.get('oldFileId') as string
    const concept = formData.get('concept') as string
    const oldFileName = formData.get('oldFileName') as string

    if (!file || !oldFileId || !concept) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros' }, { status: 400 })
    }

    console.log('[replace-file] Starting replacement:', { concept, oldFileId, newFileName: file.name })

    if (concept === 'video') {
      // 1. Subir nuevo video a Bunny
      const uploadResult = await bunnyClient.uploadVideoToStream(file, file.name)
      if (!uploadResult.success) {
        return NextResponse.json({ success: false, error: 'Error subiendo video a Bunny' }, { status: 500 })
      }

      const newVideoId = uploadResult.videoId!
      const newStreamUrl = bunnyClient.getStreamUrl(newVideoId)
      const newThumbnailUrl = bunnyClient.getThumbnailUrl(newVideoId)

      // 2. Actualizar todas las referencias en la base de datos
      let updatedCount = 0

      // Ejercicios
      const { data: ejUpdated } = await supabase
        .from('ejercicios_detalles')
        .update({
          bunny_video_id: newVideoId,
          video_url: newStreamUrl,
          video_thumbnail_url: newThumbnailUrl,
          video_file_name: file.name
        })
        .eq('bunny_video_id', oldFileId)
        .eq('coach_id', user.id)
        .select()

      updatedCount += ejUpdated?.length || 0

      // Media de actividades
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', user.id)
      
      const activityIds = activities?.map((a: { id: number }) => a.id) || []

      if (activityIds.length > 0) {
        const { data: mediaUpdated } = await supabase
          .from('activity_media')
          .update({
            bunny_video_id: newVideoId,
            video_url: newStreamUrl,
            video_thumbnail_url: newThumbnailUrl,
            video_file_name: file.name
          })
          .in('activity_id', activityIds)
          .eq('bunny_video_id', oldFileId)
          .select()
        
        updatedCount += mediaUpdated?.length || 0
      }

      return NextResponse.json({
        success: true,
        message: `Video reemplazado en ${updatedCount} productos`,
        newFileId: newVideoId,
        newUrl: newStreamUrl
      })

    } else if (concept === 'image' || concept === 'pdf') {
       // 1. Subir el nuevo archivo a Supabase Storage
       const folder = concept === 'image' ? 'images' : 'pdfs'
       const filePath = `coaches/${user.id}/${folder}/${file.name}`
       
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from('product-media')
         .upload(filePath, file, { upsert: true })

       if (uploadError) {
         return NextResponse.json({ success: false, error: 'Error subiendo archivo a Storage' }, { status: 500 })
       }

       const { data: { publicUrl } } = supabase.storage
         .from('product-media')
         .getPublicUrl(filePath)

       // 2. Actualizar referencias en activity_media
       const { data: activities } = await supabase
         .from('activities')
         .select('id')
         .eq('coach_id', user.id)
       
       const activityIds = activities?.map((a: { id: number }) => a.id) || []
       let updatedCount = 0

       if (activityIds.length > 0) {
         // Buscamos registros de media que usaran el archivo anterior
         // Esto es un poco truculento porque no tenemos un ID de archivo para imágenes, sino la URL
         const column = concept === 'image' ? 'image_url' : 'pdf_url'
         
         // Actualización masiva por coincidencia parcial de nombre en la URL o exacta si la tenemos
         const { data: mediaList } = await supabase
            .from('activity_media')
            .select(`id, ${column}`)
            .in('activity_id', activityIds)
            .not(column, 'is', null)

         if (mediaList) {
            for (const item of mediaList) {
               const currentUrl = item[column] as string
               if (currentUrl.includes(oldFileName)) {
                 await supabase
                   .from('activity_media')
                   .update({ [column]: publicUrl })
                   .eq('id', item.id)
                 updatedCount++
               }
            }
         }
       }

       return NextResponse.json({
         success: true,
         message: `Archivo reemplazado en ${updatedCount} registros`,
         newUrl: publicUrl
       })
    }

    return NextResponse.json({ success: false, error: 'Concepto no soportado' }, { status: 400 })

  } catch (error: any) {
    console.error('[replace-file] Unexpected error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
