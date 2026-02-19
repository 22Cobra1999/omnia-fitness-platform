"use client"

import React from 'react'
import { useMessagesLogic } from './hooks/useMessagesLogic'
import { MessagesHeader } from './components/MessagesHeader'
import { ConversationList } from './components/ConversationList'
import { MessageList } from './components/MessageList'
import { MessageInput } from './components/MessageInput'

export default function MessagesPage() {
  const {
    user,
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    selectedConversation,
    messages,
    newMessage,
    setNewMessage,
    loading,
    sending,
    sendMessage,
    formatTime,
    router
  } = useMessagesLogic()

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

  const handleBack = () => {
    if (selectedConversationId) {
      setSelectedConversationId(null)
    } else {
      router.back()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header dinámico */}
      <MessagesHeader
        contactName={contactName || null}
        contactAvatar={contactAvatar}
        onBack={handleBack}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Cargando...</p>
        </div>
      ) : selectedConversation ? (
        /* Vista de conversación */
        <div className="flex-1 flex flex-col">
          <MessageList
            messages={messages}
            userId={user.id}
            formatTime={formatTime}
          />
          <MessageInput
            value={newMessage}
            onChange={setNewMessage}
            onSend={sendMessage}
            disabled={sending}
          />
        </div>
      ) : (
        /* Lista de conversaciones */
        <ConversationList
          conversations={conversations}
          userId={user.id}
          onSelectConversation={setSelectedConversationId}
          formatTime={formatTime}
        />
      )}
    </div>
  )
}
