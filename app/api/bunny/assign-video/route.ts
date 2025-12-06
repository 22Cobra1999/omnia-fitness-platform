import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { hasActivity } from '@/lib/utils/exercise-activity-map'
import { deleteVideoIfUnused } from '@/lib/bunny/video-cleanup'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      exerciseId,
      activityId,
      videoId,
      streamUrl,
      thumbnailUrl,
      libraryId,
      fileName
    } = body ?? {}

    if (
      exerciseId === undefined ||
      activityId === undefined ||
      !videoId ||
      !streamUrl
    ) {
      return NextResponse.json(
        { error: 'Faltan datos para asignar el video' },
        { status: 400 }
      )
    }

    const exerciseIdentifier = parseInt(String(exerciseId), 10)
    const activityIdentifier = parseInt(String(activityId), 10)

    if (Number.isNaN(exerciseIdentifier) || Number.isNaN(activityIdentifier)) {
      return NextResponse.json(
        { error: 'Identificadores inválidos' },
        { status: 400 }
      )
    }

    const { data: exerciseRow, error: fetchError } = await supabase
      .from('ejercicios_detalles')
      .select('activity_id, bunny_video_id')
      .eq('id', exerciseIdentifier)
      .maybeSingle()

    if (
      fetchError ||
      !exerciseRow ||
      !hasActivity(exerciseRow.activity_id, activityIdentifier)
    ) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado para la actividad indicada' },
        { status: 404 }
      )
    }

    const previousVideoId = exerciseRow?.bunny_video_id || null

    const updatePayload: Record<string, unknown> = {
      video_url: streamUrl,
      bunny_video_id: videoId,
      bunny_library_id: libraryId ?? null,
      video_thumbnail_url: thumbnailUrl ?? null
    }

    if (fileName && typeof fileName === 'string') {
      updatePayload.video_file_name = fileName
    }

    const { error: updateError } = await supabase
      .from('ejercicios_detalles')
      .update(updatePayload)
      .eq('id', exerciseIdentifier)

    if (updateError) {
      console.error('❌ Error actualizando ejercicio con video existente:', {
        exerciseId: exerciseIdentifier,
        updateError
      })
      return NextResponse.json(
        { error: 'No se pudo asignar el video al ejercicio' },
        { status: 500 }
      )
    }

    if (previousVideoId && previousVideoId !== videoId) {
      await deleteVideoIfUnused(supabase, previousVideoId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Error asignando video existente:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno' },
      { status: 500 }
    )
  }
}























