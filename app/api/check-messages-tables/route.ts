import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    console.log('🔍 Verificando estado de las tablas de mensajes...')

    // Verificar si la tabla conversations existe
    const { data: conversationsCheck, error: conversationsError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)

    // Verificar si la tabla messages existe
    const { data: messagesCheck, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .limit(1)

    // Verificar enrollments
    const { data: enrollmentsCheck, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('id, client_id, activity_id')
      .limit(5)

    return NextResponse.json({
      success: true,
      tables: {
        conversations: {
          exists: !conversationsError || conversationsError.code !== 'PGRST116',
          error: conversationsError?.message || null
        },
        messages: {
          exists: !messagesError || messagesError.code !== 'PGRST116',
          error: messagesError?.message || null
        },
        activity_enrollments: {
          exists: !enrollmentsError || enrollmentsError.code !== 'PGRST116',
          error: enrollmentsError?.message || null,
          sample_count: enrollmentsCheck?.length || 0
        }
      },
      status: {
        conversations_table_ready: !conversationsError || conversationsError.code !== 'PGRST116',
        messages_table_ready: !messagesError || messagesError.code !== 'PGRST116',
        enrollments_available: !enrollmentsError || enrollmentsError.code !== 'PGRST116'
      }
    })

  } catch (error) {
    console.error('Error verificando tablas:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}




























