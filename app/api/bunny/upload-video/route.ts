import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient } from '@/lib/bunny'
import { deleteVideoIfUnused } from '@/lib/bunny/video-cleanup'
import { hasActivity } from '@/lib/utils/exercise-activity-map'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BUNNY_STREAM_API_KEY || !process.env.BUNNY_STREAM_LIBRARY_ID) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Bunny Stream no está configurado: faltan BUNNY_STREAM_API_KEY y/o BUNNY_STREAM_LIBRARY_ID en el servidor.'
        },
        { status: 500 }
      )
    }

    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const requestedTitleRaw = formData.get('title')
    const requestedTitle = typeof requestedTitleRaw === 'string' ? requestedTitleRaw.trim() : ''
    const title = (requestedTitle && requestedTitle.length > 0 ? requestedTitle : file.name)
    const exerciseId = formData.get('exerciseId') as string
    const activityId = formData.get('activityId') as string
    const mediaId = formData.get('mediaId') as string // Para actualizar activity_media

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    const normalizedFileName =
      typeof title === 'string' && title.trim().length > 0
        ? title.trim().slice(0, 255)
        : (typeof file?.name === 'string' && file.name.trim().length > 0
            ? file.name.trim().slice(0, 255)
            : null)

    const findReusableVideo = async () => {
      if (!normalizedFileName) return null

      const { data: existingExercise } = await supabase
        .from('ejercicios_detalles')
        .select('video_url, bunny_video_id, bunny_library_id, video_thumbnail_url, video_file_name')
        .eq('coach_id', user.id)
        .eq('video_file_name', normalizedFileName)
        .not('bunny_video_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingExercise?.bunny_video_id && existingExercise.video_url) {
        return {
          streamUrl: existingExercise.video_url,
          thumbnailUrl: existingExercise.video_thumbnail_url || null,
          videoId: existingExercise.bunny_video_id,
          libraryId: existingExercise.bunny_library_id,
          fileName: existingExercise.video_file_name || normalizedFileName,
          reused: true
        }
      }

      return null
    }

    let videoMeta =
      await findReusableVideo()

    if (!videoMeta) {
      const uploadResult = await bunnyClient.uploadVideoToStream(file, title)

      if (!uploadResult.success) {
        return NextResponse.json({ 
          error: uploadResult.error || 'Error subiendo video',
          success: false 
        }, { status: 500 })
      }

      videoMeta = {
        streamUrl: bunnyClient.getStreamUrl(uploadResult.videoId!),
        thumbnailUrl: bunnyClient.getThumbnailUrl(uploadResult.videoId!),
        videoId: uploadResult.videoId!,
        libraryId: uploadResult.libraryId,
        fileName: normalizedFileName,
        reused: false
      }
    }

    // Asegurar que el nombre que persistimos sea el mismo que Bunny (title oficial)
    let bunnyTitle: string | null = null
    try {
      const info = await bunnyClient.getVideoInfo(videoMeta.videoId)
      const raw = (info as any)?.title
      const t = typeof raw === 'string' ? raw.trim() : ''
      if (t) bunnyTitle = t.slice(0, 255)
    } catch {
      // ignore
    }

    let previousExerciseVideoId: string | null = null
    let previousMediaVideoId: string | null = null

    if (mediaId) {
      const { data: mediaRow } = await supabase
        .from('activity_media')
        .select('bunny_video_id')
        .eq('id', parseInt(mediaId))
        .maybeSingle()

      previousMediaVideoId = mediaRow?.bunny_video_id || null
    }

    if (exerciseId && activityId) {
      const exerciseIdentifier = parseInt(exerciseId)
      const activityIdentifier = parseInt(activityId)

      const { data: exerciseRow, error: fetchError } = await supabase
        .from('ejercicios_detalles')
        .select('activity_id, bunny_video_id')
        .eq('id', exerciseIdentifier)
        .maybeSingle()

      if (fetchError || !exerciseRow || !hasActivity(exerciseRow.activity_id, activityIdentifier)) {
        console.error('❌ No se pudo validar ejercicio para actualizar video', { exerciseId, activityId, fetchError })
        return NextResponse.json({ error: 'Ejercicio no encontrado para la actividad indicada' }, { status: 404 })
      }

      previousExerciseVideoId = exerciseRow?.bunny_video_id || null

      const effectiveFileName = bunnyTitle || videoMeta.fileName || normalizedFileName || null

      const updatePayload: Record<string, unknown> = {
        video_url: videoMeta.streamUrl,
        bunny_video_id: videoMeta.videoId,
        bunny_library_id: videoMeta.libraryId,
        video_thumbnail_url: videoMeta.thumbnailUrl ?? null
      }

      if (effectiveFileName) {
        updatePayload.video_file_name = effectiveFileName
      }

      const { error: updateError } = await supabase
        .from('ejercicios_detalles')
        .update(updatePayload)
        .eq('id', exerciseIdentifier)

      if (updateError) {
        console.error('❌ Error actualizando ejercicio:', updateError)
      } else if (
        previousExerciseVideoId &&
        previousExerciseVideoId !== videoMeta.videoId
      ) {
        await deleteVideoIfUnused(supabase, previousExerciseVideoId)
      }
    }

    if (mediaId) {
      const effectiveFileName = bunnyTitle || videoMeta.fileName || normalizedFileName || null
      
      const updatePayload: Record<string, unknown> = {
        video_url: videoMeta.streamUrl,
        bunny_video_id: videoMeta.videoId,
        bunny_library_id: videoMeta.libraryId,
        video_thumbnail_url: videoMeta.thumbnailUrl ?? null,
      }

      // Agregar video_file_name si está disponible
      if (effectiveFileName) {
        updatePayload.video_file_name = effectiveFileName
      }

      const { error: updateError } = await supabase
        .from('activity_media')
        .update(updatePayload)
        .eq('id', parseInt(mediaId))

      if (updateError) {
        console.error('❌ Error actualizando activity_media:', updateError)
      } else if (
        previousMediaVideoId &&
        previousMediaVideoId !== videoMeta.videoId
      ) {
        await deleteVideoIfUnused(supabase, previousMediaVideoId)
      }
    }

    if (activityId && !exerciseId && !mediaId) {
      const { data: existing } = await supabase
        .from('activity_media')
        .select('id, bunny_video_id')
        .eq('activity_id', parseInt(activityId))
        .single()

      if (existing) {
        const existingVideoId = existing.bunny_video_id || null
        const effectiveFileName = bunnyTitle || videoMeta.fileName || normalizedFileName || null
        
        const updatePayload: Record<string, unknown> = {
          video_url: videoMeta.streamUrl,
          bunny_video_id: videoMeta.videoId,
          bunny_library_id: videoMeta.libraryId,
          video_thumbnail_url: videoMeta.thumbnailUrl ?? null,
        }

        // Agregar video_file_name si está disponible
        if (effectiveFileName) {
          updatePayload.video_file_name = effectiveFileName
        }

        const { error: updateError } = await supabase
          .from('activity_media')
          .update(updatePayload)
          .eq('id', existing.id)

        if (updateError) {
          console.error('❌ Error actualizando activity_media:', updateError)
        } else if (
          existingVideoId &&
          existingVideoId !== videoMeta.videoId
        ) {
          await deleteVideoIfUnused(supabase, existingVideoId)
        }
      } else {
        const effectiveFileName = bunnyTitle || videoMeta.fileName || normalizedFileName || null
        
        const insertPayload: Record<string, unknown> = {
          activity_id: parseInt(activityId),
          video_url: videoMeta.streamUrl,
          bunny_video_id: videoMeta.videoId,
          bunny_library_id: videoMeta.libraryId,
          video_thumbnail_url: videoMeta.thumbnailUrl ?? null,
        }

        // Agregar video_file_name si está disponible
        if (effectiveFileName) {
          insertPayload.video_file_name = effectiveFileName
        }

        const { error: insertError } = await supabase
          .from('activity_media')
          .insert(insertPayload)

        if (insertError) {
          console.error('❌ Error creando activity_media:', insertError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      videoId: videoMeta.videoId,
      streamUrl: videoMeta.streamUrl,
      thumbnailUrl: videoMeta.thumbnailUrl ?? null,
      libraryId: videoMeta.libraryId,
      reused: videoMeta.reused,
      fileName: bunnyTitle || videoMeta.fileName || normalizedFileName || null,
    })

  } catch (error: any) {
    console.error('❌ Error upload:', error)
    return NextResponse.json({ 
      error: error?.message || 'Error interno',
      success: false 
    }, { status: 500 })
  }

}