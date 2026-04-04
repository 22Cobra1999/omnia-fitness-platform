import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { bunnyClient } from '@/lib/bunny'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { title } = await request.json()

    // 1. Create video object in Bunny Stream (POST request)
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
    if (!libraryId) throw new Error('BUNNY_STREAM_LIBRARY_ID not configured')

    const createUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'AccessKey': process.env.BUNNY_STREAM_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title || 'Nuevo Video' }),
    })

    if (!createResponse.ok) {
        throw new Error('Error creating video in Bunny')
    }

    const videoData = await createResponse.json()
    const videoId = videoData.guid

    // 2. Predict URLs
    const streamUrl = bunnyClient.getStreamUrl(videoId)
    const thumbnailUrl = bunnyClient.getThumbnailUrl(videoId)

    return NextResponse.json({
      success: true,
      videoId,
      libraryId: parseInt(libraryId),
      streamUrl,
      thumbnailUrl
    })

  } catch (error: any) {
    console.error('❌ Error create-video:', error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
