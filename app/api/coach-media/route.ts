import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener coach_id
    let coachId = user.id

    const { data: coachRecord } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (coachRecord) {
      coachId = coachRecord.id
    }

    // Usar service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. IMÁGENES desde Storage
    const { data: images } = await supabaseAdmin.storage
      .from('product-media')
      .list(`coaches/${coachId}/images`, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })

    const imageFiles = (images || [])
      .filter(file => !file.name.includes('.emptyFolderPlaceholder') && !file.name.includes('.keep'))
      .map(file => {
        const path = `coaches/${coachId}/images/${file.name}`
        const { data: urlData } = supabaseAdmin.storage
          .from('product-media')
          .getPublicUrl(path)

        return {
          id: file.id,
          filename: file.name,
          media_type: 'image' as const,
          image_url: urlData.publicUrl,
          activity_id: 0,
          activity_title: 'Imagen del Coach',
          created_at: file.created_at,
          updated_at: file.updated_at,
          size: file.metadata?.size || 0
        }
      })

    // 2. ACTIVIDADES del coach
    const { data: coachActivities } = await supabaseAdmin
      .from('activities')
      .select('id, title')
      .eq('coach_id', coachId)

    // 3. VIDEOS desde activity_media
    const { data: allActivityMedia } = await supabaseAdmin
      .from('activity_media')
      .select('*')
      .eq('coach_id', coachId)

    const activityVideosData = (allActivityMedia || [])
      .filter(item => item.video_url && item.video_url.trim() !== '')
      .map(video => ({
        id: video.id,
        filename: coachActivities?.find(a => a.id === video.activity_id)?.title || 'Video de Actividad',
        media_type: 'video' as const,
        video_url: video.video_url,
        bunny_video_id: video.bunny_video_id,
        storage_provider: video.storage_provider || 'bunny',
        thumbnail_url: video.video_thumbnail_url,
        activity_id: video.activity_id,
        activity_title: coachActivities?.find(a => a.id === video.activity_id)?.title || 'Actividad',
        created_at: video.created_at || new Date().toISOString(),
        updated_at: video.updated_at || new Date().toISOString(),
        size: 0
      }))

    // 4. VIDEOS desde ejercicios_detalles
    const { data: exerciseVideos } = await supabaseAdmin
      .from('ejercicios_detalles')
      .select('*')
      .eq('coach_id', coachId)

    const exerciseVideosData = (exerciseVideos || [])
      .filter(item => item.video_url && item.video_url.trim() !== '')
      .map(video => ({
        id: video.id.toString(),
        filename: `${video.nombre_ejercicio || 'Ejercicio'}.mp4`,
        media_type: 'video' as const,
        video_url: video.video_url,
        bunny_video_id: video.bunny_video_id,
        storage_provider: video.storage_provider || 'bunny',
        thumbnail_url: video.video_thumbnail_url,
        activity_id: video.activity_id,
        activity_title: coachActivities?.find(a => a.id === video.activity_id)?.title || 'Ejercicio',
        created_at: video.created_at || new Date().toISOString(),
        updated_at: video.updated_at || new Date().toISOString(),
        size: 0
      }))

    // 5. VIDEOS desde nutrition_program_details
    const { data: nutritionVideos } = await supabaseAdmin
      .from('nutrition_program_details')
      .select('*')
      .eq('coach_id', coachId)

    const nutritionVideosData = (nutritionVideos || [])
      .filter(item => item.video_url && item.video_url.trim() !== '')
      .map(video => ({
        id: video.id.toString(),
        filename: `${video.nombre || 'Plato'}.mp4`,
        media_type: 'video' as const,
        video_url: video.video_url,
        bunny_video_id: null,
        storage_provider: 'bunny',
        thumbnail_url: null,
        activity_id: video.activity_id,
        activity_title: coachActivities?.find(a => a.id === video.activity_id)?.title || 'Plato de Nutrición',
        created_at: video.created_at || new Date().toISOString(),
        updated_at: video.updated_at || new Date().toISOString(),
        size: 0
      }))

    // Combinar todos
    const allVideos = [...activityVideosData, ...exerciseVideosData, ...nutritionVideosData]
    const allMedia = [...imageFiles, ...allVideos]

    console.log('🔍 FINAL RESULT:', {
      totalImages: imageFiles.length,
      totalVideos: allVideos.length,
      activityVideos: activityVideosData.length,
      exerciseVideos: exerciseVideosData.length,
      nutritionVideos: nutritionVideosData.length,
      allMediaCount: allMedia.length
    })

    return NextResponse.json({ 
      media: allMedia,
      debug: {
        totalImages: imageFiles.length,
        totalVideos: allVideos.length,
        activityVideosCount: activityVideosData.length,
        exerciseVideosCount: exerciseVideosData.length,
        nutritionVideosCount: nutritionVideosData.length,
        coachId: coachId,
        userId: user.id
      }
    })
  } catch (e: any) {
    console.error('❌ Error en /api/coach-media:', e)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
