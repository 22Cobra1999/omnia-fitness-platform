import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { conversationId } = params

    // Verificar que el usuario puede acceder a esta conversación
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, client_id, coach_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Conversación no encontrada' 
      }, { status: 404 })
    }

    if (conversation.client_id !== user.id && conversation.coach_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'No tienes acceso a esta conversación' 
      }, { status: 403 })
    }

    // Obtener mensajes de la conversación
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        sender_id,
        sender_type,
        created_at,
        is_read,
        read_at,
        is_edited,
        edited_at,
        attachment_url,
        attachment_type
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error obteniendo mensajes:', messagesError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener mensajes' 
      }, { status: 500 })
    }

    // Marcar mensajes como leídos si el usuario es el destinatario
    const unreadMessages = messages?.filter(msg => 
      !msg.is_read && msg.sender_id !== user.id
    ) || []

    if (unreadMessages.length > 0) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadMessages.map(msg => msg.id))

      if (updateError) {
        console.error('Error marcando mensajes como leídos:', updateError)
      }

      // Actualizar contador de no leídos en la conversación
      const updateField = user.id === conversation.client_id 
        ? 'client_unread_count' 
        : 'coach_unread_count'

      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId)
    }

    return NextResponse.json({ 
      success: true, 
      messages: messages || [] 
    })

  } catch (error) {
    console.error('Error en GET /api/messages/[conversationId]:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { conversationId } = params
    const { content, message_type = 'text', attachment_url, attachment_type } = await request.json()

    if (!content) {
      return NextResponse.json({ 
        success: false, 
        error: 'content es requerido' 
      }, { status: 400 })
    }

    // Verificar que el usuario puede enviar mensajes a esta conversación
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, client_id, coach_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Conversación no encontrada' 
      }, { status: 404 })
    }

    if (conversation.client_id !== user.id && conversation.coach_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'No tienes acceso a esta conversación' 
      }, { status: 403 })
    }

    // Determinar el tipo de remitente
    const sender_type = user.id === conversation.client_id ? 'client' : 'coach'

    // Crear mensaje
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type,
        content,
        message_type,
        attachment_url,
        attachment_type
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
    console.error('Error en POST /api/messages/[conversationId]:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
