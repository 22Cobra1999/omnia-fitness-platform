import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const activityId = params.id
    const supabase = createRouteHandlerClient({ cookies })

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Check if snapshot already exists
        const { data: existing } = await supabase
            .from('actividades_vencidas')
            .select('id')
            .eq('activity_id', activityId)
            .eq('client_id', user.id)
            .single()

        if (existing) {
            return NextResponse.json({ success: true, message: 'Snapshot already exists', id: existing.id })
        }

        // 2. Fetch enrollment info to ensure it exists
        const { data: enrollment, error: enrError } = await supabase
            .from('activity_enrollments')
            .select('id')
            .eq('activity_id', activityId)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (enrError || !enrollment) {
            console.error('Error fetching enrollment for snapshot:', enrError)
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
        }

        // 3. Call the archive RPC
        // This calculates analytics, upserts into actividades_vencidas, AND cleans up raw tables.
        const { data: archiveResult, error: rpcError } = await supabase
            .rpc('archive_expired_enrollment', { p_enrollment_id: enrollment.id })

        if (rpcError) {
            console.error('Error calling archive_expired_enrollment RPC:', rpcError)
            return NextResponse.json({ error: 'Error during archival process' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: archiveResult })
    } catch (error) {
        console.error('Unexpected error in snapshot API:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
