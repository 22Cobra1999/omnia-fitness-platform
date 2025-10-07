import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface Message {
  id: string
  content: string
  message_type: string
  sender_id: string
  sender_type: 'client' | 'coach'
  created_at: string
  is_read: boolean
  read_at?: string
  is_edited: boolean
  edited_at?: string
  attachment_url?: string
  attachment_type?: string
}

interface Conversation {
  id: string
  client_id: string
  coach_id: string
  created_at: string
  updated_at: string
  last_message_at?: string
  last_message_preview?: string
  client_unread_count: number
  coach_unread_count: number
  // Información del coach
  coach_name?: string
  coach_avatar?: string
  coach_email?: string
  coach_bio?: string
  coach_specialization?: string
  // Información del cliente
  client_name?: string
  client_avatar?: string
  client_email?: string
  // Información del contexto
  is_user_client?: boolean
  is_user_coach?: boolean
  other_person_name?: string
  other_person_avatar?: string
  unread_count?: number
}

export function useMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener conversaciones
  const fetchConversations = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener conversaciones')
      }

      setConversations(data.conversations || [])
      
      // Si hay un mensaje indicando que las tablas no existen, mostrar info
      if (data.message) {
        console.log('📋 Sistema de mensajes:', data.message)
      }
    } catch (err) {
      console.error('Error obteniendo conversaciones:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Obtener mensajes de una conversación específica
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user || !conversationId) return

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener mensajes')
      }

      setMessages(prev => ({
        ...prev,
        [conversationId]: data.messages || []
      }))

      return data.messages || []
    } catch (err) {
      console.error('Error obteniendo mensajes:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return []
    }
  }, [user])

  // Enviar mensaje
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    messageType: string = 'text',
    attachmentUrl?: string,
    attachmentType?: string
  ) => {
    if (!user || !content.trim()) return null

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          message_type: messageType,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      // Actualizar mensajes localmente
      setMessages(prev => ({
        ...prev,
        [conversationId]: [
          ...(prev[conversationId] || []),
          data.message
        ]
      }))

      // Actualizar conversaciones para reflejar el nuevo mensaje
      await fetchConversations()

      return data.message
    } catch (err) {
      console.error('Error enviando mensaje:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    }
  }, [user, fetchConversations])

  // Crear nueva conversación
  const createConversation = useCallback(async (coachId: string, initialMessage: string) => {
    if (!user || !coachId || !initialMessage.trim()) return null

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coach_id: coachId,
          content: initialMessage.trim(),
          message_type: 'text'
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al crear conversación')
      }

      // Actualizar conversaciones
      await fetchConversations()

      return data.message
    } catch (err) {
      console.error('Error creando conversación:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    }
  }, [user, fetchConversations])

  // Obtener conversación por coach
  const getConversationByCoach = useCallback((coachId: string) => {
    return conversations.find(conv => conv.coach_id === coachId)
  }, [conversations])

  // Obtener mensajes de una conversación
  const getMessagesByConversation = useCallback((conversationId: string) => {
    return messages[conversationId] || []
  }, [messages])

  // Contar mensajes no leídos totales
  const getTotalUnreadCount = useCallback(() => {
    return conversations.reduce((total, conv) => {
      return total + conv.client_unread_count
    }, 0)
  }, [conversations])

  // Cargar conversaciones al montar el componente
  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  return {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    getConversationByCoach,
    getMessagesByConversation,
    getTotalUnreadCount,
    clearError: () => setError(null)
  }
}
