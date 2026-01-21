import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const activityId = searchParams.get('activity_id')

        if (!activityId) {
            return NextResponse.json({ error: 'activity_id is required' }, { status: 400 })
        }

        const supabase = await createRouteHandlerClient()

        // Fetch topics from the new table
        const { data: topics, error } = await supabase
            .from('document_topics')
            .select('*')
            .eq('activity_id', activityId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('❌ [document-topics] Error fetching topics:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log(`✅ [document-topics] Fetched ${topics?.length || 0} topics for activity ${activityId}`)

        return NextResponse.json({
            success: true,
            data: topics || []
        })

    } catch (error: any) {
        console.error('❌ [document-topics] Internal error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
