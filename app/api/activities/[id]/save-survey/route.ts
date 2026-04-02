import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const activityId = params.id
    const body = await request.json()
    const { 
        activityRating, 
        coachRating, 
        feedback, 
        enrollmentId,
        wouldRepeat,
        omniaRating,
        omniaComments 
    } = body

    const supabase = createRouteHandlerClient({ cookies })

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Check if survey already exists for this enrollment
        let { data: existingSurvey } = await supabase
            .from('activity_surveys')
            .select('id')
            .eq('enrollment_id', enrollmentId)
            .eq('client_id', user.id)
            .maybeSingle()

        // [PATCH] If not found by enrollment_id, check by activity_id (legacy index conflict prevention)
        if (!existingSurvey) {
            console.log('🔍 [API] Survey not found by enrollment_id. Checking by activity_id fallback...')
            const { data: legacySurvey } = await supabase
                .from('activity_surveys')
                .select('id')
                .eq('activity_id', activityId)
                .eq('client_id', user.id)
                .is('workshop_version', null)
                .maybeSingle()
            
            if (legacySurvey) {
                console.log('⚠️ [API] Found legacy survey for same activity. Updating to avoid index collision.');
                existingSurvey = legacySurvey;
            }
        }

        const surveyPayload: any = {
            activity_id: activityId,
            client_id: user.id,
            enrollment_id: enrollmentId,
            coach_method_rating: coachRating,
            difficulty_rating: activityRating,
            would_repeat: wouldRepeat,
            comments: feedback,
            calificacion_omnia: omniaRating,
            comentarios_omnia: omniaComments,
            updated_at: new Date().toISOString()
        }

        let surveyError = null
        if (existingSurvey) {
            console.log('🔄 [API] Updating existing survey ID:', existingSurvey.id)
            const { error } = await supabase
                .from('activity_surveys')
                .update(surveyPayload)
                .eq('id', existingSurvey.id)
            surveyError = error
        } else {
            console.log('➕ [API] Inserting new survey for enrollment:', enrollmentId)
            const { error } = await supabase
                .from('activity_surveys')
                .insert(surveyPayload)
            surveyError = error
        }

        if (surveyError) {
            console.error('Error saving survey (safe method):', surveyError)
            // Fallback for older schema if comments_omnia/calificacion_omnia/would_repeat don't exist
            if (surveyError.message?.includes('column') || surveyError.code === '42703') {
                console.log('⚠️ [API] Legacy schema detected. Retrying with basic columns...')
                const basicPayload = {
                    activity_id: activityId,
                    client_id: user.id,
                    enrollment_id: enrollmentId,
                    coach_method_rating: coachRating,
                    comments: feedback
                }
                const { error: retryError } = existingSurvey 
                    ? await supabase.from('activity_surveys').update(basicPayload).eq('id', existingSurvey.id)
                    : await supabase.from('activity_surveys').insert(basicPayload)
                
                if (retryError) {
                    console.error('Error in legacy fallback survey save:', retryError)
                    return NextResponse.json({ error: 'Error saving survey' }, { status: 500 })
                }
            } else {
                return NextResponse.json({ error: 'Error saving survey' }, { status: 500 })
            }
        }

        // 2. marking as rated is implicit by the survey presence
        // We can still touch the enrollment if needed, but let's avoid non-existent columns
        const { error: enrollmentError } = await supabase
            .from('activity_enrollments')
            .update({ updated_at: new Date().toISOString() })
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
