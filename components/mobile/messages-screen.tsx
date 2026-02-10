"use client"

import React from 'react'

import { MessageCircle } from 'lucide-react'
import { useMessagesScreenLogic } from '@/hooks/mobile/useMessagesScreenLogic'
import { ChatList } from './messages/ChatList'
import { ChatHeader } from './messages/ChatHeader'
import { MessageList } from './messages/MessageList'
import { ChatInput } from './messages/ChatInput'

export function MessagesScreen() {
  const {
    user,
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    messages,
    newMessage,
    setNewMessage,
    loading,
    sending,
    isCoach,
    selectedConversation,
    contactName,
    contactAvatar,
    sendMessage,
    remainingMessages,
    isLimitReached,
    showLimitWarning
  } = useMessagesScreenLogic()

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
        <ChatHeader
          contactName={contactName}
          contactAvatar={contactAvatar}
          onBack={() => setSelectedConversationId(null)}
        />

        <MessageList
          messages={messages}
          currentUserId={user.id}
        />

        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={sendMessage}
          disabled={!newMessage.trim()}
          sending={sending}
          remainingMessages={remainingMessages}
          isLimitReached={isLimitReached}
          showLimitWarning={showLimitWarning}
        />
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
        <ChatList
          conversations={conversations}
          isCoach={isCoach}
          onSelectConversation={setSelectedConversationId}
        />
      </div>
    </div>
  )
}
