import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET() {
  try {
    const supabase = createClient({ cookies })
    const results: any = {}
    // 1. Verificar tabla activities actualizada
    try {
      const { data: activitiesInfo, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .limit(1)
      if (activitiesError) {
        results.activities = { error: activitiesError.message }
      } else {
        const columns = activitiesInfo && activitiesInfo.length > 0 ? Object.keys(activitiesInfo[0]) : []
        const { data: sampleActivities } = await supabase
          .from('activities')
          .select('*')
          .limit(2)
        results.activities = {
          columns,
          totalColumns: columns.length,
          sampleData: sampleActivities || [],
          hasRequiredFields: {
            id: columns.includes('id'),
            coach_id: columns.includes('coach_id'),
            title: columns.includes('title'),
            description: columns.includes('description'),
            type: columns.includes('type'),
            difficulty: columns.includes('difficulty'),
            price: columns.includes('price'),
            video_url: columns.includes('video_url'),
            capacity: columns.includes('capacity'),
            modality: columns.includes('modality'),
            is_public: columns.includes('is_public'),
            created_at: columns.includes('created_at'),
            updated_at: columns.includes('updated_at')
          }
        }
      }
    } catch (error) {
      results.activities = { error: `Error inesperado: ${error}` }
    }
    // 2. Verificar tabla activity_availability actualizada
    try {
      const { data: availabilityInfo, error: availabilityError } = await supabase
        .from('activity_availability')
        .select('*')
        .limit(1)
      if (availabilityError) {
        results.activity_availability = { error: availabilityError.message }
      } else {
        const columns = availabilityInfo && availabilityInfo.length > 0 ? Object.keys(availabilityInfo[0]) : []
        const { data: sampleAvailability } = await supabase
          .from('activity_availability')
          .select('*')
          .limit(2)
        results.activity_availability = {
          columns,
          totalColumns: columns.length,
          sampleData: sampleAvailability || [],
          hasRequiredFields: {
            id: columns.includes('id'),
            activity_id: columns.includes('activity_id'),
            availability_type: columns.includes('availability_type'),
            session_type: columns.includes('session_type'),
            start_time: columns.includes('start_time'),
            end_time: columns.includes('end_time'),
            start_date: columns.includes('start_date'),
            end_date: columns.includes('end_date'),
            color: columns.includes('color'),
            selected_dates: columns.includes('selected_dates'),
            repeat_type: columns.includes('repeat_type'),
            selected_week_days: columns.includes('selected_week_days'),
            selected_weeks: columns.includes('selected_weeks'),
            selected_months: columns.includes('selected_months'),
            available_slots: columns.includes('available_slots')
          }
        }
      }
    } catch (error) {
      results.activity_availability = { error: `Error inesperado: ${error}` }
    }
    // 3. Verificar tabla activity_media
    try {
      const { data: mediaInfo, error: mediaError } = await supabase
        .from('activity_media')
        .select('*')
        .limit(1)
      if (mediaError) {
        results.activity_media = { error: mediaError.message }
      } else {
        const columns = mediaInfo && mediaInfo.length > 0 ? Object.keys(mediaInfo[0]) : []
        const { data: sampleMedia } = await supabase
          .from('activity_media')
          .select('*')
          .limit(2)
        results.activity_media = {
          columns,
          totalColumns: columns.length,
          sampleData: sampleMedia || [],
          hasRequiredFields: {
            id: columns.includes('id'),
            activity_id: columns.includes('activity_id'),
            image_url: columns.includes('image_url'),
            video_url: columns.includes('video_url'),
            vimeo_id: columns.includes('vimeo_id')
          }
        }
      }
    } catch (error) {
      results.activity_media = { error: `Error inesperado: ${error}` }
    }
    // 4. Verificar tabla user_profiles
    try {
      const { data: profilesInfo, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
      if (profilesError) {
        results.user_profiles = { error: profilesError.message }
      } else {
        const columns = profilesInfo && profilesInfo.length > 0 ? Object.keys(profilesInfo[0]) : []
        const { data: sampleProfiles } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(2)
        results.user_profiles = {
          columns,
          totalColumns: columns.length,
          sampleData: sampleProfiles || [],
          hasRequiredFields: {
            id: columns.includes('id'),
            full_name: columns.includes('full_name'),
            role: columns.includes('role'),
            email: columns.includes('email'),
            avatar_url: columns.includes('avatar_url'),
            bio: columns.includes('bio')
          }
        }
      }
    } catch (error) {
      results.user_profiles = { error: `Error inesperado: ${error}` }
    }
    return NextResponse.json({ 
      success: true,
      updatedStructure: results,
      summary: {
        activitiesTableReady: !results.activities.error && results.activities.hasRequiredFields?.title,
        availabilityTableReady: !results.activity_availability.error && results.activity_availability.hasRequiredFields?.activity_id,
        mediaTableReady: !results.activity_media.error && results.activity_media.hasRequiredFields?.activity_id,
        profilesTableReady: !results.user_profiles.error && results.user_profiles.hasRequiredFields?.role
      }
    })
  } catch (error) {
    console.error('Error en GET /api/check-updated-structure:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
