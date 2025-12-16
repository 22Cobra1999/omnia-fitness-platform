import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hacer la ruta dinámica para evitar evaluación durante el build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Crear cliente dentro de la función para evitar evaluación durante build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: clientId } = await params
    

    // 1. PERFIL DEL CLIENTE
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url, created_at')
      .eq('id', clientId)
      .single()

    // 1.1. DATOS FÍSICOS DEL CLIENTE
    const { data: clientData, error: clientDataError } = await supabase
      .from('clients')
      .select('id, Height, weight, birth_date, fitness_goals, health_conditions, Genre, description, full_name, nivel_actividad, phone, location, emergency_contact')
      .eq('id', clientId)
      .single()

    // 2. LESIONES DEL CLIENTE
    const { data: injuries, error: injuriesError } = await supabase
      .from('user_injuries')
      .select('id, name, description, severity, restrictions, created_at, updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })

    if (injuriesError) {
      console.error('[client-details] Error obteniendo lesiones:', injuriesError)
    }
    if (injuries && injuries.length > 0) {
    }

    // 3. BIOMÉTRICAS DEL CLIENTE
    const { data: biometrics, error: biometricsError } = await supabase
      .from('user_biometrics')
      .select('id, name, value, unit, notes, created_at, updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })

    // 4. OBJETIVOS DE EJERCICIO DEL CLIENTE
    const { data: objectives, error: objectivesError } = await supabase
      .from('user_exercise_objectives')
      .select('id, exercise_title, unit, current_value, objective, created_at, updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })

    // 5. ACTIVIDADES DEL CLIENTE
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        status,
        todo_list,
        activity_id
      `)
      .eq('client_id', clientId)
      .eq('status', 'activa')

    // Calcular progreso de objetivos
    const objectivesWithProgress = objectives?.map(obj => ({
      ...obj,
      progress_percentage: obj.objective > 0 ? Math.round((obj.current_value / obj.objective) * 100) : 0
    })) || []

    // Obtener detalles de las actividades
    let activitiesDetails = []
    if (enrollments && enrollments.length > 0) {
      const activityIds = enrollments.map(e => e.activity_id)
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title, type, amount_paid')
        .in('id', activityIds)
      
      if (activities) {
        activitiesDetails = enrollments.map(enrollment => {
          const activity = activities.find(a => a.id === enrollment.activity_id)
          return {
            id: activity?.id || enrollment.activity_id,
            title: activity?.title || 'Actividad',
            type: activity?.type || 'general',
            amountPaid: activity?.amount_paid || 0
          }
        })
      }
    }

    // Calcular métricas del cliente
    const totalRevenue = activitiesDetails?.reduce((sum, activity) => 
      sum + (activity.amountPaid || 0), 0) || 0
    
    const todoCount = enrollments?.reduce((sum, enrollment) => 
      sum + (enrollment.todo_list?.length || 0), 0) || 0

    // Calcular edad a partir de birth_date
    const calculateAge = (birthDate: string) => {
      if (!birthDate) return null
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    }

    // Calcular IMC
    const calculateBMI = (weight: number, height: number) => {
      if (!weight || !height) return null
      const heightInMeters = height / 100 // Convertir cm a metros
      return (weight / (heightInMeters * heightInMeters)).toFixed(1)
    }

    const client = {
      id: profile?.id || clientId,
      name: profile?.full_name || clientData?.full_name || 'Cliente',
      email: profile?.email || '',
      avatar_url: profile?.avatar_url,
      progress: 53,
      activitiesCount: enrollments?.length || 0,
      todoCount,
      totalRevenue,
      activities: activitiesDetails,
      injuries: injuries || [],
      biometrics: biometrics || [],
      objectives: objectivesWithProgress,
      // Datos físicos del cliente
      physicalData: {
        height: clientData?.Height || null,
        weight: clientData?.weight || null,
        age: calculateAge(clientData?.birth_date),
        bmi: clientData?.Height && clientData?.weight ? calculateBMI(clientData.weight, clientData.Height) : null,
        gender: clientData?.Genre || null,
        fitnessGoals: clientData?.fitness_goals || [],
        healthConditions: clientData?.health_conditions || [],
        activityLevel: clientData?.nivel_actividad || null,
        phone: clientData?.phone || null,
        location: clientData?.location || null,
        emergencyContact: clientData?.emergency_contact || null,
        description: clientData?.description || null
      }
    }

    return NextResponse.json({ 
      success: true, 
      client,
      stats: {
        injuries_count: injuries?.length || 0,
        biometrics_count: biometrics?.length || 0,
        objectives_count: objectives?.length || 0,
        activities_count: enrollments?.length || 0,
        errors: {
          profile: profileError?.message,
          clientData: clientDataError?.message,
          injuries: injuriesError?.message,
          biometrics: biometricsError?.message,
          objectives: objectivesError?.message,
          enrollments: enrollmentsError?.message
        }
      }
    })

  } catch (error) {
    console.error('[client-details] Error general:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
