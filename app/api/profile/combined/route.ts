import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos de user_profiles
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', user.id)
      .single()

    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('Error obteniendo user_profile:', userProfileError)
    }

    // Verificar si es coach o cliente
    const { data: coachData, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (coachError && coachError.code !== 'PGRST116') {
      console.error('Error obteniendo coach data:', coachError)
    }

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('Height, weight, birth_date, Genre, nivel_actividad, phone, location, emergency_contact')
      .eq('id', user.id)
      .maybeSingle()

    if (clientError && clientError.code !== 'PGRST116') {
      console.error('Error obteniendo client data:', clientError)
    }

    // Si es coach, usar datos de coaches; si es cliente, usar datos de clients
    // Usar maybeSingle() para evitar errores cuando no hay registro
    const isCoach = coachData && !coachError
    const profileData = isCoach ? {
      height: coachData?.height || null,
      weight: coachData?.weight || null,
      birth_date: coachData?.birth_date || null,
      gender: coachData?.gender || null,
      level: 'Principiante', // Los coaches no tienen nivel de fitness
      phone: coachData?.phone || null,
      location: coachData?.location || null,
      emergency_contact: coachData?.emergency_contact || null,
      specialization: coachData?.specialization || null,
    } : {
      height: clientData?.Height || null,
      weight: clientData?.weight || null,
      birth_date: clientData?.birth_date || null,
      gender: clientData?.Genre || null,
      level: clientData?.nivel_actividad || 'Principiante',
      phone: clientData?.phone || null,
      location: clientData?.location || null,
      emergency_contact: clientData?.emergency_contact || null,
      specialization: null,
    }

    // Combinar datos
    const combinedProfile = {
      full_name: userProfile?.full_name || user.user_metadata?.full_name || '',
      email: userProfile?.email || user.email || '',
      avatar_url: userProfile?.avatar_url || user.user_metadata?.avatar_url || null,
      ...profileData,
    }

    return NextResponse.json({
      success: true,
      profile: combinedProfile
    })

  } catch (error) {
    console.error('Error en GET /api/profile/combined:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

