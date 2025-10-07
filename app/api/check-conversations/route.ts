import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Usar service role para verificar conversaciones
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('🔍 Verificando conversaciones existentes...')

    // Obtener todas las conversaciones
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        client_id,
        coach_id,
        is_active,
        created_at,
        updated_at,
        client_unread_count,
        coach_unread_count
      `)
      .order('created_at', { ascending: false })

    if (conversationsError) {
      console.error('Error obteniendo conversaciones:', conversationsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener conversaciones',
        details: conversationsError.message
      }, { status: 500 })
    }

    // Obtener estadísticas
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('id, client_id, activity_id, status')
      .in('status', ['active', 'enrolled', 'pending', 'completed', 'activa'])

    console.log(`📊 ${conversations?.length || 0} conversaciones encontradas`)

    return NextResponse.json({
      success: true,
      stats: {
        total_conversations: conversations?.length || 0,
        active_conversations: conversations?.filter(c => c.is_active).length || 0,
        total_enrollments: enrollments?.length || 0,
        unique_clients: new Set(conversations?.map(c => c.client_id)).size,
        unique_coaches: new Set(conversations?.map(c => c.coach_id)).size
      },
      conversations: conversations?.slice(0, 10), // Mostrar solo las primeras 10
      sample_enrollments: enrollments?.slice(0, 5) // Mostrar solo las primeras 5
    })

  } catch (error) {
    console.error('Error verificando conversaciones:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}



























