import { createRouteHandlerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Verificar que el usuario existe en user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()
    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }
    // Verificar que es un coach
    if (userProfile.role !== 'coach') {
      return NextResponse.json({ error: 'Solo los coaches pueden acceder a su media' }, { status: 403 })
    }
    // Obtener parámetros de la consulta
    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get('type') // 'image' o 'video'
    const allMedia = searchParams.get('all') === 'true' // ✅ Nuevo parámetro para obtener TODOS los archivos
    
    console.log('📁 Coach-Media API: Parámetros recibidos:', {
      mediaType,
      allMedia,
      url: request.url
    })
    
    // ✅ Si no es 'all' y no tiene tipo válido, devolver error
    if (!allMedia && (!mediaType || !['image', 'video'].includes(mediaType))) {
      return NextResponse.json({ error: 'Tipo de media inválido' }, { status: 400 })
    }
    // Obtener primero los activity_ids del coach
    const { data: coachActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title')
      .eq('coach_id', user.id)
    if (activitiesError) {
      console.error('Error obteniendo actividades del coach:', activitiesError)
      return NextResponse.json({ 
        error: 'Error al obtener actividades del coach',
        details: activitiesError.message 
      }, { status: 500 })
    }
    if (!coachActivities || coachActivities.length === 0) {
      return NextResponse.json({
        success: true,
        media: [],
        count: 0
      })
    }
    const activityIds = coachActivities.map(activity => activity.id)
    // Construir la consulta para activity_media
    let query = supabase
      .from('activity_media')
      .select(`
        id,
        activity_id,
        image_url,
        video_url
      `)
      .in('activity_id', activityIds)
    
    // ✅ Solo filtrar por tipo si NO es 'all'
    if (!allMedia) {
      if (mediaType === 'image') {
        query = query.not('image_url', 'is', null).neq('image_url', '')
      } else {
        query = query.not('video_url', 'is', null).neq('video_url', '')
      }
    } else {
      // ✅ Para 'all', filtrar solo los que tienen al menos una URL (imagen O video)
      query = query.or('image_url.not.is.null,video_url.not.is.null')
    }
    // Ejecutar la consulta
    const { data: mediaData, error: mediaError } = await query
      .order('id', { ascending: false })
    if (mediaError) {
      console.error('Error obteniendo media:', mediaError)
      return NextResponse.json({ 
        error: 'Error al obtener media',
        details: mediaError.message 
      }, { status: 500 })
    }
    // Formatear la respuesta
    const formattedMediaArray: any[] = []
    
    mediaData?.forEach(item => {
      const activity = coachActivities.find(act => act.id === item.activity_id)
      
      if (allMedia) {
        // ✅ Para 'all', devolver AMBOS archivos si existen (imagen Y video)
        if (item.image_url && item.image_url.trim() !== '') {
          const imageFilename = item.image_url.split('/').pop()?.split('?')[0] || 'archivo'
          formattedMediaArray.push({
            id: `${item.id}-image`, // ID único para imagen
            activity_id: item.activity_id,
            image_url: item.image_url,
            video_url: null,
            activity_title: activity?.title || 'Sin título',
            created_at: new Date().toISOString(),
            filename: imageFilename,
            media_type: 'image'
          })
        }
        
        if (item.video_url && item.video_url.trim() !== '') {
          const videoFilename = item.video_url.split('/').pop()?.split('?')[0] || 'archivo'
          formattedMediaArray.push({
            id: `${item.id}-video`, // ID único para video
            activity_id: item.activity_id,
            image_url: null,
            video_url: item.video_url,
            activity_title: activity?.title || 'Sin título',
            created_at: new Date().toISOString(),
            filename: videoFilename,
            media_type: 'video'
          })
        }
      } else {
        // ✅ Para tipo específico, devolver solo el tipo solicitado
        const actualMediaType = mediaType as 'image' | 'video'
        const mediaUrl = mediaType === 'image' ? item.image_url : item.video_url
        const filename = mediaUrl ? mediaUrl.split('/').pop()?.split('?')[0] || 'archivo' : 'archivo'
        
        formattedMediaArray.push({
          id: item.id,
          activity_id: item.activity_id,
          image_url: item.image_url,
          video_url: item.video_url,
          activity_title: activity?.title || 'Sin título',
          created_at: new Date().toISOString(),
          filename: filename,
          media_type: actualMediaType
        })
      }
    })
    
    const formattedMedia = formattedMediaArray
    console.log(`✅ Coach-Media API: ${allMedia ? 'TODOS los archivos' : mediaType} obtenido:`, {
      totalArchivos: formattedMedia.length,
      actividadesDelCoach: coachActivities.length,
      mediaEncontrado: mediaData?.length || 0,
      archivosFormateados: formattedMedia.length,
      tiposEncontrados: formattedMedia.map(item => item.media_type)
    })
    return NextResponse.json({
      success: true,
      media: formattedMedia,
      count: formattedMedia.length
    })
  } catch (error) {
    console.error('Error en coach-media:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
