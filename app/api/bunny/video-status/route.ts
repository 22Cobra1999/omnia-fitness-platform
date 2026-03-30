import { NextRequest, NextResponse } from 'next/server'
import { bunnyClient } from '@/lib/bunny'

// Bunny Stream video status codes:
// 0 = Queued, 1 = Processing, 2 = Encoding, 3 = Finished, 4 = Resolution Finished, 5 = Failed

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  }

  try {
    const info = await bunnyClient.getVideoInfo(videoId)

    if (!info) {
      return NextResponse.json({ 
        isReady: false, 
        status: 'not_found',
        progress: 0
      })
    }

    const status = (info as any).status ?? -1
    // status 3 = Finished (fully encoded and ready)
    const isReady = status === 3 || status === 4
    const progress = (info as any).encodeProgress ?? (isReady ? 100 : 0)

    return NextResponse.json({
      isReady,
      status,
      progress,
      title: (info as any).title ?? null,
      duration: (info as any).length ?? null,
    })
  } catch (error: any) {
    console.error('❌ [video-status] Error:', error?.message)
    return NextResponse.json({ 
      isReady: false, 
      status: 'error',
      progress: 0,
      error: error?.message 
    }, { status: 500 })
  }
}
