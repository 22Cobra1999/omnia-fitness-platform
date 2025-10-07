import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    // console.log('🔍 GET /api/coach/stats iniciado')
    
    const cookieStore = await cookies()
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Usuario autenticado:', user?.email)
    
    if (authError || !user) {
      console.log('Error: No autorizado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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

    // 1. Obtener total de productos del coach
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title, price')
      .eq('coach_id', user.id)

    if (activitiesError) {
      console.error('Error obteniendo actividades:', activitiesError)
      return NextResponse.json({ error: 'Error obteniendo actividades' }, { status: 500 })
    }

    const totalProducts = activities?.length || 0

    // 2. Calcular ingresos reales desde activity_enrollments
    let totalRevenue = 0
    let totalEnrollments = 0

    if (activities && activities.length > 0) {
      const activityIds = activities.map(a => a.id)
      
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('activity_enrollments')
        .select('id, activity_id')
        .in('activity_id', activityIds)
        .eq('status', 'active')

      if (enrollmentsError) {
        console.error('Error obteniendo enrollments:', enrollmentsError)
        // Continuar sin enrollments si hay error
      } else {
        totalEnrollments = enrollments?.length || 0
        
        // Calcular ingresos totales
        totalRevenue = enrollments?.reduce((sum, enrollment) => {
          const activity = activities.find(a => a.id === enrollment.activity_id)
          return sum + (activity?.price || 0)
        }, 0) || 0
      }
    }

    // 3. Calcular rating promedio del coach (simplificado por ahora)
    let avgRating = 0
    let totalReviews = 0

    // Por ahora, usar valores por defecto hasta que se configuren los ratings
    // TODO: Implementar cálculo real de ratings cuando estén disponibles

    // 4. Estadísticas adicionales
    const totalSales = totalEnrollments // Cada enrollment es una venta

    const stats = {
      totalProducts,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10, // Redondear a 1 decimal
      totalReviews,
      totalEnrollments,
      totalSales
    }

    // console.log('✅ Estadísticas calculadas:', stats)

    return NextResponse.json({ 
      success: true, 
      stats 
    })

  } catch (error) {
    console.error('Error en GET /api/coach/stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
