import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // TEMPORAL: Si no hay usuario autenticado, usar fallback para desarrollo
    if (authError || !user) {
      
      // Datos mock basados en la conversación real que existe en la BD
      const mockConversations = [
        {
          id: 'db3e6ccd-7be2-4b0a-bab3-935e3a6252b6',
          client_id: '00dedc23-0b17-4e50-b84e-b2e8100dc93c',
          coach_id: 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f',
          created_at: '2025-09-20T21:02:06.16Z',
          updated_at: '2025-09-23T01:22:03.241803Z',
          last_message_at: '2025-09-23T01:22:03.241803Z',
          last_message_preview: 'Ho,a coach!',
          client_unread_count: 0,
          coach_unread_count: 1,
          // Información del coach
          coach_name: 'Franco Pomati',
          coach_avatar: null,
          coach_email: 'f.pomati@usal.edu.ar',
          coach_bio: 'Coach especializado en fitness y nutrición',
          coach_specialization: 'Fitness y Nutrición',
          // Información del cliente
          client_name: 'Cliente Demo',
          client_avatar: null,
          client_email: 'cliente@demo.com',
          // Información del contexto (simulando que el usuario es el coach)
          is_user_client: false,
          is_user_coach: true,
          other_person_name: 'Cliente Demo',
          other_person_avatar: null,
          unread_count: 1
        }
      ]
      
      return NextResponse.json({ 
        success: true, 
        conversations: mockConversations,
        message: 'Conversaciones cargadas (modo desarrollo)',
        mock: true
      })
    }

    // Verificar si las tablas existen
    const { data: tableCheck, error: tableError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === 'PGRST116') {
      // Tabla no existe
      console.log('Tablas de mensajes no existen aún, devolviendo lista vacía')
      return NextResponse.json({ 
        success: true, 
        conversations: [],
        message: 'Sistema de mensajes no configurado aún'
      })
    }

    // Obtener conversaciones del usuario (tanto como cliente como coach)
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`client_id.eq.${user.id},coach_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error obteniendo conversaciones:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener conversaciones' 
      }, { status: 500 })
    }

    // Si no hay conversaciones, devolver lista vacía con información útil
    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        conversations: [],
        message: 'No tienes conversaciones aún. Compra una actividad para empezar a chatear con tu coach.',
        info: 'El sistema de mensajes está configurado y listo para usar.'
      })
    }

    // Obtener información de coaches y clientes
    const coachIds = [...new Set(conversations.map(conv => conv.coach_id))]
    const clientIds = [...new Set(conversations.map(conv => conv.client_id))]
    
    let coachInfo: { [key: string]: any } = {}
    let clientInfo: { [key: string]: any } = {}
    
    // Obtener información de coaches
    if (coachIds.length > 0) {
      // Obtener datos de coaches
      const { data: coaches } = await supabase
        .from('coaches')
        .select('id, bio, specialization')
        .in('id', coachIds)
      
      // Obtener datos de user_profiles para coaches
      const { data: coachProfiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', coachIds)
      
      // Crear mapa de user profiles para coaches
      const coachProfileMap = new Map(coachProfiles?.map(profile => [profile.id, profile]))
      
      if (coaches) {
        coaches.forEach(coach => {
          const userProfile = coachProfileMap.get(coach.id)
          coachInfo[coach.id] = {
            name: userProfile?.full_name || 'Coach',
            avatar: userProfile?.avatar_url || null,
            email: null,
            bio: coach.bio || null,
            specialization: coach.specialization || null
          }
        })
      }
    }
    
    // Obtener información de clientes
    if (clientIds.length > 0) {
      // Obtener datos de user_profiles para clientes
      const { data: clientProfiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', clientIds)
      
      if (clientProfiles) {
        clientProfiles.forEach(client => {
          clientInfo[client.id] = {
            name: client.full_name || 'Cliente',
            avatar: client.avatar_url || null,
            email: null
          }
        })
      }
    }

    // Procesar conversaciones para incluir información del coach y cliente
    const processedConversations = conversations.map(conv => {
      const coach = coachInfo[conv.coach_id] || {}
      const client = clientInfo[conv.client_id] || {}
      const isUserClient = conv.client_id === user.id
      const isUserCoach = conv.coach_id === user.id
      
      return {
        ...conv,
        // Información del coach
        coach_name: coach.name || 'Coach',
        coach_avatar: coach.avatar || null,
        coach_email: coach.email || null,
        coach_bio: coach.bio || null,
        coach_specialization: coach.specialization || null,
        // Información del cliente
        client_name: client.name || 'Cliente',
        client_avatar: client.avatar || null,
        client_email: client.email || null,
        // Información del contexto (quién es el usuario)
        is_user_client: isUserClient,
        is_user_coach: isUserCoach,
        // Nombre y avatar del "otro" (la persona con quien chatea)
        other_person_name: isUserClient ? coach.name : client.name,
        other_person_avatar: isUserClient ? coach.avatar : client.avatar,
        // Contador de mensajes no leídos correcto
        unread_count: isUserClient ? conv.client_unread_count : conv.coach_unread_count
      }
    })

    return NextResponse.json({ 
      success: true, 
      conversations: processedConversations 
    })

  } catch (error) {
    console.error('Error en GET /api/messages/conversations:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { coach_id, content, message_type = 'text' } = await request.json()

    if (!coach_id || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'coach_id y content son requeridos' 
      }, { status: 400 })
    }

    // Crear o obtener conversación
    const { data: conversation, error: conversationError } = await supabase
      .rpc('create_conversation_if_not_exists', {
        p_client_id: user.id,
        p_coach_id: coach_id
      })

    if (conversationError) {
      console.error('Error creando/obteniendo conversación:', conversationError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al crear conversación' 
      }, { status: 500 })
    }

    // Crear mensaje
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation,
        sender_id: user.id,
        sender_type: 'client',
        content,
        message_type
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creando mensaje:', messageError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al enviar mensaje' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: message 
    })

  } catch (error) {
    console.error('Error en POST /api/messages/conversations:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
