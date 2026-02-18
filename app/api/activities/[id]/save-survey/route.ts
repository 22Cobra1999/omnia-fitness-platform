import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const activityId = params.id
    const body = await request.json()
    const { activityRating, coachRating, feedback, enrollmentId } = body

    const supabase = createRouteHandlerClient({ cookies })

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Save to activity_surveys
        const { error: surveyError } = await supabase
            .from('activity_surveys')
            .upsert({
                activity_id: activityId,
                client_id: user.id,
                enrollment_id: enrollmentId,
                coach_method_rating: coachRating,
                comments: feedback,
                // For standard activities, we might not have a workshop_version, 
                // but let's keep it consistent if needed.
            }, {
                onConflict: 'activity_id, client_id, enrollment_id'
            })

        if (surveyError) {
            console.error('Error saving survey:', surveyError)
            return NextResponse.json({ error: 'Error saving survey' }, { status: 500 })
        }

        // 2. Update activity_enrollments to mark as rated
        const { error: enrollmentError } = await supabase
            .from('activity_enrollments')
            .update({ is_rated: true, rated: true })
            .eq('id', enrollmentId)
            .eq('client_id', user.id)

        if (enrollmentError) {
            console.error('Error updating enrollment:', enrollmentError)
            // We don't necessarily fail the whole request if this fails, but it's good to know
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
