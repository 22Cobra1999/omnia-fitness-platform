import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET() {
  try {
    const supabase = createClient({ cookies })
    const results: any = {}
    // 1. Verificar tabla activities
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
            title: columns.includes('title'),
            description: columns.includes('description'),
            price: columns.includes('price'),
            type: columns.includes('type'),
            coach_id: columns.includes('coach_id'),
            is_public: columns.includes('is_public'),
            created_at: columns.includes('created_at'),
            updated_at: columns.includes('updated_at')
          }
        }
      }
    } catch (error) {
      results.activities = { error: `Error inesperado: ${error}` }
    }
    // 2. Verificar tabla user_profiles
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
            role: columns.includes('role'),
            first_name: columns.includes('first_name'),
            last_name: columns.includes('last_name'),
            email: columns.includes('email')
          }
        }
      }
    } catch (error) {
      results.user_profiles = { error: `Error inesperado: ${error}` }
    }
    // 3. Verificar si existe tabla para bloques de horario
    try {
      const { data: scheduleBlocksInfo, error: scheduleBlocksError } = await supabase
        .from('schedule_blocks')
        .select('*')
        .limit(1)
      if (scheduleBlocksError) {
        results.schedule_blocks = { 
          exists: false, 
          error: scheduleBlocksError.message,
          suggestion: 'Esta tabla no existe. Necesitamos crearla para almacenar los bloques de horario.'
        }
      } else {
        const columns = scheduleBlocksInfo && scheduleBlocksInfo.length > 0 ? Object.keys(scheduleBlocksInfo[0]) : []
        const { data: sampleBlocks } = await supabase
          .from('schedule_blocks')
          .select('*')
          .limit(2)
        results.schedule_blocks = {
          exists: true,
          columns,
          totalColumns: columns.length,
          sampleData: sampleBlocks || [],
          hasRequiredFields: {
            id: columns.includes('id'),
            activity_id: columns.includes('activity_id'),
            name: columns.includes('name'),
            start_time: columns.includes('start_time'),
            end_time: columns.includes('end_time'),
            start_date: columns.includes('start_date'),
            end_date: columns.includes('end_date'),
            color: columns.includes('color'),
            selected_dates: columns.includes('selected_dates'),
            repeat_type: columns.includes('repeat_type'),
            selected_week_days: columns.includes('selected_week_days'),
            selected_weeks: columns.includes('selected_weeks'),
            selected_months: columns.includes('selected_months')
          }
        }
      }
    } catch (error) {
      results.schedule_blocks = { 
        exists: false, 
        error: `Error inesperado: ${error}`,
        suggestion: 'Esta tabla no existe. Necesitamos crearla para almacenar los bloques de horario.'
      }
    }
    // 4. Verificar si existe tabla para detalles de talleres
    try {
      const { data: workshopDetailsInfo, error: workshopDetailsError } = await supabase
        .from('workshop_details')
        .select('*')
        .limit(1)
      if (workshopDetailsError) {
        results.workshop_details = { 
          exists: false, 
          error: workshopDetailsError.message,
          suggestion: 'Esta tabla no existe. Necesitamos crearla para almacenar detalles específicos de talleres.'
        }
      } else {
        const columns = workshopDetailsInfo && workshopDetailsInfo.length > 0 ? Object.keys(workshopDetailsInfo[0]) : []
        const { data: sampleWorkshopDetails } = await supabase
          .from('workshop_details')
          .select('*')
          .limit(2)
        results.workshop_details = {
          exists: true,
          columns,
          totalColumns: columns.length,
          sampleData: sampleWorkshopDetails || [],
          hasRequiredFields: {
            id: columns.includes('id'),
            activity_id: columns.includes('activity_id'),
            modality: columns.includes('modality'),
            capacity: columns.includes('capacity'),
            video_url: columns.includes('video_url')
          }
        }
      }
    } catch (error) {
      results.workshop_details = { 
        exists: false, 
        error: `Error inesperado: ${error}`,
        suggestion: 'Esta tabla no existe. Necesitamos crearla para almacenar detalles específicos de talleres.'
      }
    }
    // 5. Verificar si existe tabla para detalles de programas
    try {
      const { data: programDetailsInfo, error: programDetailsError } = await supabase
        .from('program_details')
        .select('*')
        .limit(1)
      if (programDetailsError) {
        results.program_details = { 
          exists: false, 
          error: programDetailsError.message,
          suggestion: 'Esta tabla no existe. Necesitamos crearla para almacenar detalles específicos de programas.'
        }
      } else {
        const columns = programDetailsInfo && programDetailsInfo.length > 0 ? Object.keys(programDetailsInfo[0]) : []
        const { data: sampleProgramDetails } = await supabase
          .from('program_details')
          .select('*')
          .limit(2)
        results.program_details = {
          exists: true,
          columns,
          totalColumns: columns.length,
          sampleData: sampleProgramDetails || [],
          hasRequiredFields: {
            id: columns.includes('id'),
            activity_id: columns.includes('activity_id'),
            duration: columns.includes('duration'),
            level: columns.includes('level'),
            materials: columns.includes('materials')
          }
        }
      }
    } catch (error) {
      results.program_details = { 
        exists: false, 
        error: `Error inesperado: ${error}`,
        suggestion: 'Esta tabla no existe. Necesitamos crearla para almacenar detalles específicos de programas.'
      }
    }
    return NextResponse.json({ 
      success: true,
      databaseStructure: results,
      summary: {
        activitiesTableExists: !results.activities.error,
        userProfilesTableExists: !results.user_profiles.error,
        scheduleBlocksTableExists: results.schedule_blocks?.exists || false,
        workshopDetailsTableExists: results.workshop_details?.exists || false,
        programDetailsTableExists: results.program_details?.exists || false
      }
    })
  } catch (error) {
    console.error('Error en GET /api/check-database-structure:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
