import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient, getAllCoachVideosFromBunny } from '@/lib/bunny'

export async function GET(request: NextRequest) {
  console.log('🚀 [COACH-MEDIA] Endpoint llamado')
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🚀 [COACH-MEDIA] Usuario autenticado:', { userId: user?.id, error: authError?.message })

    if (authError || !user) {
      console.log('❌ [COACH-MEDIA] Usuario no autorizado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si el usuario es coach consultando la tabla coaches
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Solo los coaches pueden acceder a esta API' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    // Obtener todas las actividades del coach
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title')
      .eq('coach_id', user.id)

    if (activitiesError) {
      console.error('Error obteniendo actividades:', activitiesError)
      return NextResponse.json({ error: 'Error obteniendo actividades' }, { status: 500 })
    }

    const activityIds = activities?.map((a: any) => a.id) || []

    // Obtener todos los archivos de activity_media del coach
    const baseColumns = [
      'id',
      'activity_id',
      'image_url',
      'video_url',
      'pdf_url',
      'bunny_video_id',
      'bunny_library_id',
      'video_thumbnail_url'
    ]

    const selectWithFileName = `${baseColumns.join(', ')}, video_file_name`
    const selectWithoutFileName = baseColumns.join(', ')

    const fetchMedia = async (select: string) =>
      supabase
      .from('activity_media')
        .select(select)
      .in('activity_id', activityIds)
      .order('id', { ascending: false })

    let { data: media, error: mediaError } = await fetchMedia(selectWithFileName)

    if (
      mediaError &&
      (mediaError.code === '42703' ||
        mediaError.message?.toLowerCase().includes('video_file_name'))
    ) {
      console.warn(
        'El campo video_file_name no existe en activity_media, usando consulta alternativa sin la columna.'
      )
      const fallback = await fetchMedia(selectWithoutFileName)
      media = fallback.data
      mediaError = fallback.error
    }

    if (mediaError) {
      console.error('Error obteniendo media:', mediaError)
      return NextResponse.json({ 
        error: 'Error obteniendo media',
        details: mediaError.message,
        code: mediaError.code
      }, { status: 500 })
    }

    // ✅ OBTENER TODOS LOS bunny_video_id ÚNICOS DEL COACH Y SU INFORMACIÓN
    const coachBunnyVideoIds = new Set<string>()
    const videosMap = new Map<string, any>()
    const nonBunnyVideosMap = new Map<string, any>() // key: video_url
    
    // Función helper para extraer guid de una URL de Bunny
    const extractBunnyGuidFromUrl = (url: string): string | null => {
      if (!url) return null
      try {
        // ✅ Formato Bunny CDN: https://vz-{libraryId}.b-cdn.net/{guid}/playlist.m3u8
        // ✅ El GUID es la parte del pathname entre los slashes
        // ✅ Formato UUID: [a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}
        const guidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
        if (guidMatch && guidMatch[1]) {
          return guidMatch[1]
        }
        
        // Si no encontramos UUID, intentar extraer del pathname
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(p => p)
        // Buscar el guid en diferentes formatos (debe ser un UUID de 36 caracteres)
        for (const part of pathParts) {
          // Los guid de Bunny son UUIDs de exactamente 36 caracteres (32 hex + 4 guiones)
          if (part && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(part)) {
            return part
          }
          // Fallback: strings alfanuméricos de ~36 caracteres sin puntos
          if (part && part.length === 36 && !part.includes('.')) {
            return part
          }
        }
        // Si no encontramos en pathname, buscar en el hostname o path completo
        if (url.includes('mediadelivery.net')) {
          const embedMatch = url.match(/embed\/([a-zA-Z0-9\-]+)/)
          if (embedMatch && embedMatch[1]) return embedMatch[1]
        }
        if (url.includes('b-cdn.net')) {
          const cdnMatch = url.match(/\/videos?\/([a-zA-Z0-9\-]+)/)
          if (cdnMatch && cdnMatch[1]) return cdnMatch[1]
        }
      } catch {
        // Si no es URL válida, intentar extraer directamente con regex UUID
        const guidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
        if (guidMatch && guidMatch[1]) return guidMatch[1]
      }
      return null
    }
    
    // Recolectar bunny_video_id de activity_media
    // ✅ IMPORTANTE: Solo usar bunny_video_id EXPLÍCITO de la BD (NO extraer de URLs)
    // Esto asegura que solo mostremos videos que realmente tienen bunny_video_id en la BD
    if (media && media.length > 0) {
      media.forEach((item: any) => {
        // ✅ SOLO agregar si hay bunny_video_id EXPLÍCITO (no extraer de URLs)
        // Esto evita duplicados y asegura que solo mostremos los 3 videos únicos
        if (item.bunny_video_id && item.bunny_video_id.trim() !== '') {
          const bunnyId = item.bunny_video_id.trim()
          coachBunnyVideoIds.add(bunnyId)
          
          const existing = videosMap.get(bunnyId)
          // Preferir el que tenga video_file_name o más información
          if (!existing || (!existing.video_file_name && item.video_file_name) || (!existing.video_thumbnail_url && item.video_thumbnail_url)) {
            videosMap.set(bunnyId, {
              video_url: item.video_url,
              bunny_video_id: bunnyId,
              bunny_library_id: item.bunny_library_id,
              video_thumbnail_url: item.video_thumbnail_url,
              activity_id: item.activity_id,
              video_file_name: item.video_file_name || null
            })
          }
        } else if (item.video_url && String(item.video_url).trim() !== '') {
          // Fallback: guardar videos sin bunny_video_id (por video_url)
          const urlKey = String(item.video_url).trim()
          if (!nonBunnyVideosMap.has(urlKey)) {
            nonBunnyVideosMap.set(urlKey, {
              video_url: urlKey,
              bunny_video_id: null,
              bunny_library_id: item.bunny_library_id || null,
              video_thumbnail_url: item.video_thumbnail_url || null,
              activity_id: item.activity_id,
              video_file_name: item.video_file_name || null,
              nombre_ejercicio: null,
              nombre_plato: null
            })
          }
        }
      })
    }
    
    // Recolectar bunny_video_id de ejercicios_detalles (una sola consulta con toda la info)
    const { data: ejerciciosDetalles, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('bunny_video_id, video_url, bunny_library_id, video_thumbnail_url, activity_id, video_file_name, nombre_ejercicio')
      .eq('coach_id', user.id)
      .not('video_url', 'is', null)
      .neq('video_url', '')

    if (ejerciciosError) {
      console.error('Error obteniendo videos de ejercicios:', ejerciciosError)
    } else if (ejerciciosDetalles) {
      ejerciciosDetalles.forEach((ejercicio: any) => {
        // ✅ SOLO agregar si hay bunny_video_id EXPLÍCITO (no extraer de URLs)
        // Esto asegura que solo mostremos los videos que realmente tienen bunny_video_id en la BD
        if (ejercicio.bunny_video_id && ejercicio.bunny_video_id.trim() !== '') {
          const bunnyId = ejercicio.bunny_video_id.trim()
          coachBunnyVideoIds.add(bunnyId)
          
          const existing = videosMap.get(bunnyId)
          // Preferir el que tenga video_file_name, video_thumbnail_url o nombre_ejercicio
          const hasBetterInfo = !existing || 
            (!existing.video_file_name && ejercicio.video_file_name) ||
            (!existing.video_thumbnail_url && ejercicio.video_thumbnail_url) ||
            (!existing.nombre_ejercicio && ejercicio.nombre_ejercicio)
          
          if (hasBetterInfo) {
            videosMap.set(bunnyId, {
              video_url: ejercicio.video_url,
              bunny_video_id: bunnyId,
              bunny_library_id: ejercicio.bunny_library_id,
              video_thumbnail_url: ejercicio.video_thumbnail_url,
              activity_id: ejercicio.activity_id,
              video_file_name: ejercicio.video_file_name || null,
              nombre_ejercicio: ejercicio.nombre_ejercicio || null
            })
          }
        } else if (ejercicio.video_url && String(ejercicio.video_url).trim() !== '') {
          const urlKey = String(ejercicio.video_url).trim()
          const existing = nonBunnyVideosMap.get(urlKey)
          if (
            !existing ||
            (!existing.video_thumbnail_url && ejercicio.video_thumbnail_url) ||
            (!existing.nombre_ejercicio && ejercicio.nombre_ejercicio)
          ) {
            nonBunnyVideosMap.set(urlKey, {
              video_url: urlKey,
              bunny_video_id: null,
              bunny_library_id: ejercicio.bunny_library_id || null,
              video_thumbnail_url: ejercicio.video_thumbnail_url || null,
              activity_id: ejercicio.activity_id,
              video_file_name: ejercicio.video_file_name || null,
              nombre_ejercicio: ejercicio.nombre_ejercicio || null,
              nombre_plato: null
            })
          }
        }
      })
    }

    // Recolectar bunny_video_id de platos_detalles (videos de nutrición)
    const { data: platosDetalles, error: platosError } = await supabase
      .from('platos_detalles')
      .select('bunny_video_id, video_url, bunny_library_id, video_thumbnail_url, activity_id, video_file_name, nombre_plato')
      .eq('coach_id', user.id)
      .not('video_url', 'is', null)
      .neq('video_url', '')

    if (platosError) {
      console.error('Error obteniendo videos de platos:', platosError)
    } else if (platosDetalles) {
      platosDetalles.forEach((plato: any) => {
        // ✅ SOLO agregar si hay bunny_video_id EXPLÍCITO (no extraer de URLs)
        if (plato.bunny_video_id && plato.bunny_video_id.trim() !== '') {
          const bunnyId = plato.bunny_video_id.trim()
          coachBunnyVideoIds.add(bunnyId)
          
          const existing = videosMap.get(bunnyId)
          // Preferir el que tenga video_file_name, video_thumbnail_url o nombre_plato
          const hasBetterInfo = !existing || 
            (!existing.video_file_name && plato.video_file_name) ||
            (!existing.video_thumbnail_url && plato.video_thumbnail_url) ||
            (!existing.nombre_plato && plato.nombre_plato)
          
          if (hasBetterInfo) {
            videosMap.set(bunnyId, {
              video_url: plato.video_url,
              bunny_video_id: bunnyId,
              bunny_library_id: plato.bunny_library_id,
              video_thumbnail_url: plato.video_thumbnail_url,
              activity_id: plato.activity_id,
              video_file_name: plato.video_file_name || null,
              nombre_plato: plato.nombre_plato || null
            })
          }
        } else if (plato.video_url && String(plato.video_url).trim() !== '') {
          const urlKey = String(plato.video_url).trim()
          const existing = nonBunnyVideosMap.get(urlKey)
          if (
            !existing ||
            (!existing.video_thumbnail_url && plato.video_thumbnail_url) ||
            (!existing.nombre_plato && plato.nombre_plato)
          ) {
            nonBunnyVideosMap.set(urlKey, {
              video_url: urlKey,
              bunny_video_id: null,
              bunny_library_id: plato.bunny_library_id || null,
              video_thumbnail_url: plato.video_thumbnail_url || null,
              activity_id: plato.activity_id,
              video_file_name: plato.video_file_name || null,
              nombre_ejercicio: null,
              nombre_plato: plato.nombre_plato || null
            })
          }
        }
      })
    }

    const nonBunnyVideos = Array.from(nonBunnyVideosMap.entries()).map(([videoUrl, dbInfo]) => {
      const activity = activities?.find((a: any) => a.id === dbInfo.activity_id)
      const videoFileName =
        dbInfo.video_file_name ||
        dbInfo.nombre_ejercicio ||
        dbInfo.nombre_plato ||
        (videoUrl ? `video_${String(videoUrl).substring(0, 12)}.mp4` : 'video.mp4')

      return {
        id: videoUrl,
        activity_id: dbInfo.activity_id || null,
        image_url: null,
        video_url: dbInfo.video_url || null,
        pdf_url: null,
        bunny_video_id: null,
        bunny_library_id: dbInfo.bunny_library_id || null,
        video_thumbnail_url: dbInfo.video_thumbnail_url || null,
        video_file_name: dbInfo.video_file_name || null,
        activity_title: activity?.title || null,
        nombre_ejercicio: dbInfo.nombre_ejercicio || null,
        nombre_plato: dbInfo.nombre_plato || null,
        filename: videoFileName,
        media_type: 'video'
      }
    })

    console.log(`🔍 [COACH-MEDIA] Coach tiene ${coachBunnyVideoIds.size} videos únicos en BD`, Array.from(coachBunnyVideoIds))
    console.log(`🔍 [COACH-MEDIA] Videos en videosMap: ${videosMap.size}`, Array.from(videosMap.keys()).slice(0, 10))

    // ✅ CONSULTA DETALLADA A LA BASE DE DATOS PARA DIAGNÓSTICO
    console.log('🔍 [COACH-MEDIA] === DIAGNÓSTICO DE BASE DE DATOS ===')
    console.log(`🔍 [COACH-MEDIA] Actividades del coach: ${activities?.length || 0}`, activities?.map((a: any) => ({ id: a.id, title: a.title })))
    console.log(`🔍 [COACH-MEDIA] Media de activity_media: ${media?.length || 0} videos`)
    if (media && media.length > 0) {
      const videosInActivityMedia = media.filter((m: any) => m.video_url)
      console.log(`🔍 [COACH-MEDIA] Videos en activity_media: ${videosInActivityMedia.length}`, videosInActivityMedia.map((m: any) => ({
        id: m.id,
        activity_id: m.activity_id,
        bunny_video_id: m.bunny_video_id,
        video_url: m.video_url?.substring(0, 100)
      })))
    }
    console.log(`🔍 [COACH-MEDIA] Ejercicios con video: ${ejerciciosDetalles?.length || 0}`)
    if (ejerciciosDetalles && ejerciciosDetalles.length > 0) {
      console.log(`🔍 [COACH-MEDIA] Primeros 3 ejercicios con video:`, ejerciciosDetalles.slice(0, 3).map((e: any) => ({
        id: e.id,
        activity_id: e.activity_id,
        bunny_video_id: e.bunny_video_id,
        video_url: e.video_url?.substring(0, 100)
      })))
    }
    console.log(`🔍 [COACH-MEDIA] Platos con video: ${platosDetalles?.length || 0}`)
    if (platosDetalles && platosDetalles.length > 0) {
      console.log(`🔍 [COACH-MEDIA] Primeros 3 platos con video:`, platosDetalles.slice(0, 3).map((p: any) => ({
        id: p.id,
        activity_id: p.activity_id,
        bunny_video_id: p.bunny_video_id,
        video_url: p.video_url?.substring(0, 100)
      })))
    }
    console.log(`🔍 [COACH-MEDIA] Videos únicos recolectados: ${coachBunnyVideoIds.size}`, Array.from(coachBunnyVideoIds).slice(0, 5))

    // ✅ VERIFICAR CONFIGURACIÓN DE BUNNY
    const streamApiKey = process.env.BUNNY_STREAM_API_KEY
    const streamLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID
    console.log(`🔍 [COACH-MEDIA] === CONFIGURACIÓN BUNNY ===`)
    console.log(`🔍 [COACH-MEDIA] Configuración Bunny:`, {
      tieneStreamApiKey: !!streamApiKey,
      tieneStreamLibraryId: !!streamLibraryId,
      streamLibraryId: streamLibraryId || 'NO CONFIGURADO',
      streamApiKeyLength: streamApiKey?.length || 0
    })

    if (!streamApiKey || !streamLibraryId) {
      console.error('❌ [COACH-MEDIA] Bunny no está configurado correctamente. Faltan variables de entorno.')

      // Fallback: devolver lo que exista en BD (activity_media / ejercicios_detalles / platos_detalles)
      // sin consultar la API de Bunny.
      const fallbackMedia = Array.from(videosMap.entries()).map(([bunnyVideoId, dbInfo]) => {
        const activity = activities?.find((a: any) => a.id === dbInfo.activity_id)
        const videoFileName =
          dbInfo.video_file_name ||
          dbInfo.nombre_ejercicio ||
          dbInfo.nombre_plato ||
          (bunnyVideoId ? `video_${String(bunnyVideoId).substring(0, 12)}.mp4` : 'video.mp4')

        return {
          id: bunnyVideoId,
          activity_id: dbInfo.activity_id || null,
          image_url: null,
          video_url: dbInfo.video_url || null,
          pdf_url: null,
          bunny_video_id: bunnyVideoId,
          bunny_library_id: dbInfo.bunny_library_id || null,
          video_thumbnail_url: dbInfo.video_thumbnail_url || null,
          video_file_name: dbInfo.video_file_name || null,
          activity_title: activity?.title || null,
          nombre_ejercicio: dbInfo.nombre_ejercicio || null,
          nombre_plato: dbInfo.nombre_plato || null,
          filename: videoFileName,
          media_type: 'video'
        }
      })

      const merged = [...fallbackMedia, ...nonBunnyVideos]

      return NextResponse.json({
        media: merged,
        total: merged.length,
        error: 'Bunny no está configurado correctamente'
      })
    }

    // ✅ VERIFICAR SI LA BIBLIOTECA ID COINCIDE CON LA DE BD
    const bdLibraryIds = new Set<number>()
    if (media && media.length > 0) {
      media.forEach((item: any) => {
        if (item.bunny_library_id) bdLibraryIds.add(item.bunny_library_id)
      })
    }
    if (ejerciciosDetalles && ejerciciosDetalles.length > 0) {
      ejerciciosDetalles.forEach((ejercicio: any) => {
        if (ejercicio.bunny_library_id) bdLibraryIds.add(ejercicio.bunny_library_id)
      })
    }
    console.log(`🔍 [COACH-MEDIA] Library IDs en BD:`, Array.from(bdLibraryIds))
    console.log(`🔍 [COACH-MEDIA] Library ID configurada: ${streamLibraryId}`)
    if (bdLibraryIds.size > 0 && streamLibraryId !== Array.from(bdLibraryIds)[0]?.toString()) {
      console.warn(`⚠️ [COACH-MEDIA] Library ID en BD (${Array.from(bdLibraryIds)[0]}) no coincide con configurada (${streamLibraryId})`)
    }

    // ✅ OBTENER TODOS LOS VIDEOS DE BUNNY DE LA BIBLIOTECA DEL COACH
    // IMPORTANTE: Devolver TODOS los videos de Bunny, sin filtrar por BD
    // Esto permite al coach seleccionar cualquier video de su biblioteca
    console.log('📹 [COACH-MEDIA] === CONSULTANDO API DE BUNNY ===')
    console.log('📹 [COACH-MEDIA] Obteniendo TODOS los videos de Bunny (sin filtrar por BD)...')
    
    let allBunnyVideos: any[] = []
    try {
      // Obtener todos los videos de Bunny directamente
      allBunnyVideos = await getAllCoachVideosFromBunny()
      console.log(`✅ [COACH-MEDIA] Total videos obtenidos de Bunny: ${allBunnyVideos.length}`)
      if (allBunnyVideos.length > 0) {
        console.log(`📹 [COACH-MEDIA] Primer video:`, {
          guid: allBunnyVideos[0].guid,
          title: allBunnyVideos[0].title,
          videoLibraryId: allBunnyVideos[0].videoLibraryId,
          status: allBunnyVideos[0].status
        })
      } else {
        console.warn('⚠️ [COACH-MEDIA] No se encontraron videos en Bunny')
      }
    } catch (error: any) {
      console.error('❌ [COACH-MEDIA] Error obteniendo videos de Bunny:', error)
      console.error('❌ [COACH-MEDIA] Stack:', error?.stack)
      console.error('❌ [COACH-MEDIA] Message:', error?.message)
      // Continuar con array vacío si hay error
      allBunnyVideos = []
    }
    
    console.log(`✅ [COACH-MEDIA] Total videos de Bunny a devolver: ${allBunnyVideos.length}`)
    console.log(`✅ [COACH-MEDIA] Videos únicos en BD por bunny_video_id: ${coachBunnyVideoIds.size}`)

    // Formatear los datos para el frontend
    let formattedMedia: any[] = []
    
    // Si hay videos de Bunny, usar esos (fuente de verdad)
    // IMPORTANTE: Solo mostrar videos que el coach tiene en BD (coachBunnyVideoIds)
    if (allBunnyVideos.length > 0) {
      // Filtrar solo videos que el coach tiene en BD para evitar mostrar videos de otros coaches
      const coachVideosFromBunny = allBunnyVideos.filter((bunnyVideo: any) => 
        coachBunnyVideoIds.has(bunnyVideo.guid)
      )
      
      console.log(`✅ [COACH-MEDIA] Videos de Bunny filtrados por BD del coach: ${coachVideosFromBunny.length} de ${allBunnyVideos.length}`)
      console.log(`✅ [COACH-MEDIA] coachBunnyVideoIds contiene:`, Array.from(coachBunnyVideoIds))
      console.log(`✅ [COACH-MEDIA] Primeros 3 videos filtrados:`, coachVideosFromBunny.slice(0, 3).map((v: any) => v.guid))
      
      // ✅ Asegurar que solo se muestren videos únicos (agrupados por bunny_video_id)
      // Crear un Map para agrupar por bunny_video_id
      const uniqueVideosMap = new Map<string, any>()
      coachVideosFromBunny.forEach((bunnyVideo: any) => {
        const videoId = bunnyVideo.guid
        // Si ya existe, preferir el que tenga más información
        const existing = uniqueVideosMap.get(videoId)
        if (!existing || (!existing.title && bunnyVideo.title)) {
          uniqueVideosMap.set(videoId, bunnyVideo)
        }
      })
      
      console.log(`✅ [COACH-MEDIA] Videos únicos después de agrupar: ${uniqueVideosMap.size} de ${coachVideosFromBunny.length}`)
      
      formattedMedia = Array.from(uniqueVideosMap.values()).map((bunnyVideo: any) => {
        // Buscar información en BD si existe (opcional, para enriquecer datos)
        const dbInfo = videosMap.get(bunnyVideo.guid) || {}
        const activity = activities?.find((a: any) => a.id === dbInfo.activity_id)
        
        // Priorizar: video_file_name de BD > title de Bunny > fallback
        const videoFileName = dbInfo.video_file_name || 
                             bunnyVideo.title || 
                             `video_${bunnyVideo.guid.substring(0, 12)}.mp4`
        
        // Construir video_url: usar siempre el stream URL de Bunny (es la fuente de verdad)
        // Si hay un video_url en BD, verificar que sea válido, sino usar el de Bunny
        let videoUrl = bunnyClient.getStreamUrl(bunnyVideo.guid)
        if (dbInfo.video_url && dbInfo.video_url.trim() !== '') {
          // Verificar que el video_url de BD sea válido (contenga el guid)
          if (dbInfo.video_url.includes(bunnyVideo.guid)) {
            videoUrl = dbInfo.video_url
          }
        }
        
        // Construir thumbnail_url: preferir el de la BD, si no existe usar el thumbnail URL de Bunny
        const thumbnailUrl = dbInfo.video_thumbnail_url || 
                            bunnyClient.getThumbnailUrl(bunnyVideo.guid, bunnyVideo.thumbnailFileName)
        
        return {
          id: bunnyVideo.guid,
          activity_id: dbInfo.activity_id || null,
          image_url: null,
          video_url: videoUrl,
          pdf_url: null,
          bunny_video_id: bunnyVideo.guid,
          bunny_library_id: bunnyVideo.videoLibraryId || parseInt(streamLibraryId) || null,
          video_thumbnail_url: thumbnailUrl,
          video_file_name: videoFileName,
          activity_title: activity?.title || null,
          nombre_ejercicio: dbInfo.nombre_ejercicio || null,
          nombre_plato: dbInfo.nombre_plato || null,
          filename: videoFileName,
          media_type: 'video',
          // Información adicional de Bunny
          dateUploaded: bunnyVideo.dateUploaded,
          views: bunnyVideo.views || 0,
          length: bunnyVideo.length || 0,
          status: bunnyVideo.status
        }
      })
    } else if (videosMap.size > 0) {
      // Si no hay videos de Bunny pero hay videos en BD, usar esos
      // ✅ videosMap ya está agrupado por bunny_video_id, así que cada entrada es única
      console.log(`⚠️ [COACH-MEDIA] No hay videos en Bunny API, usando videos de BD: ${videosMap.size} videos únicos`)
      
      formattedMedia = Array.from(videosMap.entries())
        .map(([bunnyVideoId, dbInfo]) => {
          const activity = activities?.find((a: any) => a.id === dbInfo.activity_id)
          
          // Construir video_url desde BD (si existe) o generar desde guid
          let videoUrl = dbInfo.video_url
          if (!videoUrl && dbInfo.bunny_video_id) {
            videoUrl = bunnyClient.getStreamUrl(dbInfo.bunny_video_id)
          }
          
          // Construir thumbnail_url
          const thumbnailUrl = dbInfo.video_thumbnail_url || 
                              (dbInfo.bunny_video_id ? bunnyClient.getThumbnailUrl(dbInfo.bunny_video_id) : null)
          
          // Obtener nombre del video
          const videoFileName = dbInfo.video_file_name || 
                               dbInfo.nombre_ejercicio || 
                               dbInfo.nombre_plato ||
                               (dbInfo.bunny_video_id ? `video_${dbInfo.bunny_video_id.substring(0, 12)}.mp4` : 'video.mp4')
          
          return {
            id: bunnyVideoId,
            activity_id: dbInfo.activity_id || null,
            image_url: null,
            video_url: videoUrl,
            pdf_url: null,
            bunny_video_id: bunnyVideoId,
            bunny_library_id: dbInfo.bunny_library_id || parseInt(streamLibraryId) || null,
            video_thumbnail_url: thumbnailUrl,
            video_file_name: videoFileName,
            activity_title: activity?.title || null,
            nombre_ejercicio: dbInfo.nombre_ejercicio || null,
            nombre_plato: dbInfo.nombre_plato || null,
            filename: videoFileName,
            media_type: 'video'
          }
        })
    }

    // Agregar videos sin bunny_video_id (por video_url) para cubrir todos los productos/ejercicios/platos del coach
    if (nonBunnyVideos.length > 0) {
      const existingUrls = new Set<string>()
      formattedMedia.forEach((m: any) => {
        if (m?.video_url) existingUrls.add(String(m.video_url))
      })
      const extra = nonBunnyVideos.filter((m: any) => m?.video_url && !existingUrls.has(String(m.video_url)))
      if (extra.length > 0) {
        formattedMedia = [...formattedMedia, ...extra]
      }
    }

    console.log(`📤 [COACH-MEDIA] === RESUMEN FINAL ===`)
    console.log(`📤 [COACH-MEDIA] Videos de Bunny API: ${allBunnyVideos.length}`)
    console.log(`📤 [COACH-MEDIA] Videos formateados para frontend: ${formattedMedia.length}`)
    console.log(`📤 [COACH-MEDIA] Videos en BD (referencia): ${coachBunnyVideoIds.size}`)
    
    if (formattedMedia.length > 0) {
      console.log(`📹 [COACH-MEDIA] Primer video:`, {
        id: formattedMedia[0].id,
        filename: formattedMedia[0].filename,
        video_url: formattedMedia[0].video_url?.substring(0, 80) + '...',
        bunny_video_id: formattedMedia[0].bunny_video_id
      })
    } else {
      console.warn('⚠️ [COACH-MEDIA] No hay videos para devolver.')
      console.warn(`⚠️ [COACH-MEDIA] allBunnyVideos.length: ${allBunnyVideos.length}`)
      
      if (allBunnyVideos.length === 0) {
        console.error('❌ [COACH-MEDIA] PROBLEMA DETECTADO: Bunny API no devuelve videos')
        console.error('❌ [COACH-MEDIA] Esto puede indicar:')
        console.error('   - Las variables de entorno de Bunny están incorrectas')
        console.error('   - La biblioteca de Bunny está vacía')
        console.error('   - Problemas de conexión con la API de Bunny')
      }
    }

    return NextResponse.json({ 
      media: formattedMedia,
      total: formattedMedia.length,
      debug: {
        videosInDb: coachBunnyVideoIds.size,
        videosInBunny: allBunnyVideos.length,
        activitiesCount: activities?.length || 0,
        mediaFromActivities: media?.length || 0,
        exercisesWithVideo: ejerciciosDetalles?.length || 0,
        platosWithVideo: platosDetalles?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Error en /api/coach-media:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}


