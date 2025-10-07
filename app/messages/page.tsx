"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, ArrowLeft, Send, MoreVertical } from "lucide-react"
import { useMessages } from "@/hooks/use-messages"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    conversations, 
    messages,
    loading, 
    error, 
    fetchConversations, 
    fetchMessages,
    sendMessage,
    getTotalUnreadCount
  } = useMessages()

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  const handleConversationClick = async (conversationId: string) => {
    setSelectedConversation(conversationId)
    await fetchMessages(conversationId)
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sending) return

    setSending(true)
    try {
      await sendMessage(selectedConversation, newMessage.trim())
      setNewMessage("")
      // Recargar mensajes después de enviar
      await fetchMessages(selectedConversation)
    } catch (error) {
      console.error('Error enviando mensaje:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const selectedConversationData = conversations.find(conv => conv.id === selectedConversation)
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : []
  const hasNewMessages = getTotalUnreadCount() > 0

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white px-6">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[#FF7939]" />
          <h1 className="text-2xl font-bold mb-2">Inicia sesión para ver tus mensajes</h1>
          <p className="text-gray-400 mb-6">Conecta con tus coaches y mantén el contacto</p>
          <Button 
            onClick={() => router.push('/')}
            className="bg-[#FF7939] hover:bg-[#E86A2D] text-white"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  // Si hay una conversación seleccionada, mostrar el chat
  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header del chat */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="text-white hover:bg-gray-800 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Avatar de la otra persona */}
            <div className="w-10 h-10 rounded-full bg-[#FF7939] flex items-center justify-center">
              {selectedConversationData?.other_person_avatar ? (
                <img 
                  src={selectedConversationData.other_person_avatar} 
                  alt={selectedConversationData.other_person_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {selectedConversationData?.other_person_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-white">
                {selectedConversationData?.other_person_name || 'Usuario'}
              </h3>
              <p className="text-xs text-gray-400">En línea</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 p-2"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto pt-16 pb-20 px-4">
          {currentMessages.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No hay mensajes en esta conversación</p>
              <p className="text-sm">Envía el primer mensaje para empezar</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl ${
                      message.sender_id === user.id
                        ? 'bg-[#FF7939] text-white rounded-br-md'
                        : 'bg-gray-700 text-gray-300 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input de mensaje */}
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#FF7939] rounded-full pr-12"
                disabled={sending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-[#FF7939] hover:bg-[#E86A2D] text-white rounded-full p-3 disabled:opacity-50"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Vista principal - Lista de conversaciones
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <MessageCircle className="w-6 h-6 text-[#FF7939]" />
          <h1 className="text-xl font-bold">Mensajes</h1>
          {hasNewMessages && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="pt-16">
        {loading ? (
          <div className="p-6 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-[#FF7939] border-t-transparent rounded-full mx-auto mb-3"></div>
            <p>Cargando conversaciones...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400">
            <p>Error: {error}</p>
            <Button 
              onClick={() => fetchConversations()}
              className="mt-3 bg-[#FF7939] hover:bg-[#E86A2D] text-white"
            >
              Reintentar
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-medium mb-3">No tienes conversaciones aún</h3>
            <p className="text-gray-400 mb-4">
              Compra una actividad para empezar a chatear con tu coach
            </p>
            <div className="text-sm text-[#FF7939] bg-[#FF7939]/10 p-3 rounded-lg">
              💡 El sistema de mensajes está configurado y listo para usar
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const otherPersonInitials = conversation.other_person_name 
                ? conversation.other_person_name.split(' ').map(n => n[0]).join('').toUpperCase()
                : 'U'
              
              const timeAgo = conversation.last_message_at 
                ? formatDistanceToNow(new Date(conversation.last_message_at), { 
                    addSuffix: true, 
                    locale: es 
                  })
                : 'Sin mensajes'

              return (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full text-left p-4 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar de la otra persona (coach o cliente) */}
                    <div className="w-12 h-12 rounded-full bg-[#FF7939] flex items-center justify-center flex-shrink-0">
                      {conversation.other_person_avatar ? (
                        <img 
                          src={conversation.other_person_avatar} 
                          alt={conversation.other_person_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold">{otherPersonInitials}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-white truncate">
                          {conversation.other_person_name || 'Usuario'}
                        </p>
                        <div className="flex items-center space-x-2">
                          {(conversation.unread_count || 0) > 0 && (
                            <span className="bg-[#FF7939] text-white text-xs px-2 py-1 rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{timeAgo}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.last_message_preview || 'Saluda a tu coach'}
                      </p>
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