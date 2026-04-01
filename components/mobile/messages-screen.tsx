"use client"

import React from 'react'

import { MessageCircle } from 'lucide-react'
import { useMessagesScreenLogic } from '@/hooks/mobile/useMessagesScreenLogic'
import { ChatList } from './messages/ChatList'
import { ChatHeader } from './messages/ChatHeader'
import { MessageList } from './messages/MessageList'
import { ChatInput } from './messages/ChatInput'
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"

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
    showLimitWarning,
    loadingMessages
  } = useMessagesScreenLogic()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center text-gray-400">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inicia sesión para ver tus mensajes</p>
        </div>
      </div>
    )
  }

  if (loading || isCoach === null) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="flex flex-col items-center gap-4">
          <OmniaLoader />
          <div className="text-gray-400 font-bold tracking-tight uppercase text-[10px]">Cargando...</div>
        </div>
      </div>
    )
  }

  // Vista de chat individual
  if (selectedConversationId && selectedConversation) {
    return (
      <div className="flex flex-col h-full bg-black">
        <ChatHeader
          contactName={contactName}
          contactAvatar={contactAvatar}
          onBack={() => setSelectedConversationId(null)}
        />

        {loadingMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <OmniaLoader />
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-4">
              Cargando mensajes...
            </span>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={user.id}
            isCoach={!!isCoach}
          />
        )}

        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={sendMessage}
          disabled={sending}
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
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black border-b border-white/5 px-4 py-3">
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
