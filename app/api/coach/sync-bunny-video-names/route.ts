import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient } from '@/lib/bunny'

type TableName = 'ejercicios_detalles' | 'platos_detalles' | 'activity_media'

type VideoRefRow = {
  table: TableName
  id: number
  bunny_video_id: string
  video_file_name: string | null
}

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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    let body: any = null
    try {
      body = await request.json()
    } catch {
      body = null
    }

    const dryRun = body?.dryRun === true
    const onlyMissing = body?.onlyMissing !== false // default true
    const limit = Number.isFinite(Number(body?.limit)) ? Number(body.limit) : null

    console.log('[sync-bunny-video-names] start', {
      coachId: user.id,
      dryRun,
      onlyMissing,
      limit
    })

    const refs: VideoRefRow[] = []

    // ejercicios_detalles
    {
      const q = supabase
        .from('ejercicios_detalles')
        .select('id, bunny_video_id, video_file_name')
        .eq('coach_id', user.id)
        .not('bunny_video_id', 'is', null)
        .neq('bunny_video_id', '')

      const { data, error } = await (limit ? q.limit(limit) : q)
      if (error) {
        console.error('[sync-bunny-video-names] error fetching ejercicios_detalles', error)
        return NextResponse.json({ success: false, error: 'Error leyendo ejercicios_detalles' }, { status: 500 })
      }
      ;(data || []).forEach((row: any) => {
        refs.push({
          table: 'ejercicios_detalles',
          id: Number(row.id),
          bunny_video_id: String(row.bunny_video_id),
          video_file_name: row.video_file_name ?? null
        })
      })
    }

    // platos_detalles
    {
      const q = supabase
        .from('platos_detalles')
        .select('id, bunny_video_id, video_file_name')
        .eq('coach_id', user.id)
        .not('bunny_video_id', 'is', null)
        .neq('bunny_video_id', '')

      const { data, error } = await (limit ? q.limit(limit) : q)
      if (error) {
        console.error('[sync-bunny-video-names] error fetching platos_detalles', error)
        // no hard fail: puede no existir la tabla en algunos entornos
      } else {
        ;(data || []).forEach((row: any) => {
          refs.push({
            table: 'platos_detalles',
            id: Number(row.id),
            bunny_video_id: String(row.bunny_video_id),
            video_file_name: row.video_file_name ?? null
          })
        })
      }
    }

    // activity_media (solo actividades del coach)
    {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', user.id)

      if (activitiesError) {
        console.error('[sync-bunny-video-names] error fetching activities', activitiesError)
        return NextResponse.json({ success: false, error: 'Error leyendo activities' }, { status: 500 })
      }

      const activityIds = (activities || []).map((a: any) => a.id)
      if (activityIds.length > 0) {
        const q = supabase
          .from('activity_media')
          .select('id, bunny_video_id, video_file_name')
          .in('activity_id', activityIds)
          .not('bunny_video_id', 'is', null)
          .neq('bunny_video_id', '')

        const { data, error } = await (limit ? q.limit(limit) : q)
        if (error) {
          console.error('[sync-bunny-video-names] error fetching activity_media', error)
          // no hard fail
        } else {
          ;(data || []).forEach((row: any) => {
            refs.push({
              table: 'activity_media',
              id: Number(row.id),
              bunny_video_id: String(row.bunny_video_id),
              video_file_name: row.video_file_name ?? null
            })
          })
        }
      }
    }

    const uniqueVideoIds = Array.from(new Set(refs.map((r) => r.bunny_video_id)))

    console.log('[sync-bunny-video-names] collected refs', {
      refsCount: refs.length,
      uniqueVideoIds: uniqueVideoIds.length,
      sampleRefs: refs.slice(0, 10)
    })

    const titleById = new Map<string, string>()
    const bunnyErrors: Array<{ bunny_video_id: string; error: string }> = []

    // Fetch Bunny titles sequentially to be gentle on rate limits.
    for (const videoId of uniqueVideoIds) {
      try {
        const info = await bunnyClient.getVideoInfo(videoId)
        const title = (info as any)?.title
        if (typeof title === 'string' && title.trim() !== '') {
          titleById.set(videoId, title.trim().slice(0, 255))
        } else {
          bunnyErrors.push({ bunny_video_id: videoId, error: 'Sin title en Bunny' })
        }
      } catch (e: any) {
        bunnyErrors.push({ bunny_video_id: videoId, error: e?.message || String(e) })
      }
    }

    const updatesPlanned: Array<{
      table: TableName
      id: number
      bunny_video_id: string
      from: string | null
      to: string
      reason: 'missing' | 'different'
    }> = []

    for (const ref of refs) {
      const bunnyTitle = titleById.get(ref.bunny_video_id)
      if (!bunnyTitle) continue

      const current = (ref.video_file_name || '').trim()
      const shouldUpdateMissing = current === ''
      const shouldUpdateDifferent = current !== '' && current !== bunnyTitle

      if (onlyMissing) {
        if (shouldUpdateMissing) {
          updatesPlanned.push({
            table: ref.table,
            id: ref.id,
            bunny_video_id: ref.bunny_video_id,
            from: ref.video_file_name,
            to: bunnyTitle,
            reason: 'missing'
          })
        }
      } else {
        if (shouldUpdateMissing || shouldUpdateDifferent) {
          updatesPlanned.push({
            table: ref.table,
            id: ref.id,
            bunny_video_id: ref.bunny_video_id,
            from: ref.video_file_name,
            to: bunnyTitle,
            reason: shouldUpdateMissing ? 'missing' : 'different'
          })
        }
      }
    }

    // Execute updates
    const applied: Array<{
      table: TableName
      id: number
      bunny_video_id: string
      to: string
    }> = []
    const updateErrors: Array<{
      table: TableName
      id: number
      bunny_video_id: string
      error: string
    }> = []

    if (!dryRun) {
      for (const upd of updatesPlanned) {
        try {
          const { error } = await supabase
            .from(upd.table)
            .update({ video_file_name: upd.to })
            .eq('id', upd.id)

          if (error) {
            updateErrors.push({
              table: upd.table,
              id: upd.id,
              bunny_video_id: upd.bunny_video_id,
              error: error.message
            })
          } else {
            applied.push({
              table: upd.table,
              id: upd.id,
              bunny_video_id: upd.bunny_video_id,
              to: upd.to
            })
          }
        } catch (e: any) {
          updateErrors.push({
            table: upd.table,
            id: upd.id,
            bunny_video_id: upd.bunny_video_id,
            error: e?.message || String(e)
          })
        }
      }
    }

    console.log('[sync-bunny-video-names] done', {
      dryRun,
      refsCount: refs.length,
      uniqueVideoIds: uniqueVideoIds.length,
      bunnyTitles: titleById.size,
      planned: updatesPlanned.length,
      applied: applied.length,
      bunnyErrors: bunnyErrors.length,
      updateErrors: updateErrors.length
    })

    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        refsCount: refs.length,
        uniqueVideoIds: uniqueVideoIds.length,
        bunnyTitles: titleById.size,
        planned: updatesPlanned.length,
        applied: applied.length,
        bunnyErrors: bunnyErrors.length,
        updateErrors: updateErrors.length
      },
      sample: {
        planned: updatesPlanned.slice(0, 25),
        applied: applied.slice(0, 25),
        bunnyErrors: bunnyErrors.slice(0, 25),
        updateErrors: updateErrors.slice(0, 25)
      }
    })
  } catch (error: any) {
    console.error('❌ [sync-bunny-video-names] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno'
      },
      { status: 500 }
    )
  }
}
