import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    console.log('🔍 Verificando enrollments existentes...')

    // Obtener todos los enrollments
    const { data: allEnrollments, error: allError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        client_id,
        activity_id,
        status,
        created_at
      `)
      .limit(20)

    if (allError) {
      console.error('Error obteniendo enrollments:', allError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener enrollments',
        details: allError.message
      }, { status: 500 })
    }

    // Obtener status únicos
    const statusCounts = {}
    allEnrollments?.forEach(enrollment => {
      statusCounts[enrollment.status] = (statusCounts[enrollment.status] || 0) + 1
    })

    // Obtener algunas actividades para verificar coach_id
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title, coach_id')
      .limit(10)

    return NextResponse.json({
      success: true,
      stats: {
        total_enrollments: allEnrollments?.length || 0,
        status_counts: statusCounts,
        sample_enrollments: allEnrollments?.slice(0, 5),
        sample_activities: activities?.slice(0, 5)
      }
    })

  } catch (error) {
    console.error('Error verificando enrollments:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}




























