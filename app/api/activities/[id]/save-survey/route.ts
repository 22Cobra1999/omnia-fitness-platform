import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: activityId } = await params
    const body = await request.json()
    console.log('📬 [API:save-survey] Request body received:', JSON.stringify(body, null, 2))
    const { 
        activityRating, 
        coachRating, 
        feedback, 
        enrollmentId,
        wouldRepeat,
        omniaRating,
        omniaComments 
    } = body

    const supabase = await createRouteHandlerClient()

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

        const actRatingVal = Number(activityRating)
        const coachRatingVal = Number(coachRating)
        const omniaRatingVal = Number(omniaRating)
        const parsedEnrollmentId = Number(enrollmentId)
        const parsedActivityId = Number(activityId)

        console.log('🔢 [API:save-survey] Parsed Values:', {
            actRatingVal,
            coachRatingVal,
            omniaRatingVal,
            parsedEnrollmentId,
            parsedActivityId,
            userId: user.id
        })

        const surveyPayload: any = {
            activity_id: parsedActivityId,
            client_id: user.id,
            enrollment_id: parsedEnrollmentId,
            coach_method_rating: coachRatingVal >= 0 ? coachRatingVal : null,
            difficulty_rating: actRatingVal >= 0 ? actRatingVal : null,
            would_repeat: wouldRepeat,
            comments: feedback,
            // calificacion_omnia requires >= 1 per DB check constraint. If it's 0 or invalid, we send null.
            calificacion_omnia: omniaRatingVal >= 1 ? omniaRatingVal : null,
            comentarios_omnia: omniaComments,
            updated_at: new Date().toISOString()
        }

        console.log('📝 [API:save-survey] Payload:', JSON.stringify(surveyPayload, null, 2))

        let surveyError = null
        if (existingSurvey) {
            console.log('🔄 [API] Updating existing survey ID:', existingSurvey.id)
            const { error } = await supabase
                .from('activity_surveys')
                .update(surveyPayload)
                .eq('id', existingSurvey.id)
            surveyError = error
        } else {
            console.log('➕ [API] Inserting new survey')
            const { error } = await supabase
                .from('activity_surveys')
                .insert(surveyPayload)
            surveyError = error
        }

        if (surveyError) {
            console.error('❌ [API:save-survey] Error direct saving survey:', {
                message: surveyError.message,
                code: surveyError.code,
                details: surveyError.details,
                hint: surveyError.hint,
                payload: surveyPayload
            })
            // Fallback for older schema if comments_omnia/calificacion_omnia/would_repeat don't exist
            if (surveyError.message?.includes('column') || surveyError.code === '42703' || surveyError.message?.includes('does not exist')) {
                console.log('⚠️ [API:save-survey] Schema mismatch detected. Retrying with basic columns only...')
                const basicPayload = {
                    activity_id: parsedActivityId,
                    client_id: user.id,
                    enrollment_id: parsedEnrollmentId,
                    coach_method_rating: coachRatingVal >= 0 ? coachRatingVal : null,
                    difficulty_rating: actRatingVal >= 0 ? actRatingVal : null,
                    comments: feedback
                }
                console.log('🔄 [API:save-survey] Retry Payload:', JSON.stringify(basicPayload, null, 2))
                const { error: retryError } = existingSurvey 
                    ? await supabase.from('activity_surveys').update(basicPayload).eq('id', existingSurvey.id)
                    : await supabase.from('activity_surveys').insert(basicPayload)
                
                if (retryError) {
                    console.error('❌ [API:save-survey] Error in fallback retry save:', {
                        message: retryError.message,
                        code: retryError.code,
                        details: retryError.details
                    })
                    return NextResponse.json({ error: 'Error saving survey (fallback)', details: retryError.message, code: retryError.code }, { status: 500 })
                }
                console.log('✅ [API:save-survey] Fallback save successful')
            } else {
                return NextResponse.json({ error: 'Error saving survey', details: surveyError.message, code: surveyError.code }, { status: 500 })
            }
        } else {
            console.log('✅ [API:save-survey] Survey saved successfully!')
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
