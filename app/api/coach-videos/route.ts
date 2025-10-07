import { createRouteHandlerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // console.log('🔍 Iniciando endpoint coach-videos')
  // console.log('🔍 URL:', request.url)
  // console.log('🔍 Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const supabase = await createRouteHandlerClient()
    // console.log('🔍 Cliente Supabase creado')
    
    // Obtener el usuario autenticado
    // console.log('🔍 Intentando obtener usuario autenticado...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // console.log('🔍 Resultado autenticación:', { hasUser: !!user, userId: user?.id, userEmail: user?.email, authError: authError?.message })
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json({ error: 'Error de autenticación', details: authError.message }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ Usuario no autenticado')
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // console.log('🔍 Usuario autenticado:', { id: user.id, email: user.email })

    // Obtener el coach_id del usuario - intentar diferentes campos
    // console.log('🔍 Buscando coach para usuario:', user.id)
    let coachData = null
    let coachError = null

    try {
      // Primero intentar con user_id
      // console.log('🔍 Intentando buscar coach por user_id:', user.id)
      const { data: coachByUserId, error: errorByUserId } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // console.log('🔍 Resultado búsqueda por user_id:', { coachByUserId, errorByUserId })

      if (coachByUserId) {
        coachData = coachByUserId
        // console.log('✅ Coach encontrado por user_id:', coachData)
      } else {
        // Si no funciona, intentar con id directo
        // console.log('🔍 Intentando buscar coach por id directo:', user.id)
        const { data: coachById, error: errorById } = await supabase
          .from('coaches')
          .select('id')
          .eq('id', user.id)
          .single()

        // console.log('🔍 Resultado búsqueda por id directo:', { coachById, errorById })

        if (coachById) {
          coachData = coachById
          // console.log('✅ Coach encontrado por id directo:', coachData)
        } else {
          // Si tampoco funciona, intentar con email
          // console.log('🔍 Intentando buscar coach por email:', user.email)
          const { data: coachByEmail, error: errorByEmail } = await supabase
            .from('coaches')
            .select('id')
            .eq('email', user.email)
            .single()

          // console.log('🔍 Resultado búsqueda por email:', { coachByEmail, errorByEmail })

          if (coachByEmail) {
            coachData = coachByEmail
            // console.log('✅ Coach encontrado por email:', coachData)
          } else {
            coachError = errorByEmail
            console.log('❌ Coach no encontrado por ningún método')
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en búsqueda de coach:', error)
      coachError = error
    }

    // console.log('🔍 Resultado búsqueda coach:', { coachData, coachError })

    if (coachError || !coachData) {
      return NextResponse.json({ 
        error: 'Coach no encontrado',
        debug: {
          userId: user.id,
          userEmail: user.email,
          coachError: coachError
        }
      }, { status: 404 })
    }

    const coachId = coachData.id

    // Obtener todas las actividades del coach
    // console.log('🔍 Buscando actividades para coach_id:', coachId)
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title')
      .eq('coach_id', coachId)

    // console.log('🔍 Resultado consulta actividades:', { count: activities?.length || 0 })

    if (activitiesError) {
      console.error('Error obteniendo actividades:', activitiesError)
      return NextResponse.json({ error: 'Error obteniendo actividades' }, { status: 500 })
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ videos: [] })
    }

    const activityIds = activities.map(activity => activity.id)

    // // console.log('🔍 Buscando videos para activity_ids:', activityIds)

    // Obtener todos los videos de las actividades del coach
    console.log('🔍 Buscando videos para activity_ids:', activityIds)
    const { data: videos, error: videosError } = await supabase
      .from('activity_media')
      .select(`
        id,
        activity_id,
        video_url
      `)
      .in('activity_id', activityIds)
      .not('video_url', 'is', null)

    // console.log('🔍 Resultado consulta videos:', { videosCount: videos?.length || 0, videosError: videosError?.message, sampleVideo: videos?.[0] })

    if (videosError) {
      console.error('❌ Error obteniendo videos:', videosError)
      return NextResponse.json({ 
        error: 'Error obteniendo videos', 
        details: videosError.message,
        activityIds: activityIds
      }, { status: 500 })
    }

    // Obtener los títulos de las actividades
    // console.log('🔍 Buscando títulos de actividades para activity_ids:', activityIds)
    const { data: activityTitles, error: titlesError } = await supabase
      .from('activities')
      .select('id, title')
      .in('id', activityIds)

    // console.log('🔍 Resultado consulta títulos:', { count: activityTitles?.length || 0 })

    if (titlesError) {
      console.error('❌ Error obteniendo títulos de actividades:', titlesError)
    }

    // console.log('🔍 Títulos de actividades:', { count: activityTitles?.length || 0 })

    // Crear un mapa de activity_id -> title
    const titleMap = new Map()
    if (activityTitles) {
      activityTitles.forEach(activity => {
        titleMap.set(activity.id, activity.title)
      })
    }

    // console.log('🔍 Mapa de títulos creado:', { size: titleMap.size })

    // Formatear la respuesta
    const formattedVideos = videos.map(video => ({
      id: video.id,
      activity_id: video.activity_id,
      video_url: video.video_url,
      activity_title: titleMap.get(video.activity_id) || 'Sin título',
      created_at: new Date().toISOString(), // Usar fecha actual como fallback
      filename: video.video_url ? video.video_url.split('/').pop()?.split('?')[0] || 'video.mp4' : 'video.mp4'
    }))

    console.log(`📹 Videos encontrados para coach ${coachId}:`, formattedVideos.length)

    return NextResponse.json({ 
      videos: formattedVideos,
      total: formattedVideos.length
    })

  } catch (error) {
    console.error('❌ Error en coach-videos:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}




