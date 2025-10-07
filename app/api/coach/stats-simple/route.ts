import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    // console.log('🔍 GET /api/coach/stats-simple iniciado')
    
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Usuario autenticado:', user?.email)
    
    // TEMPORAL: Si no hay usuario autenticado, usar usuario mock para desarrollo
    if (authError || !user) {
      console.log('⚠️ No hay usuario autenticado, usando usuario mock para desarrollo')
      
      // Crear usuario mock para desarrollo
      const mockUser = {
        id: 'mock-user-id',
        email: 'f.pomati@usal.edu.ar'
      }
      
      // Simular estadísticas mock
      const mockStats = {
        totalProducts: 5,
        totalRevenue: 2500,
        avgRating: 4.8,
        totalReviews: 12,
        totalEnrollments: 8,
        totalSales: 6
      }
      
      // console.log('✅ Retornando estadísticas mock:', mockStats)
      
      return NextResponse.json({ 
        success: true, 
        stats: mockStats,
        mock: true
      })
    }

    // Verificar que el usuario existe en user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Error obteniendo perfil de usuario:', profileError)
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    // Verificar que es un coach
    if (userProfile.role !== 'coach') {
      return NextResponse.json({ error: 'Solo los coaches pueden acceder a estadísticas' }, { status: 403 })
    }

    // Obtener estadísticas reales del coach
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, price, coach_id')
      .eq('coach_id', user.id)

    if (activitiesError) {
      console.error('Error obteniendo actividades:', activitiesError)
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
    }

    // Obtener enrollments del coach
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('id, activity_id, status')
      .in('activity_id', activities?.map(a => a.id) || [])

    if (enrollmentsError) {
      console.error('Error obteniendo enrollments:', enrollmentsError)
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
    }

    // Obtener ratings del coach desde coach_stats_view
    let avgRating = 0
    let totalReviews = 0
    
    const { data: coachStats, error: coachStatsError } = await supabase
      .from("coach_stats_view")
      .select("avg_rating, total_reviews")
      .eq("coach_id", user.id)
      .single()
    
    if (!coachStatsError && coachStats) {
      avgRating = coachStats.avg_rating || 0
      totalReviews = coachStats.total_reviews || 0
    }

    // Calcular estadísticas
    const totalProducts = activities?.length || 0
    const totalRevenue = enrollments?.reduce((sum, enrollment) => {
      const activity = activities?.find(a => a.id === enrollment.activity_id)
      return sum + (activity?.price || 0)
    }, 0) || 0

    const totalEnrollments = enrollments?.length || 0
    const totalSales = enrollments?.filter(e => e.status === 'active').length || 0

    const stats = {
      totalProducts,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews,
      totalEnrollments,
      totalSales
    }

    // console.log('✅ Estadísticas reales calculadas:', stats)

    return NextResponse.json({ 
      success: true, 
      stats
    })

  } catch (error) {
    console.error('Error en GET /api/coach/stats-simple:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
