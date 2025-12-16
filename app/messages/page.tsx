"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/supabase-client'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingUnreadRef = useRef(false)

  // Obtener la conversación seleccionada desde el estado
  const selectedConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId) || null
    : null

  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()
      
      // Determinar si el usuario es cliente o coach verificando si existe en coaches
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      const isClient = !coachData
      
      // Obtener conversaciones según el tipo de usuario (sin joins anidados)
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (isClient) {
        query = query.eq('client_id', user.id)
      } else {
        query = query.eq('coach_id', user.id)
      }

      const { data: conversationsData, error } = await query

      if (error) {
        console.error('Error cargando conversaciones:', error)
        setConversations([])
        return
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([])
        return
      }

      // Obtener IDs únicos de clientes y coaches
      const clientIds = [...new Set(conversationsData.map((c: any) => c.client_id))]
      const coachIds = [...new Set(conversationsData.map((c: any) => c.coach_id))]

      // Obtener datos de user_profiles para clientes y coaches
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', [...clientIds, ...coachIds])

      // Crear un mapa de IDs a perfiles
      const profilesMap = new Map()
      if (userProfiles) {
        userProfiles.forEach((profile: any) => {
          profilesMap.set(profile.id, {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          })
        })
      }

      // Formatear conversaciones con datos de usuario
      const formattedConversations = conversationsData.map((conv: any) => {
        const coachProfile = profilesMap.get(conv.coach_id)
        const clientProfile = profilesMap.get(conv.client_id)
        
        return {
          id: conv.id,
          client_id: conv.client_id,
          coach_id: conv.coach_id,
          last_message_preview: conv.last_message_preview,
          last_message_at: conv.last_message_at,
          client_unread_count: conv.client_unread_count || 0,
          coach_unread_count: conv.coach_unread_count || 0,
          coach_name: coachProfile?.full_name || 'Coach',
          coach_avatar: coachProfile?.avatar_url,
          client_name: clientProfile?.full_name || 'Cliente',
          client_avatar: clientProfile?.avatar_url,
        }
      })

      setConversations(formattedConversations)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadMessages = useCallback(async (conversationId: string, updateUnreadCounters: boolean = true) => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error cargando mensajes:', error)
      } else {
        setMessages(data || [])
        
        // Marcar mensajes como leídos solo si updateUnreadCounters es true
        if (updateUnreadCounters && data && data.length > 0) {
          const unreadMessages = data.filter((msg: Message) => !msg.is_read && msg.sender_id !== user.id)
          if (unreadMessages.length > 0) {
            isUpdatingUnreadRef.current = true
            try {
              const messageIds = unreadMessages.map(msg => msg.id)
              await supabase
                .from('messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .in('id', messageIds)
              
              // Actualizar contador de no leídos en la conversación
              const { data: coachData } = await supabase
                .from('coaches')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()
              
              const isClient = !coachData
              if (isClient !== undefined) {
                await supabase
                  .from('conversations')
                  .update({
                    [isClient ? 'client_unread_count' : 'coach_unread_count']: 0
                  })
                  .eq('id', conversationId)
                
                // Actualizar solo el contador en el estado local sin recargar todo
                setConversations(prev => prev.map(conv => 
                  conv.id === conversationId
                    ? { ...conv, [isClient ? 'client_unread_count' : 'coach_unread_count']: 0 }
                    : conv
                ))
              }
            } finally {
              isUpdatingUnreadRef.current = false
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    }
  }, [user])

  // useEffect para cargar conversaciones al montar
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadConversations()
  }, [user, loadConversations, router])

  // useEffect para cargar mensajes cuando se selecciona una conversación
  useEffect(() => {
    // Limpiar intervalo anterior
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    if (selectedConversationId) {
      loadMessages(selectedConversationId)
      // Polling para nuevos mensajes cada 5 segundos (aumentado para evitar loops)
      pollingIntervalRef.current = setInterval(() => {
        if (!isUpdatingUnreadRef.current) {
          loadMessages(selectedConversationId, false) // false = no actualizar contadores
        }
      }, 5000)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [selectedConversationId, loadMessages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return

    try {
      setSending(true)
      const supabase = createClient()
      
      // Determinar tipo de remitente verificando si existe en coaches
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      const senderType = coachData ? 'coach' : 'client'

      // Enviar mensaje
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          sender_type: senderType,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select()
        .single()

      if (error) {
        console.error('Error enviando mensaje:', error)
        alert('Error al enviar el mensaje')
      } else {
        setNewMessage('')
        // Recargar mensajes
        if (selectedConversationId) {
          loadMessages(selectedConversationId, false)
        }
        // Actualizar solo la conversación actual en el estado local
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id
            ? { 
                ...conv, 
                last_message_preview: newMessage.trim().substring(0, 100),
                last_message_at: new Date().toISOString()
              }
            : conv
        ))
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      alert('Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes}m`
    if (hours < 24) return `Hace ${hours}h`
    if (days < 7) return `Hace ${days}d`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  if (!user) {
    return null
  }

  // Obtener el nombre y avatar del contacto para el header
  const contactName = selectedConversation
    ? (user.id === selectedConversation.client_id 
        ? selectedConversation.coach_name 
        : selectedConversation.client_name)
    : null
  
  const contactAvatar = selectedConversation
    ? (user.id === selectedConversation.client_id 
        ? selectedConversation.coach_avatar 
        : selectedConversation.client_avatar)
    : null

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header dinámico */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (selectedConversationId) {
              setSelectedConversationId(null)
            } else {
              router.back()
            }
          }}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {contactAvatar && (
          <div className="w-8 h-8 rounded-full bg-[#FF7939]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={contactAvatar}
              alt={contactName || 'Contacto'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="text-lg font-semibold">
          {contactName || 'Mensajes'}
        </h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Cargando...</p>
        </div>
      ) : selectedConversation ? (
        /* Vista de conversación */
        <div className="flex-1 flex flex-col">

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === user.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-[#FF7939] text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input de mensaje */}
          <div className="p-4 border-t border-white/10">
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
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#FF7939]"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-[#FF7939] hover:bg-[#E86A2D] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Lista de conversaciones */
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No tienes conversaciones aún</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {conversations.map((conversation) => {
                const unreadCount = user.id === conversation.client_id
                  ? conversation.client_unread_count
                  : conversation.coach_unread_count
                const otherName = user.id === conversation.client_id
                  ? conversation.coach_name
                  : conversation.client_name
                const otherAvatar = user.id === conversation.client_id
                  ? conversation.coach_avatar
                  : conversation.client_avatar

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className="w-full p-4 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#FF7939]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {otherAvatar ? (
                          <img
                            src={otherAvatar}
                            alt={otherName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MessageCircle className="w-6 h-6 text-[#FF7939]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate">{otherName}</h3>
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400 truncate">
                            {conversation.last_message_preview || 'Sin mensajes'}
                          </p>
                          {unreadCount > 0 && (
                            <span className="bg-[#FF7939] text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
