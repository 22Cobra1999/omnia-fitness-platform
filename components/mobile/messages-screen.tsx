"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

interface Conversation {
  id: string
  client_id: string
  coach_id: string
  last_message_preview: string | null
  last_message_at: string | null
  client_unread_count: number
  coach_unread_count: number
  coach_name?: string
  coach_avatar?: string
  client_name?: string
  client_avatar?: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'coach'
  content: string
  created_at: string
  is_read: boolean
}

export function MessagesScreen() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingUnreadRef = useRef(false)
  const hasLoadedConversationsRef = useRef(false)
  const isLoadingRef = useRef(false)

  const supabase = createClient()

  // Obtener la conversación seleccionada desde el estado
  const selectedConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId) || null
    : null

  // Determinar si el usuario es coach o cliente
  const [isCoach, setIsCoach] = useState<boolean | null>(null)

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return
      
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      setIsCoach(!!coachData)
    }

    checkUserRole()
  }, [user, supabase])

  // Obtener nombre y avatar del contacto
  const contactName = selectedConversation
    ? (isCoach ? selectedConversation.client_name : selectedConversation.coach_name) || 'Usuario'
    : null

  const contactAvatar = selectedConversation
    ? (isCoach ? selectedConversation.client_avatar : selectedConversation.coach_avatar)
    : null

  // Cargar conversaciones
  const loadConversations = useCallback(async (silent = false) => {
    if (!user || isCoach === null) {
      if (!silent) setLoading(false)
      return
    }

    // Evitar múltiples cargas simultáneas
    if (isLoadingRef.current && !silent) {
      return
    }

    try {
      if (!silent) {
        isLoadingRef.current = true
        setLoading(true)
      }
      
      // Obtener conversaciones del usuario
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(isCoach 
          ? `coach_id.eq.${user.id}` 
          : `client_id.eq.${user.id}`
        )
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (conversationsError) {
        console.error('Error cargando conversaciones:', conversationsError)
        if (!silent) {
          setLoading(false)
          isLoadingRef.current = false
        }
        return
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([])
        if (!silent) {
          setLoading(false)
          isLoadingRef.current = false
        }
        hasLoadedConversationsRef.current = true
        return
      }

      // Obtener IDs únicos de clientes y coaches
      const clientIds = [...new Set(conversationsData.map(c => c.client_id).filter(Boolean))]
      const coachIds = [...new Set(conversationsData.map(c => c.coach_id).filter(Boolean))]
      const allUserIds = [...new Set([...clientIds, ...coachIds])]

      // Obtener perfiles de usuarios
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', allUserIds)

      if (profilesError) {
        console.error('Error cargando perfiles:', profilesError)
        if (!silent) {
          setLoading(false)
          isLoadingRef.current = false
        }
        return
      }

      // Crear mapa de perfiles
      const profilesMap = new Map(
        (userProfiles || []).map(profile => [profile.id, profile])
      )

      // Formatear conversaciones con nombres y avatares
      const formattedConversations: Conversation[] = conversationsData.map(conv => {
        const coachProfile = profilesMap.get(conv.coach_id)
        const clientProfile = profilesMap.get(conv.client_id)

        return {
          ...conv,
          coach_name: coachProfile?.full_name || 'Coach',
          coach_avatar: coachProfile?.avatar_url || null,
          client_name: clientProfile?.full_name || 'Cliente',
          client_avatar: clientProfile?.avatar_url || null,
        }
      })

      setConversations(formattedConversations)
      hasLoadedConversationsRef.current = true
      
      if (!silent) {
        setLoading(false)
        isLoadingRef.current = false
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
      if (!silent) {
        setLoading(false)
        isLoadingRef.current = false
      }
    }
  }, [user, isCoach, supabase])

  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user || isCoach === null) return

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error cargando mensajes:', messagesError)
        return
      }

      setMessages(messagesData || [])

      // Marcar mensajes como leídos
      if (isUpdatingUnreadRef.current) return

      const unreadMessages = (messagesData || []).filter(
        (msg: Message) => !msg.is_read && msg.sender_id !== user.id
      )

      if (unreadMessages.length > 0) {
        isUpdatingUnreadRef.current = true

        // Actualizar mensajes como leídos
        const messageIds = unreadMessages.map((msg: Message) => msg.id)
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', messageIds)

        // Actualizar contador de no leídos en la conversación
        const updateField = isCoach ? 'coach_unread_count' : 'client_unread_count'
        await supabase
          .from('conversations')
          .update({ [updateField]: 0 })
          .eq('id', conversationId)

        // Actualizar estado local
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, [updateField]: 0 }
            : conv
        ))

        isUpdatingUnreadRef.current = false
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    }
  }, [user, isCoach, supabase])

  // Enviar mensaje
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversationId || !user || isCoach === null || sending) return

    setSending(true)
    try {
      const { data: newMessageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversationId,
          sender_id: user.id,
          sender_type: isCoach ? 'coach' : 'client',
          content: newMessage.trim(),
        })
        .select()
        .single()

      if (messageError) {
        console.error('Error enviando mensaje:', messageError)
        return
      }

      // Agregar mensaje a la lista local
      setMessages(prev => [...prev, newMessageData])

      // Actualizar última mensaje en conversación
      const updateField = isCoach ? 'coach_unread_count' : 'client_unread_count'
      const otherUnreadField = isCoach ? 'client_unread_count' : 'coach_unread_count'

      await supabase
        .from('conversations')
        .update({
          last_message_preview: newMessage.trim().substring(0, 50),
          last_message_at: new Date().toISOString(),
          last_message_id: newMessageData.id,
          [otherUnreadField]: supabase.raw(`${otherUnreadField} + 1`),
        })
        .eq('id', selectedConversationId)

      // Actualizar estado local
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversationId 
          ? {
              ...conv,
              last_message_preview: newMessage.trim().substring(0, 50),
              last_message_at: new Date().toISOString(),
            }
          : conv
      ))

      setNewMessage('')
    } catch (error) {
      console.error('Error enviando mensaje:', error)
    } finally {
      setSending(false)
    }
  }, [newMessage, selectedConversationId, user, isCoach, sending, supabase])

  // Formatear tiempo relativo
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Efectos - Cargar conversaciones inicialmente
  useEffect(() => {
    if (!user) {
      setLoading(false)
      hasLoadedConversationsRef.current = false
      return
    }
    
    // Solo cargar si no hemos cargado antes y ya sabemos el rol
    if (isCoach !== null && !hasLoadedConversationsRef.current) {
      loadConversations(false)
    }
  }, [user, isCoach]) // Removido loadConversations de dependencias para evitar loops

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]) // Removido loadMessages para evitar loops

  // Polling para nuevos mensajes
  useEffect(() => {
    if (!user || isCoach === null || !hasLoadedConversationsRef.current) return

    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }

      pollingIntervalRef.current = setInterval(() => {
        if (!isUpdatingUnreadRef.current && !isLoadingRef.current) {
          // Usar silent=true para no mostrar loading durante el polling
          loadConversations(true)
          if (selectedConversationId) {
            loadMessages(selectedConversationId)
          }
        }
      }, 5000) // Poll cada 5 segundos
    }

    startPolling()

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isCoach, selectedConversationId]) // Removido loadConversations y loadMessages para evitar loops

  // Mostrar loading solo si hay usuario y aún estamos determinando el rol o cargando
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-[#121212]">
        <div className="text-center text-gray-400">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inicia sesión para ver tus mensajes</p>
        </div>
      </div>
    )
  }

  if (loading || isCoach === null) {
    return (
      <div className="flex items-center justify-center h-full bg-[#121212]">
        <div className="text-white">Cargando mensajes...</div>
      </div>
    )
  }

  // Vista de chat individual
  if (selectedConversationId && selectedConversation) {
    return (
      <div className="flex flex-col h-full bg-[#121212]">
        {/* Header con nombre del contacto y botón de volver */}
        <div className="sticky top-0 z-10 bg-[#1E1E1E] border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConversationId(null)}
            className="p-2 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {contactAvatar && (
            <img
              src={contactAvatar}
              alt={contactName || 'Usuario'}
              className="w-8 h-8 rounded-full"
            />
          )}
          
          <h1 className="text-lg font-semibold text-white flex-1">
            {contactName || 'Usuario'}
          </h1>
        </div>

        {/* Lista de mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-[#FF7939] text-white'
                      : 'bg-[#2A2A2A] text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Input de mensaje */}
        <div className="sticky bottom-0 bg-[#1E1E1E] border-t border-gray-800 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-[#2A2A2A] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF7939]"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-[#FF7939] hover:bg-[#FF6B35] text-white px-4"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Vista de lista de conversaciones
  return (
    <div className="flex flex-col h-full bg-[#121212]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1E1E1E] border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg font-semibold text-white">Mensajes</h1>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes conversaciones aún</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {conversations.map((conversation) => {
              const unreadCount = isCoach 
                ? conversation.coach_unread_count 
                : conversation.client_unread_count
              
              const contactName = isCoach 
                ? conversation.client_name 
                : conversation.coach_name
              
              const contactAvatar = isCoach 
                ? conversation.client_avatar 
                : conversation.coach_avatar

              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#1E1E1E] transition-colors"
                >
                  {contactAvatar ? (
                    <img
                      src={contactAvatar}
                      alt={contactName || 'Usuario'}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FF7939] flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {(contactName || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium truncate">{contactName || 'Usuario'}</h3>
                      {conversation.last_message_at && (
                        <span className="text-xs text-gray-400 ml-2">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.last_message_preview || 'Sin mensajes'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-[#FF7939] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
