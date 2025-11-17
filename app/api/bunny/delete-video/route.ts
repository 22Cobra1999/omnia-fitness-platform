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

    const { data: usageRows, error: usageError } = await supabase
      .from('ejercicios_detalles')
      .select('id')
      .eq('bunny_video_id', videoId)

    if (usageError) {
      console.error('❌ Error verificando uso de video:', usageError)
      return NextResponse.json({ success: false, error: 'No se pudo verificar uso del video' }, { status: 500 })
    }

    const usages = usageRows || []
    const stillReferenced = usages.filter((row) => {
      if (!exerciseId) return true
      return row.id !== exerciseId
    })

    if (stillReferenced.length > 0) {
      return NextResponse.json({ success: false, skipped: true, reason: 'Video utilizado por otros ejercicios' })
    }

    const deleted = await bunnyClient.deleteVideo(videoId)

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'No se pudo eliminar el video en Bunny.net' }, { status: 500 })
    }

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
    }

    return NextResponse.json({ success: true, deleted: true })
  } catch (error: any) {
    console.error('❌ Error eliminando video de Bunny:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Error interno' }, { status: 500 })
  }
}
