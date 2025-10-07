import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Si no hay usuario autenticado, devolver perfil vacío en lugar de error 401
    if (authError || !user) {
      console.log('No hay usuario autenticado, devolviendo perfil vacío')
      return NextResponse.json({ 
        success: true, 
        profile: null 
      })
    }
    // Obtener perfil de user_profiles
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    // Obtener perfil de clients
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', user.id)
      .single()
    // Combinar perfiles
    let combinedProfile = null
    if (userProfile || clientProfile) {
      combinedProfile = {
        // Datos de user_profiles
        id: userProfile?.id || clientProfile?.id,
        full_name: userProfile?.full_name || clientProfile?.full_name,
        email: userProfile?.email,
        avatar_url: userProfile?.avatar_url,
        role: userProfile?.role,
        coach_rating: userProfile?.coach_rating,
        total_coach_reviews: userProfile?.total_coach_reviews,
        // Datos de clients (mapeados a nombres del frontend)
        height: clientProfile?.Height,
        weight: clientProfile?.weight,
        gender: clientProfile?.Genre,
        level: clientProfile?.nivel_actividad, // Nueva columna en español
        birth_date: clientProfile?.birth_date,
        phone: clientProfile?.phone, // Nueva columna
        location: clientProfile?.location, // Nueva columna
        emergency_contact: clientProfile?.emergency_contact, // Nueva columna
        fitness_goals: clientProfile?.fitness_goals,
        health_conditions: clientProfile?.health_conditions,
        description: clientProfile?.description,
        // Metadatos
        created_at: userProfile?.created_at || clientProfile?.created_at,
        updated_at: userProfile?.updated_at || clientProfile?.updated_at
      }
    }
    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', userProfileError)
    }
    if (clientError && clientError.code !== 'PGRST116') {
      console.error('Error fetching client profile:', clientError)
    }
    return NextResponse.json({
      success: true,
      profile: combinedProfile
    })
  } catch (error) {
    console.error('Error in combined profile get:', error)
    return NextResponse.json({ success: true, profile: null })
  }
}
