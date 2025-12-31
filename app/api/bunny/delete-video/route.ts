import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient } from '@/lib/bunny/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const videoId = typeof body?.videoId === 'string' ? body.videoId.trim() : ''
    const activityId = body?.activityId ? parseInt(body.activityId, 10) : undefined
    const exerciseId = body?.exerciseId ? parseInt(body.exerciseId, 10) : undefined

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'videoId requerido' }, { status: 400 })
    }

    // Modo "force delete": no bloqueamos por referencias.
    // El objetivo es que el archivo desaparezca de la lista, incluso si Bunny no lo tiene.

    let deleted = false
    try {
      deleted = await bunnyClient.deleteVideo(videoId)
    } catch (err) {
      console.error('❌ Error llamando a Bunny deleteVideo (continuando igual):', err)
      deleted = false
    }

    // Limpiar referencias en BD para que el video desaparezca del producto aunque Bunny ya no lo tenga.
    // 1) ejercicios_detalles
    try {
      if (exerciseId) {
        await supabase
          .from('ejercicios_detalles')
          .update({
            video_url: null,
            bunny_video_id: null,
            bunny_library_id: null,
            video_thumbnail_url: null
          })
          .eq('id', exerciseId)
          .eq('coach_id', user.id)
      } else {
        await supabase
          .from('ejercicios_detalles')
          .update({
            video_url: null,
            bunny_video_id: null,
            bunny_library_id: null,
            video_thumbnail_url: null
          })
          .eq('coach_id', user.id)
          .eq('bunny_video_id', videoId)

        await supabase
          .from('ejercicios_detalles')
          .update({
            video_url: null,
            bunny_video_id: null,
            bunny_library_id: null,
            video_thumbnail_url: null
          })
          .eq('coach_id', user.id)
          .ilike('video_url', `%${videoId}%`)
      }
    } catch (dbErr) {
      console.error('❌ Error limpiando ejercicios_detalles (continuando):', dbErr)
    }

    // 2) platos_detalles (nutrición)
    try {
      await supabase
        .from('platos_detalles')
        .update({
          video_url: null,
          bunny_video_id: null,
          bunny_library_id: null,
          video_thumbnail_url: null
        } as any)
        .eq('coach_id', user.id)
        .eq('bunny_video_id', videoId)

      await supabase
        .from('platos_detalles')
        .update({
          video_url: null,
          bunny_video_id: null,
          bunny_library_id: null,
          video_thumbnail_url: null
        } as any)
        .eq('coach_id', user.id)
        .ilike('video_url' as any, `%${videoId}%`)
    } catch (dbErr) {
      console.error('❌ Error limpiando platos_detalles (continuando):', dbErr)
    }

    // 3) activity_media (por activities del coach)
    try {
      const { data: coachActivities } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', user.id)

      const activityIds = (coachActivities || []).map((a: any) => a.id)
      if (activityIds.length > 0) {
        await supabase
          .from('activity_media')
          .update({
            video_url: null,
            bunny_video_id: null,
            bunny_library_id: null,
            video_thumbnail_url: null
          } as any)
          .in('activity_id', activityIds)
          .eq('bunny_video_id', videoId)

        await supabase
          .from('activity_media')
          .update({
            video_url: null,
            bunny_video_id: null,
            bunny_library_id: null,
            video_thumbnail_url: null
          } as any)
          .in('activity_id', activityIds)
          .ilike('video_url', `%${videoId}%`)
      }
    } catch (dbErr) {
      console.error('❌ Error limpiando activity_media (continuando):', dbErr)
    }

    // 4) nutrition_program_details (no siempre tiene bunny_*; al menos limpiamos video_url si matchea por guid)
    try {
      const { data: coachActivities2 } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', user.id)

      const activityIds = (coachActivities2 || []).map((a: any) => a.id)
      if (activityIds.length > 0) {
        const byIdAttempt = await supabase
          .from('nutrition_program_details')
          .update({ video_url: null, video_file_name: null } as any)
          .in('activity_id', activityIds)
          .eq('bunny_video_id' as any, videoId as any)

        // Si bunny_video_id no existe como columna, esto va a fallar. En ese caso (o igual), limpiamos por URL.
        if (byIdAttempt.error) {
          console.warn('⚠️ No se pudo limpiar nutrition_program_details por bunny_video_id, intentando por video_url')
        }

        await supabase
          .from('nutrition_program_details')
          .update({ video_url: null, video_file_name: null } as any)
          .in('activity_id', activityIds)
          .ilike('video_url', `%${videoId}%`)
      }
    } catch (dbErr) {
      console.error('❌ Error limpiando nutrition_program_details (continuando):', dbErr)
    }

    if (!deleted) {
      // Comportamiento idempotente: si Bunny ya no lo tiene (o falla el delete), no bloqueamos la UX.
      return NextResponse.json({
        success: true,
        deleted: false,
        warning: 'No se pudo eliminar el video en Bunny.net (puede que ya no exista).'
      })
    }

    return NextResponse.json({ success: true, deleted: true })
  } catch (error: any) {
    console.error('❌ Error eliminando video de Bunny:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Error interno' }, { status: 500 })
  }
}
