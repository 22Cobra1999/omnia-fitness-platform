import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') || '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
    
    console.log('[test-client-details] Probando consulta corregida para cliente:', clientId)

    // 1. PERFIL DEL CLIENTE
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url, created_at')
      .eq('id', clientId)
      .single()

    // 2. LESIONES DEL CLIENTE
    const { data: injuries, error: injuriesError } = await supabase
      .from('user_injuries')
      .select('id, name, description, severity, restrictions, created_at, updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })

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

    // Calcular progreso de objetivos
    const objectivesWithProgress = objectives?.map(obj => ({
      ...obj,
      progress_percentage: obj.objective > 0 ? Math.round((obj.current_value / obj.objective) * 100) : 0
    })) || []

    const result = {
      profile: profile || null,
      injuries: injuries || [],
      biometrics: biometrics || [],
      objectives: objectivesWithProgress,
      stats: {
        injuries_count: injuries?.length || 0,
        biometrics_count: biometrics?.length || 0,
        objectives_count: objectives?.length || 0,
        errors: {
          profile: profileError?.message,
          injuries: injuriesError?.message,
          biometrics: biometricsError?.message,
          objectives: objectivesError?.message
        }
      }
    }

    console.log('[test-client-details] Resultado:', {
      profile: !!profile,
      injuries: injuries?.length || 0,
      biometrics: biometrics?.length || 0,
      objectives: objectives?.length || 0
    })

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('[test-client-details] Error general:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}



























