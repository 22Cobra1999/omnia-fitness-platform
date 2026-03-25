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

    const { oldFileId, newFileId, concept, oldFileName, newFileName } = await request.json()

    if (!concept || (!oldFileId && !oldFileName) || (!newFileId && !newFileName)) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros' }, { status: 400 })
    }

    console.log('[replace-with-existing] Starting:', { concept, oldFileId, newFileId })

    let updatedCount = 0

    if (concept === 'video') {
      const newVideoId = newFileId
      const newStreamUrl = bunnyClient.getStreamUrl(newVideoId)
      const newThumbnailUrl = bunnyClient.getThumbnailUrl(newVideoId)

      // 1. Ejercicios
      const { data: ejUpdated } = await supabase
        .from('ejercicios_detalles')
        .update({
          bunny_video_id: newVideoId,
          video_url: newStreamUrl,
          video_thumbnail_url: newThumbnailUrl,
          video_file_name: newFileName
        })
        .eq('bunny_video_id', oldFileId)
        .eq('coach_id', user.id)
        .select()

      updatedCount += ejUpdated?.length || 0

      // 2. Media de actividades
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
            video_file_name: newFileName
          })
          .in('activity_id', activityIds)
          .eq('bunny_video_id', oldFileId)
          .select()
        
        updatedCount += mediaUpdated?.length || 0
      }

    } else if (concept === 'image' || concept === 'pdf') {
       const folder = concept === 'image' ? 'images' : 'pdfs'
       const filePath = `coaches/${user.id}/${folder}/${newFileName}`
       
       const { data: { publicUrl: newPublicUrl } } = supabase.storage
         .from('product-media')
         .getPublicUrl(filePath)

       // Obtener todas las actividades del coach
       const { data: activities } = await supabase
         .from('activities')
         .select('id')
         .eq('coach_id', user.id)
       
       const activityIds = activities?.map((a: { id: number }) => a.id) || []

       if (activityIds.length > 0) {
         const column = concept === 'image' ? 'image_url' : 'pdf_url'
         
         // Buscar registros de media que usaran el archivo anterior
         const { data: mediaList } = await supabase
            .from('activity_media')
            .select(`id, ${column}`)
            .in('activity_id', activityIds)
            .not(column, 'is', null)

         if (mediaList) {
            for (const item of mediaList) {
               const currentUrl = item[column] as string
               // Si la URL contiene el nombre del archivo viejo, lo reemplazamos
               if (currentUrl.includes(oldFileName)) {
                 await supabase
                   .from('activity_media')
                   .update({ [column]: newPublicUrl })
                   .eq('id', item.id)
                 updatedCount++
               }
            }
         }
       }
    }

    return NextResponse.json({
      success: true,
      message: `Archivo reemplazado en ${updatedCount} productos`,
      updatedCount
    })

  } catch (error: any) {
    console.error('[replace-with-existing] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
