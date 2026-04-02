import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const enrollmentId = params.id
    console.log('🚀 [API:save-survey] STARTING save for enrollment:', enrollmentId)
    
    try {
        const body = await request.json()
        const { 
            activityRating, 
            coachRating, 
            feedback, 
            wouldRepeat,
            omniaRating,
            omniaComments 
        } = body

        console.log('📝 [API:save-survey] Request Body Received:', JSON.stringify(body, null, 2))

        const supabase = createRouteHandlerClient({ cookies })
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            console.error('❌ [API:save-survey] Auth Error or No User:', authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('🔍 [API:save-survey] Fetching Enrollment Info...')
        const { data: enrollment, error: enrollmentInfoError } = await supabase
            .from('activity_enrollments')
            .select('activity_id')
            .eq('id', enrollmentId)
            .single()
        
        if (enrollmentInfoError || !enrollment) {
            console.error('❌ [API:save-survey] Enrollment not found:', enrollmentId, enrollmentInfoError)
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
        }

        const activityId = enrollment.activity_id

        console.log('🔍 [API:save-survey] Checking for existing survey...')
        const { data: surveys, error: fetchError } = await supabase
            .from('activity_surveys')
            .select('id')
            .eq('enrollment_id', enrollmentId)
            .limit(1)
        
        if (fetchError) console.warn('⚠️ [API:save-survey] Fetch error:', fetchError)
        const existingSurvey = surveys && surveys.length > 0 ? surveys[0] : null;

        const actRatingVal = Number(activityRating)
        const coachRatingVal = Number(coachRating)
        const omniaRatingVal = Number(omniaRating)
        const sanitize = (val: number, min: number = 0) => (isNaN(val) || val < min) ? null : val;

        const surveyPayload: any = {
            activity_id: activityId,
            client_id: user.id,
            enrollment_id: enrollmentId,
            coach_method_rating: sanitize(coachRatingVal, 0),
            difficulty_rating: sanitize(actRatingVal, 0),
            would_repeat: Boolean(wouldRepeat),
            comments: feedback,
            calificacion_omnia: sanitize(omniaRatingVal, 1),
            comentarios_omnia: omniaComments,
            updated_at: new Date().toISOString()
        }

        console.log('📝 [API:save-survey] Payload Prepared:', JSON.stringify(surveyPayload, null, 2))

        let surveyError = null
        if (existingSurvey) {
            console.log('🔄 [API:save-survey] Updating existing survey record:', existingSurvey.id)
            const { error } = await supabase
                .from('activity_surveys')
                .update(surveyPayload)
                .eq('id', existingSurvey.id)
            surveyError = error
        } else {
            console.log('➕ [API:save-survey] Inserting new survey record...')
            const { error } = await supabase
                .from('activity_surveys')
                .insert({
                    ...surveyPayload,
                    created_at: new Date().toISOString()
                })
            surveyError = error
        }

        if (surveyError) {
            console.error('❌ [API:save-survey] DB Operation Failed:', surveyError)
            return NextResponse.json({ 
                error: 'Database Error', 
                details: surveyError.message, 
                code: surveyError.code 
            }, { status: 500 })
        }

        console.log('✅ [API:save-survey] SUCCESS! Marking enrollment as updated...')
        try {
            await supabase
                .from('activity_enrollments')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', enrollmentId)
        } catch (e) {
            console.warn('⚠️ [API:save-survey] Non-critical enrollment update failed:', e)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('🔥 [API:save-survey] CRITICAL UNEXPECTED ERROR:', error)
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            message: error.message,
            stack: error.stack?.substring(0, 300)
        }, { status: 500 })
    }
}
